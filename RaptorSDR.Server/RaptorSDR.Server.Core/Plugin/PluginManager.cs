using Newtonsoft.Json;
using RaptorSDR.Server.Common;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Text;

namespace RaptorSDR.Server.Core.Plugin
{
    public class PluginManager
    {
        public PluginManager(RaptorControl control)
        {
            this.control = control;
        }

        private RaptorControl control;

        public int UnpackPluginFolder(string dir, List<RaptorPluginPackage> plugins)
        {
            //Allocate count
            int count = 0;
            
            //Get subdirs and loop
            string[] subdirs = Directory.GetDirectories(dir);
            foreach (var s in subdirs)
                count += UnpackPluginFolder(s, plugins);
            
            //Get files and unpack
            string[] files = Directory.GetFiles(dir);
            foreach(var s in files)
            {
                //Ensure the extension matches
                if (!s.EndsWith(".rpkg"))
                    continue;

                //Unpack this
                try
                {
                    plugins.Add(UnpackPlugin(s));
                    count++;
                } catch (Exception ex)
                {
                    control.Log(RaptorLogLevel.WARN, "PluginManager", $"Failed to open plugin at \"{s}\": {ex.Message}{ex.StackTrace}");
                }
            }

            return count;
        }

        public RaptorPluginPackage UnpackPlugin(string packagePath)
        {
            //Unzip
            RaptorPluginPackage package;
            using(FileStream fs = new FileStream(packagePath, FileMode.Open, FileAccess.Read))
            using(ZipArchive za = new ZipArchive(fs, ZipArchiveMode.Read))
            {
                //Read manifest
                PluginManifest manifest = HelperReadJsonFromPackage<PluginManifest>(za.GetEntry("manifest.json"));

                //Create package
                package = new RaptorPluginPackage(manifest);

                //Read each item
                foreach(var i in manifest.items)
                {
                    switch(i.type)
                    {
                        case "SERVER": ExtractPluginServer(package, za, i.id); break;
                        case "FRONTEND": ExtractPluginFrontend(package, za, i); break;
                        default: throw new Exception($"Unknown item type {i.type}!");
                    }
                }
            }

            //Verify
            if (!package.Verify())
                throw new Exception("Package is invalid. Check build config.");

            //Log
            control.Log(RaptorLogLevel.LOG, "PluginManager", $"Successfully loaded plugin {package.DeveloperName}.{package.PluginName}");

            return package;
        }

        private static T HelperReadJsonFromPackage<T>(ZipArchiveEntry entry)
        {
            byte[] data = new byte[entry.Length];
            using (Stream s = entry.Open())
                s.Read(data, 0, data.Length);
            return JsonConvert.DeserializeObject<T>(Encoding.UTF8.GetString(data));
        }

        private void ExtractPluginServer(RaptorPluginPackage package, ZipArchive archive, string itemId)
        {
            //Get the directory for this
            DirectoryInfo dir = control.Installation.PluginCache.CreateSubdirectory($"{package.DeveloperName}.{package.PluginName}-{itemId}");
            string dirPath = dir.FullName + Path.DirectorySeparatorChar;
            string flagFile = dirPath + "extracted.flag";

            //Check if we need to extract
            if (!File.Exists(flagFile))
            {
                //We'll need to extract. Log
                control.Log(Common.RaptorLogLevel.LOG, "PluginManager", $"Extracting {package.DeveloperName}.{package.PluginName} at version {itemId}...");

                //Extract all
                foreach (var e in archive.Entries)
                {
                    //Check
                    if (!e.FullName.StartsWith(itemId))
                        continue;

                    //Extract
                    using (FileStream output = new FileStream(dirPath + e.FullName.Substring(itemId.Length + 1), FileMode.Create))
                    using (Stream input = e.Open())
                        input.CopyTo(output);
                }

                //Write extracted flag
                File.WriteAllText(flagFile, itemId);
            }

            //Load plugin
            control.Log(RaptorLogLevel.LOG, "PluginManager", $"Loading server plugin {package.DeveloperName}.{package.PluginName} at version {itemId}...");
            var asb = Assembly.LoadFrom(dirPath + $"{package.DeveloperName}.{package.PluginName}.dll");
            RaptorPlugin plugin = (RaptorPlugin)Activator.CreateInstance(asb.GetType($"{package.DeveloperName}.{package.PluginName}.{package.PluginName}Plugin"), control);

            //Set
            package.SetServer(plugin);
        }

        private void ExtractPluginFrontend(RaptorPluginPackage package, ZipArchive archive, PluginManifestItem item)
        {
            //Get entry and read
            ZipArchiveEntry entry = archive.GetEntry(item.id + "/package.rfpk");
            byte[] binary = new byte[entry.Length];
            using (Stream s = entry.Open())
                s.Read(binary, 0, binary.Length);

            //Add to package
            package.RegisterFrontend(new RaptorPluginFrontend(item.data["NAME"], item.data["PLATFORM"], binary));
        }
    }
}
