using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorPluginUtil.Operations.Build
{
    public class RaptorBuildManifest
    {
        public string developer_name;
        public string plugin_name;
        public List<RaptorBuildManifestItem> items = new List<RaptorBuildManifestItem>();
        public int version_major;
        public int version_minor;
        public int version_build;
        public string plugin_uuid;
        public uint sdk_version;
    }

    public class RaptorBuildManifestItem
    {
        public string id;
        public string type;
        public Dictionary<string, string> data = new Dictionary<string, string>();
    }
}
