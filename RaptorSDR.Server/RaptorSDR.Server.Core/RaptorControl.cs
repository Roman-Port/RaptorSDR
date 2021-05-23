using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.Dispatchers;
using RaptorSDR.Server.Common.PluginComponents;
using RaptorSDR.Server.Core.Plugin;
using RaptorSDR.Server.Core.Radio;
using RaptorSDR.Server.Core.Web;
using RaptorSDR.Server.Core.Web.Auth;
using RaptorSDR.Server.Core.Web.HTTP;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;

namespace RaptorSDR.Server.Core
{
    /// <summary>
    /// The main server
    /// </summary>
    public class RaptorControl : IRaptorControl
    {
        public const int VERSION_MAJOR = 1;
        public const int VERSION_MINOR = 0;
        
        public RaptorControl(IRaptorSettings settings)
        {
            this.settings = settings;
            installation = new RaptorInstallation(settings.InstallPath);

            //Set up HTTP
            http = new RaptorHttpServer(this, settings.Listening);
            rpc = new RaptorWebSocketEndpointServer(this, http, "/rpc");

            //Create dispatchers for RPC
            rpcDispatcher = new RaptorDispatcherOpcode(rpc);
            rpcDispatcherPlugin = new RaptorDispatcherOpcode(rpcDispatcher.CreateSubscription("PLUGIN"));
            rpcDispatcherDataProvider = new RaptorDispatcherOpcode(rpcDispatcher.CreateSubscription("DATA_PROVIDER"));

            //Make parts
            radio = new RaptorRadio(this);
            vfo = new RaptorVfo(this);
            auth = new RaptorAuthManager(settings.InstallPath + "/auth.json");
            authApi = new RaptorAuthApi(this, http);

            //Add endpoints to all files in the web folder
            foreach(var f in new DirectoryInfo(settings.InstallPath).CreateSubdirectory("web").EnumerateFiles())
            {
                http.BindToEndpoint("/" + f.Name, (RaptorHttpContext ctx) =>
                {
                    //Determine MIME type
                    string mime = "application/octet-stream";
                    switch(f.Extension)
                    {
                        case ".js": mime = "text/javascript"; break;
                        case ".html": mime = "text/html"; break;
                    }

                    //Set up and stream
                    ctx.ResponseHeaders.Add("Content-Type", mime);
                    using (FileStream fs = new FileStream(f.FullName, FileMode.Open, FileAccess.Read))
                        fs.CopyTo(ctx.OutputStream);
                });
            }
        }

        public RaptorNamespace Id => new RaptorNamespace("RaptorSDR");

        public IRaptorControl Control => this;

        public RaptorInstallation Installation { get => installation; }
        public RaptorDispatcherOpcode Rpc => rpcDispatcher;
        public RaptorDispatcherOpcode RpcPluginDispatcher => rpcDispatcherPlugin;

        public IRaptorAuthManager Auth => auth;
        public int BufferSize => 65536;
        public IReadOnlyList<IPluginDemodulator> PluginDemodulators => pluginDemodulators;
        public IReadOnlyList<IPluginSource> PluginSources => pluginSources;
        public IRaptorRadio Radio => radio;
        public IRaptorVfo Vfo => vfo;

        private IRaptorSettings settings;
        private RaptorInstallation installation;
        private RaptorRadio radio;
        private RaptorVfo vfo;
        private RaptorAuthManager auth;
        private RaptorAuthApi authApi;

        private List<RaptorPluginPackage> plugins = new List<RaptorPluginPackage>();
        private List<IRaptorDataProvider> dataProviders = new List<IRaptorDataProvider>();
        private List<IPluginDemodulator> pluginDemodulators = new List<IPluginDemodulator>();
        private List<IPluginSource> pluginSources = new List<IPluginSource>();

        private RaptorHttpServer http;
        private RaptorWebSocketEndpointServer rpc;

        private RaptorDispatcherOpcode rpcDispatcher;
        private RaptorDispatcherOpcode rpcDispatcherPlugin;
        private RaptorDispatcherOpcode rpcDispatcherDataProvider;

