using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Text;

namespace RaptorPluginUtil.Operations.Build
{
    public static class BuildOperation
    {
        public static int Handle(RaptorParams args)
        {
            //Load config
            var cfg = RaptorConfig.Load();

            //Get the output path, if any
            string outputPath;
            if (!args.TryPop(out outputPath))
                outputPath = $"{cfg.developer_name}.{cfg.plugin_name}.rpkg";
            if (Environment.GetEnvironmentVariable("RAPTORSDR_USER") != null)
                outputPath = Environment.GetEnvironmentVariable("RAPTORSDR_USER") + $"/plugins/{cfg.developer_name}.{cfg.plugin_name}.rpkg";
            Console.WriteLine("Building to " + outputPath + "...");

            //Build
            using (FileStream fs = new FileStream(outputPath, FileMode.Create))
            using(ZipArchive archive = new ZipArchive(fs, ZipArchiveMode.Create))
            {
                //Create
                RaptorBuildManifest manifest = new RaptorBuildManifest
                {
                    developer_name = cfg.developer_name,
                    plugin_name = cfg.plugin_name,
                    items = new List<RaptorBuildManifestItem>(),
                    version_major = cfg.version_major,
                    version_minor = cfg.version_minor,
                    version_build = cfg.version_build
                };

                //Build bits
                if (!BuildServer(archive, manifest.items))
                    return -1;
                foreach(var f in cfg.frontends)
                {
                    if (!BuildFrontend(archive, f, manifest.items))
                        return -1;
                }

                //Save manifest
                using(Stream entry = archive.CreateEntry("manifest.json").Open())
                {
                    byte[] data = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(manifest));
                    entry.Write(data, 0, data.Length);
                }
            }

            //Offset build
            cfg.version_build++;
            cfg.Save();

            return 0;
        }

        private static Random rand = new Random();

        private static string GetId()
        {
            char[] charset = "1234567890ABCDEF".ToCharArray();
            char[] output = new char[16];
            for (int i = 0; i < output.Length; i++)
                output[i] = charset[rand.Next(0, charset.Length)];
            return new string(output);
        }

        private static bool BuildServer(ZipArchive archive, List<RaptorBuildManifestItem> manifest)
        {
            //Build
            if (CliUtil.RunDotnetCommand("publish --no-self-contained -c Release -o ../build/server/") != 0)
            {
                Console.WriteLine("Dotnet build failed!");
                return false;
            }

            //Get item ID
            string id = GetId();

            //Deposit files into ZIP
            string[] files = Directory.GetFiles("build/server/");
            foreach(var f in files)
            {
                string name = new FileInfo(f).Name;
                if (name.StartsWith("RaptorSDR"))
                    continue; //skip built-in libs
                archive.CreateEntryFromFile(f, id + "/" + name);
            }

            //Add
            manifest.Add(new RaptorBuildManifestItem
            {
                id = id,
                type = "SERVER",
                data = new Dictionary<string, string>()
            });

            return true;
        }

        private static bool BuildFrontend(ZipArchive archive, RaptorConfig_Frontend frontend, List<RaptorBuildManifestItem> manifest)
        {
            //Build
            if(CliUtil.RunCommand("npx", "webpack", "/" + frontend.name) != 0)
            {
                Console.WriteLine("Webpack compilation error!");
                return false;
            }

            //Get item ID
            string id = GetId();

            //Open this entry and begin writing to it
            using(Stream package = archive.CreateEntry(id + "/" + "package.rfpk").Open())
            {
                //Get files in the output
                string[] files = Directory.GetFiles($"{frontend.name}/out/");

                //Write header info
                package.Write(BitConverter.GetBytes((uint)1346786130), 0, 4); //Magic "RSFP" (Raptor Sdr Frontend Package)
                package.Write(BitConverter.GetBytes((ushort)files.Length), 0, 2); //Count
                package.Write(BitConverter.GetBytes((ushort)0), 0, 2); //Version

                //Write info for all
                foreach (var f in files)
                {
                    //Get name
                    byte[] name = Encoding.ASCII.GetBytes(new FileInfo(f).Name);

                    //Open file
                    using(FileStream fs = new FileStream(f, FileMode.Open, FileAccess.Read))
                    {
                        //Write package header
                        package.Write(BitConverter.GetBytes((ushort)19526), 0, 2); //Type "FL" (FiLe)
                        package.Write(BitConverter.GetBytes((ushort)name.Length), 0, 2); //Name length
                        package.Write(name, 0, name.Length); //Name
                        package.Write(BitConverter.GetBytes((uint)fs.Length), 0, 4); //Payload length

                        //Copy file payload
                        fs.CopyTo(package);
                    }
                }
            }

            //Add
            manifest.Add(new RaptorBuildManifestItem
            {
                id = id,
                type = "FRONTEND",
                data = new Dictionary<string, string>()
                {
                    {"NAME", frontend.name },
                    {"PLATFORM", frontend.type }
                }
            });

            return true;
        }
    }
}
