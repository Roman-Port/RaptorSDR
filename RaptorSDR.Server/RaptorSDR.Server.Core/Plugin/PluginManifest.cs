using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Core.Plugin
{
    public class PluginManifest
    {
        public string developer_name;
        public string plugin_name;
        public List<PluginManifestItem> items;
    }

    public class PluginManifestItem
    {
        public string id;
        public string type;
        public Dictionary<string, string> data = new Dictionary<string, string>();
    }
}
