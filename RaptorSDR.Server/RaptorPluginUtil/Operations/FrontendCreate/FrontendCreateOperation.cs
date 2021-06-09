using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace RaptorPluginUtil.Operations.FrontendCreate
{
    public static class FrontendCreateOperation
    {
        public static int Handle(RaptorParams args)
        {
            //Get the name
            if(!args.TryPop(out string name))
            {
                Console.WriteLine("Invalid usage.");
                return -1;
            }

            //Load config
            RaptorConfig cfg = RaptorConfig.Load();

            //Make sure the name doesn't already exist
            DirectoryInfo dir = new DirectoryInfo(name);
            if (dir.Exists)
            {
                Console.WriteLine("That name is already in use.");
                return -1;
            }

            //Create and set up
            dir.Create();
            DirectoryInfo dirOut = dir.CreateSubdirectory("out");
            DirectoryInfo dirSrc = dir.CreateSubdirectory("src");

            //Make files
            File.WriteAllText(dir.FullName + "/package.json", TemplateUtil.LoadTemplate("FrontendNpm.package.json", new Dictionary<string, string>()
            {
                {"NAME_DEVELOPER", cfg.developer_name },
                {"NAME_PLUGIN", cfg.plugin_name },
                {"NAME_FRONTEND", name }
            }));
            File.WriteAllText(dir.FullName + "/tsconfig.json", TemplateUtil.LoadTemplate("FrontendNpm.tsconfig.json", new Dictionary<string, string>()));
            File.WriteAllText(dir.FullName + "/webpack.config.js", TemplateUtil.LoadTemplate("FrontendNpm.webpack.config.js", new Dictionary<string, string>()));
            File.WriteAllText(dirSrc.FullName + "/" + cfg.plugin_name + "Plugin.ts", TemplateUtil.LoadTemplate("FrontendNpm.plugin.ts", new Dictionary<string, string>() { { "NAME_PLUGIN", cfg.plugin_name } }));
            File.WriteAllText(dirSrc.FullName + "/index.js", TemplateUtil.LoadTemplate("FrontendNpm.index.js", new Dictionary<string, string>() { { "NAME_PLUGIN", cfg.plugin_name } }));

            //Make sure all NPM packages are installed
            if(CliUtil.RunCommand("npm", "install", "/" + name) != 0)
            {
                Console.WriteLine("NPM Install failed! Is NPM installed?");
                return -1;
            }

            //Clone SDK
            if (CliUtil.RunCommand("git", "clone https://github.com/Roman-Port/RaptorSDR.Web.Common sdk", "/" + name) != 0)
            {
                Console.WriteLine("GIT clone failed! Is GIT installed?");
                return -1;
            }

            //Add to config
            cfg.frontends.Add(new RaptorConfig_Frontend
            {
                name = name,
                type = "WEB"
            });
            cfg.Save();

            return 0;
        }
    }
}
