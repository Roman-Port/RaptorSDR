using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;

namespace RaptorPluginUtil.Operations.Init
{
    public static class InitOperation
    {
        public static int Handle(RaptorParams args)
        {
            //Make sure this directory is empty
            if(Directory.GetFiles(".").Length > 0 || Directory.GetDirectories(".").Length > 0)
            {
                Console.WriteLine("Please init from an empty directory.");
                return -1;
            }

            //Get the SDK path
            string sdkPath = Environment.GetEnvironmentVariable("RAPTORSDR_SDK");
            if(sdkPath == null || sdkPath.Length == 0 || !Directory.Exists(sdkPath))
            {
                Console.WriteLine("Enviornmental variable \"RAPTORSDR_SDK\" is not set. Please set it before creating a project!");
            }

            //Read params
            if(!args.TryPop(out string developerName) || !args.TryPop(out string pluginName))
            {
                Console.WriteLine("Invalid command usage!");
                return -1;
            }

            //Create folder structure
            Directory.CreateDirectory("build");
            Directory.CreateDirectory("server");
            Directory.CreateDirectory("client");

            //Generate the CSharp template
            File.WriteAllText($"server/{developerName}.{pluginName}.csproj", "<Project Sdk=\"Microsoft.NET.Sdk\">\n" +
                "  <PropertyGroup>\n" +
                "    <TargetFramework>netstandard2.0</TargetFramework>\n" +
                "  </PropertyGroup>\n" +
                "  <ItemGroup>\n" +
                $"    <ProjectReference Include=\"{sdkPath}\\RaptorSDR.Server\\RaptorSDR.Server.Common\\RaptorSDR.Server.Common.csproj\" />\n" +
                $"    <ProjectReference Include=\"{sdkPath}\\..\\RomanPort.LibSDR\\RomanPort.LibSDR\\RomanPort.LibSDR.csproj\" />\n" +
                "  </ItemGroup>\n" +
                "</Project>");
            File.WriteAllText($"server/{pluginName}Plugin.cs", $"using System;\nusing RaptorSDR.Server.Common;\n\nnamespace {developerName}.{pluginName}\n{{\n    public class {pluginName}Plugin : RaptorPlugin\n    {{\n        public override string DeveloperName => \"{developerName}\";\n        public override string PluginName => \"{pluginName}\";\n        \n        public {pluginName}Plugin(IRaptorControl control) : base(control)\n        {{\n                \n        }}\n        \n        public override void Init()\n        {{\n            \n        }}\n    }}\n}}");

            //Save the config file
            RaptorConfig cfg = new RaptorConfig
            {
                developer_name = developerName,
                plugin_name = pluginName
            };
            cfg.Save();

            //Done
            Console.WriteLine("Project created successfully!");
            return 0;
        }
    }
}
