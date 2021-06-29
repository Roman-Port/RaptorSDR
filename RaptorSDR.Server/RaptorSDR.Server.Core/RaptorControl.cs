using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.Dispatchers;
using RaptorSDR.Server.Common.PluginComponents;
using RaptorSDR.Server.Common.WebStream;
using RaptorSDR.Server.Core.Plugin;
using RaptorSDR.Server.Core.Radio;
using RaptorSDR.Server.Core.Web;
using RaptorSDR.Server.Core.Web.Auth;
using RaptorSDR.Server.Core.Web.HTTP;
using RaptorSDR.Server.Core.Web.WebStream;
using RaptorSDR.Server.Core.Web.WebPackage;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Reflection;
using System.Text;
using System.Threading;
using RaptorSDR.Server.Common.Auth;

namespace RaptorSDR.Server.Core
{
    /// <summary>
    /// The main server
    /// </summary>
    public unsafe class RaptorControl : IRaptorControl
    {
        public const int VERSION_MAJOR = 1;
        public const int VERSION_MINOR = 0;
        
        public RaptorControl(IRaptorSettings settings)
        {
            this.settings = settings;
            installation = new RaptorInstallation(settings.InstallPath);

            //Log info
            Log(RaptorLogLevel.LOG, "RaptorControl", $"Using user data path {settings.InstallPath}");

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
            auth = new RaptorAuthManager(this, settings.InstallPath + "/auth.json");
            authApi = new RaptorAuthApi(this, http);

            //Bind audio
            vfo.OnAudioEmitted += Vfo_OnAudioEmitted;
            vfo.OnAudioReconfigured += Vfo_OnAudioReconfigured;

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

            //Add the "index.html" page
            http.BindToEndpoint("/", (RaptorHttpContext ctx) =>
            {
                ctx.ResponseHeaders.Add("Content-Type", "text/html");
                using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream("RaptorSDR.Server.Core.Web.index.html"))
                    s.CopyTo(ctx.OutputStream);
            });
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
        public RaptorHttpServer Http => http;
        public RaptorStatus ServerStatus => RaptorStatus.NEEDS_SETUP;

        private IRaptorSettings settings;
        private RaptorInstallation installation;
        private RaptorRadio radio;
        private RaptorVfo vfo;
        private RaptorAuthManager auth;
        private RaptorAuthApi authApi;

        private RaptorWebPackageEndpoint packagesFrontend = new RaptorWebPackageEndpoint();
        private RaptorWebPackageEndpoint packagesIcons = new RaptorWebPackageEndpoint();

        private List<RaptorPluginPackage> plugins = new List<RaptorPluginPackage>();
        private List<string> streams = new List<string>();
        private List<IRaptorDataProvider> dataProviders = new List<IRaptorDataProvider>();
        private List<IPluginDemodulator> pluginDemodulators = new List<IPluginDemodulator>();
        private List<IPluginSource> pluginSources = new List<IPluginSource>();
        private List<IPluginAudio> pluginAudio = new List<IPluginAudio>();
        private List<object> pluginInterfaces = new List<object>();

        private RaptorHttpServer http;
        private RaptorWebSocketEndpointServer rpc;

        private RaptorDispatcherOpcode rpcDispatcher;
        private RaptorDispatcherOpcode rpcDispatcherPlugin;
        private RaptorDispatcherOpcode rpcDispatcherDataProvider;
        private IRaptorEndpoint rpcPostConnected;
        private IRaptorEndpoint rpcDirectoryListing;
        private IRaptorEndpoint rpcDirectoryDrives;
        private IRaptorEndpoint rpcDirectoryVerify;
        private IRaptorEndpoint rpcPing;

        public void Init()
        {
            //Make sure the managed folder exists
            if(!Directory.Exists(settings.ManagedPath))
            {
                Log(RaptorLogLevel.LOG, "RaptorControl", $"Managed folder does not exist. Creating one at {settings.ManagedPath}...");
                Directory.CreateDirectory(settings.ManagedPath);
            }
            
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
            http.BindToEndpoint("/packages", packagesFrontend.HandleHttpRequest);
            http.BindToEndpoint("/icons", packagesIcons.HandleHttpRequest);

            //Register a command to send a message when a client connects. We do this at the end on purpose so that it's sent after all data providers have processed it
            rpcPostConnected = rpcDispatcher.CreateSubscription("LOGIN_COMPLETED");
            rpcPostConnected.OnClientConnected += RaptorControl_OnClientConnected;

            //Create directory listing command
            rpcDirectoryListing = rpcDispatcher.CreateSubscription("FILE_DIR_LISTING");
            rpcDirectoryListing.OnMessage += RpcDirectoryListing_OnMessage;

            //Create drive list command
            rpcDirectoryDrives = rpcDispatcher.CreateSubscription("FILE_GET_ROOTS");
            rpcDirectoryDrives.OnMessage += RpcDirectoryDrives_OnMessage;

            //Create file verify command
            rpcDirectoryVerify = rpcDispatcher.CreateSubscription("FILE_CHECK_ACCESS");
            rpcDirectoryVerify.OnMessage += RpcDirectoryVerify_OnMessage;

            //Create the ping command
            rpcPing = rpcDispatcher.CreateSubscription("PING");
            rpcPing.OnMessage += RpcPing_OnMessage;

            //Start HTTP server
            http.Start();

            //Done
            Log(RaptorLogLevel.LOG, "RaptorControl", $"Server ready Listening on {settings.Listening.ToString()}.");
        }

