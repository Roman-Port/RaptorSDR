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
        public string plugin_uuid;

        public static RaptorConfig Load()
        {
            //Load
            RaptorConfig cfg = JsonConvert.DeserializeObject<RaptorConfig>(File.ReadAllText("config.json"));

            //Restore
            if (cfg.plugin_uuid == null)
            {
                cfg.plugin_uuid = Guid.NewGuid().ToString();
                cfg.Save();
            }

            return cfg;
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
