using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace RaptorPluginUtil
{
    public class RaptorConfig
    {
        public string developer_name;
        public string plugin_name;
        public List<RaptorConfig_Frontend> frontends = new List<RaptorConfig_Frontend>();
        public int version_major;
        public int version_minor;
        public int version_build;

        public static RaptorConfig Load()
        {
            return JsonConvert.DeserializeObject<RaptorConfig>(File.ReadAllText("config.json"));
        }

        public void Save()
        {
            File.WriteAllText("config.json", JsonConvert.SerializeObject(this));
        }
    }

    public class RaptorConfig_Frontend
    {
        public string name;
        public string type;
    }
}