        private void RpcPing_OnMessage(IRaptorEndpointClient client, JObject payload)
        {
            rpcPing.SendTo(client, payload);
        }

        private void RpcDirectoryVerify_OnMessage(IRaptorEndpointClient client, JObject payload)
        {
            //Get arguments
            bool valid = payload.TryGetValue("path", out JToken pathValue) && pathValue.Type == JTokenType.String;
            string path = (string)pathValue;

            //Get info
            var info = client.Session.ResolveWebFile(path);

            //Check
            JObject response = new JObject();
            response["token"] = payload["token"];
            response["exists"] = info.Exists;
            response["can_write"] = valid && info.CanWrite;
            response["can_read"] = valid && info.CanRead;

            //Send response
            rpcDirectoryVerify.SendTo(client, response);
        }

        private void RpcDirectoryDrives_OnMessage(IRaptorEndpointClient client, JObject incomingPayload)
        {
            //Prepare response
            JArray roots = new JArray();

            //Add drives if we'd be able to use them
            DriveInfo[] drives = DriveInfo.GetDrives();
            foreach (var d in drives)
            {
                JObject data = new JObject();
                data["name"] = d.Name;
                data["path"] = d.RootDirectory.FullName;
                try
                {
                    data["nick"] = d.VolumeLabel;
                    data["size"] = d.TotalSize / 1000;
                    data["free"] = d.AvailableFreeSpace / 1000;
                    data["ok"] = true;
                } catch
                {
                    //failed to query info. this can happen if this is a CD drive or something like that. fall back to basic values
                    data["nick"] = d.Name;
                    data["size"] = 1;
                    data["free"] = 0;
                    data["ok"] = false;
                }
                roots.Add(data);
            }

            //Send
            JObject payload = new JObject();
            payload["token"] = incomingPayload["token"];
            payload["drives"] = roots;
            payload["managed_root"] = new DirectoryInfo(settings.ManagedPath).Root.FullName;
            rpcDirectoryDrives.SendTo(client, payload);
        }

        private void RpcDirectoryListing_OnMessage(IRaptorEndpointClient client, JObject payload)
        {
            JObject response = new JObject();
            response["token"] = payload["token"];
            response["status"] = RpcGetDirectoryListing(payload, client.Session, out JArray list);
            response["list"] = list;
            rpcDirectoryListing.SendTo(client, response);
        }

        private string RpcGetDirectoryListing(JObject payload, IRaptorSession session, out JArray list)
        {
            //Prepare
            list = new JArray();

            //Get arguments
            if (!payload.TryGetValue("path", out JToken pathValue) || pathValue.Type != JTokenType.String)
                return "MISSING_PATH";

            //Get info
            DirectoryInfo info = new DirectoryInfo(RaptorWebFileInfo.GetUnsafeAbsolutePathFromWeb(settings, (string)pathValue));

            //Check if it exists
            if (!info.Exists)
                return "DOES_NOT_EXIST";

            //Check if we're allowed to get this directory if it's unmanaged
            if(!info.FullName.StartsWith(settings.ManagedPath) && !session.CheckSystemScope(RaptorScope.FILE_READ_ANYWHERE))
                return "USER_DENIED_UNMANAGED";

            //Check if we're allowed to get this directory
            if (!session.CheckSystemScope(RaptorScope.FILE_READ_MANAGED))
                return "USER_DENIED_MANAGED";

            //Query the folder contents
            List<FileSystemInfo> entries = new List<FileSystemInfo>();
            try
            {
                entries.AddRange(info.GetFiles());
                entries.AddRange(info.GetDirectories());
            } catch
            {
                return "OS_DENIED";
            }

            //Add all
            foreach(var d in entries)
            {
                JObject data = new JObject();
                bool isDir = d.GetType() == typeof(DirectoryInfo);
                data["name"] = d.Name;
                data["type"] = isDir ? "DIR" : "FILE";
                data["date"] = d.LastWriteTimeUtc;
                data["size"] = isDir ? 0 : ((FileInfo)d).Length;
                list.Add(data);
            }

            return "OK";
        }