        public void Init()
        {
            //Load plugins
            Log(RaptorLogLevel.LOG, "RaptorControl", "Loading plugins...");
            int loaded = new PluginManager(this).UnpackPluginFolder(installation.Plugins.FullName, plugins);
            Log(RaptorLogLevel.LOG, "RaptorControl", $"Loaded {loaded} plugins.");

            //Initialize plugins
            foreach (var p in plugins)
            {
                Log(RaptorLogLevel.LOG, "RaptorControl", $"Initializing plugin {p.DeveloperName}.{p.PluginName}...");
                p.Server.Init();
            }

            //Log that plugin loading is complete
            Log(RaptorLogLevel.LOG, "RaptorControl", $"Initialized {loaded} plugins.");

            //If no plugins loaded, warn
            if (loaded == 0)
                Log(RaptorLogLevel.WARN, "RaptorControl", "WARNING: No plugins were loaded!");

            //Add core HTTP endpoints
            http.BindToEndpoint("/info", EndpointInfo);
            http.BindToEndpoint("/packages", EndpointPackages);

            //Start HTTP server
            http.Start();

            //Done
            Log(RaptorLogLevel.LOG, "RaptorControl", $"Server ready Listening on {settings.Listening.ToString()}.");
        }

        private void EndpointInfo(RaptorHttpContext ctx)
        {
            //Create
            JObject info = new JObject();
            info["version_major"] = VERSION_MAJOR;
            info["version_minor"] = VERSION_MINOR;
            info["plugins"] = new JArray();
            foreach(var p in plugins)
            {
                JObject plugin = new JObject();
                plugin["developer_name"] = p.DeveloperName;
                plugin["plugin_name"] = p.PluginName;
                plugin["frontends"] = new JArray();
                foreach(var f in p.Frontends)
                {
                    JObject frontend = new JObject();
                    frontend["name"] = f.Name;
                    frontend["platform"] = f.Platform;
                    frontend["size"] = f.Binary.Length;
                    frontend["sha256"] = f.Sha256;
                    ((JArray)plugin["frontends"]).Add(frontend);
                }
                ((JArray)info["plugins"]).Add(plugin);
            }
            info["providers"] = new JArray();
            foreach(var p in dataProviders)
            {
                JObject provider = new JObject();
                provider["id"] = p.Id.ToString();
                provider["name"] = p.DisplayName;
                provider["type"] = p.GetType().FullName.Split('`')[0];
                provider["info"] = new JObject();
                p.BuildInfo((JObject)provider["info"]);
                ((JArray)info["providers"]).Add(provider);
            }

            //Send
            ctx.ResponseHeaders.Add("content-type", "application/json");
            using (StreamWriter sw = new StreamWriter(ctx.OutputStream))
                sw.Write(JsonConvert.SerializeObject(info, Formatting.Indented));
        }

        private void EndpointPackages(RaptorHttpContext ctx)
        {
            //Load list of SHA-256 hashes to use
            string[] hashes;
            using (StreamReader sr = new StreamReader(ctx.InputStream))
                hashes = JsonConvert.DeserializeObject<string[]>(sr.ReadToEnd());

            //Loop through these hashes and find each
            RaptorPluginFrontend[] frontends = new RaptorPluginFrontend[hashes.Length];
            for(int i = 0; i<hashes.Length; i++)
            {
                if (!FindFrontendByHash(hashes[i], out frontends[i]))
                {
                    ctx.StatusCode = HttpStatusCode.NotFound;
                    return;
                }
            }

            //We know we have them all. Send all
            for(int i = 0; i<frontends.Length; i++)
            {
                ctx.OutputStream.Write(BitConverter.GetBytes((uint)frontends[i].Binary.Length), 0, 4);
                ctx.OutputStream.Write(frontends[i].Binary, 0, frontends[i].Binary.Length);
            }
        }

        private bool FindFrontendByHash(string hash, out RaptorPluginFrontend frontend)
        {
            foreach(var p in plugins)
            {
                if (p.GetFrontendByHash(hash, out frontend))
                    return true;
            }
            frontend = null;
            return false;
        }

        public void Log(RaptorLogLevel level, string topic, string message)
        {
            settings.Log(level, topic, message);
        }

        public IRaptorEndpoint RegisterDataProvider(IRaptorDataProvider provider)
        {
            dataProviders.Add(provider);
            return rpcDispatcherDataProvider.CreateSubscription(provider.Id.ToString());
        }

        public void RegisterPluginDemodulator(RaptorPlugin plugin, IPluginDemodulator demodulator)
        {
            pluginDemodulators.Add(demodulator);
        }
    }
}
