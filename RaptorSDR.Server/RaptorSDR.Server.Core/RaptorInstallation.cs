using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace RaptorSDR.Server.Core
{
    public class RaptorInstallation
    {
        public RaptorInstallation(string dir)
        {
            root = new DirectoryInfo(dir);
            plugins = root.CreateSubdirectory("plugins");
            plugin_cache = root.CreateSubdirectory("plugin_cache");
        }

        private DirectoryInfo root;
        private DirectoryInfo plugins;
        private DirectoryInfo plugin_cache;

        public DirectoryInfo Plugins { get => plugins; }
        public DirectoryInfo PluginCache { get => plugin_cache; }
    }
}