        private void EndpointInfo(RaptorHttpContext ctx)
        {
            //Create
            JObject info = new JObject();
            info["status"] = ServerStatus.ToString();
            info["version_major"] = VERSION_MAJOR;
            info["version_minor"] = VERSION_MINOR;
            info["icons"] = JToken.FromObject(packagesIcons.GetPackageHashes());
            info["streams"] = JToken.FromObject(streams);

            //Create plugins
            info["plugins"] = HelperBuildInfoArray(plugins, (RaptorPluginPackage p) =>
            {
                JObject plugin = new JObject();
                plugin["id"] = p.Server.Id.ToString();
                plugin["developer_name"] = p.DeveloperName;
                plugin["plugin_name"] = p.PluginName;
                plugin["frontends"] = HelperBuildInfoArray(p.Frontends, (RaptorPluginFrontend f) =>
                {
                    JObject frontend = new JObject();
                    frontend["name"] = f.Name;
                    frontend["platform"] = f.Platform;
                    frontend["size"] = f.Binary.Length;
                    frontend["sha256"] = f.Sha256;
                    return frontend;
                });
                return plugin;
            });

            //Create data providers
            info["providers"] = HelperBuildInfoArray(dataProviders, (IRaptorDataProvider p) =>
            {
                JObject provider = new JObject();
                provider["id"] = p.Id.ToString();
                provider["name"] = p.DisplayName;
                provider["type"] = p.GetType().FullName.Split('`')[0];
                provider["info"] = new JObject();
                p.BuildInfo((JObject)provider["info"]);
                return provider;
            });

            //Create sources
            info["sources"] = HelperBuildInfoArray(PluginSources, (IPluginSource item) =>
            {
                JToken e = new JObject();
                e["name"] = item.DisplayName;
                e["id"] = item.Id.ToString();
                e["icon"] = item.Icon?.Sha256;
                return e;
            });

            //Send
            ctx.ResponseHeaders.Add("content-type", "application/json");
            using (StreamWriter sw = new StreamWriter(ctx.OutputStream))
                sw.Write(JsonConvert.SerializeObject(info, Formatting.Indented));
        }

        private static JArray HelperBuildInfoArray<T>(IReadOnlyList<T> data, Func<T, JToken> callback)
        {
            JArray arr = new JArray();
            foreach (var d in data)
                arr.Add(callback(d));
            return arr;
        }

        private void RaptorControl_OnClientConnected(IRaptorEndpointClient client, IRaptorSession session)
        {
            JObject payload = new JObject();
            payload["session_id"] = client.Session.Id;
            rpcPostConnected.SendTo(client, payload);
        }

        private void Vfo_OnAudioReconfigured(IRaptorVfo vfo, float audioSampleRate)
        {
            foreach (var audio in pluginAudio)
                audio.ReconfigureAudio(audioSampleRate);
        }

        private void Vfo_OnAudioEmitted(IRaptorVfo vfo, float* left, float* right, int count)
        {
            foreach (var audio in pluginAudio)
                audio.SendAudio(left, right, count);
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

        public void RegisterPluginSource(RaptorPlugin plugin, IPluginSource source)
        {
            pluginSources.Add(source);
            source.Init(BufferSize);
        }

        public void RegisterPluginAudio(RaptorPlugin plugin, IPluginAudio audio)
        {
            pluginAudio.Add(audio);
        }

        public RaptorWebPackage RegisterPluginFrontend(byte[] data)
        {
            return packagesFrontend.RegisterPackage(data);
        }

        public IRaptorWebPackage RegisterIcon(byte[] binary)
        {
            return packagesIcons.RegisterPackage(binary);
        }

        public IRaptorWebPackage RegisterIcon(Stream stream)
        {
            byte[] binary = new byte[stream.Length];
            stream.Read(binary, 0, binary.Length);
            return RegisterIcon(binary);
        }

        public IRaptorWebPackage RegisterIcon(string embeddedResourceName)
        {
            IRaptorWebPackage package;
            using (Stream s = Assembly.GetCallingAssembly().GetManifestResourceStream(embeddedResourceName))
                package = RegisterIcon(s);
            return package;
        }

        public IRaptorWebStreamServer<WebStream> RegisterWebStream<WebStream>(RaptorNamespace id) where WebStream: RaptorWebStream
        {
            string path = "/stream/" + id.ToString();
            Log(RaptorLogLevel.DEBUG, "RaptorControl", $"Registered web stream at {path}");
            streams.Add(path);
            return new RaptorWebStreamServer<WebStream>(this, path);
        }

        public IRaptorWebFileInfo ResolveWebFile(IRaptorSession session, string webPathname)
        {
            return new RaptorWebFileInfo(settings, session, webPathname);
        }

        public void RegisterPluginInterface<T>(T pluginInterface)
        {
            pluginInterfaces.Add(pluginInterface);
        }

        public bool GetPluginInterface<T>(out T pluginInterface)
        {
            //Get the specified type
            Type interfaceType = typeof(T);

            //Search for compatible types
            foreach(var i in pluginInterfaces)
            {
                if(interfaceType.IsAssignableFrom(i.GetType()))
                {
                    pluginInterface = (T)i;
                    return true;
                }
            }

            //Failed
            pluginInterface = default(T);
            return false;
        }
    }
}
