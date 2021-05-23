using RaptorSDR.Server.Common;
using RaptorSDR.Server.Core.Plugin;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Core
{
    public class RaptorPluginPackage
    {
        public RaptorPluginPackage(PluginManifest manifest)
        {
            this.manifest = manifest;
        }

        private PluginManifest manifest;

        private RaptorPlugin server;
        private List<RaptorPluginFrontend> frontends = new List<RaptorPluginFrontend>();

        public string DeveloperName { get => manifest.developer_name; }
        public string PluginName { get => manifest.plugin_name; }

        public RaptorPlugin Server { get => server; }
        public IReadOnlyList<RaptorPluginFrontend> Frontends { get => frontends; }

        public void SetServer(RaptorPlugin server)
        {
            if (this.server != null)
                throw new Exception("Only one server is permitted per plugin!");
            this.server = server;
        }

        public void RegisterFrontend(RaptorPluginFrontend frontend)
        {
            frontends.Add(frontend);
        }

        public bool Verify()
        {
            return server != null;
        }

        public bool GetFrontendByHash(string hash, out RaptorPluginFrontend frontend)
        {
            frontend = null;
            foreach(var f in frontends)
            {
                if(f.Sha256 == hash)
                {
                    frontend = f;
                    return true;
                }
            }
            return false;
        }
    }
}
