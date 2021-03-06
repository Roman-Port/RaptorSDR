using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Core;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;

namespace RaptorSDR.Server
{
    public class RaptorSettings : IRaptorSettings
    {
        public RaptorSettings()
        {
            //Load runtime settings if the file exists
            if (File.Exists(RuntimeSettingsPath))
                runtimeSettings = JsonConvert.DeserializeObject<JObject>(File.ReadAllText(RuntimeSettingsPath));
            else
                runtimeSettings = new JObject();
        }

        private JObject runtimeSettings;
        
        public string InstallPath
        {
            get
            {
                //Default to the current path
                string path = Environment.CurrentDirectory + Path.DirectorySeparatorChar + "UserData" + Path.DirectorySeparatorChar;

                //If the enviornmental variable is set, overrride
                if(Environment.GetEnvironmentVariable("RAPTORSDR_USER") != null)
                    path = Environment.GetEnvironmentVariable("RAPTORSDR_USER");

                return path;
            }
        }

        public IPEndPoint Listening => new IPEndPoint(IPAddress.Any, 35341);

        public string ManagedPath => InstallPath + "Managed\\";

        public string RuntimeSettingsPath => InstallPath + "settings.json";

        public JObject RuntimeSettings => runtimeSettings;

        public void Log(RaptorLogLevel level, string topic, string message)
        {
            //Set color
            switch (level)
            {
                case RaptorLogLevel.DEBUG: Console.ForegroundColor = ConsoleColor.DarkGray; break;
                case RaptorLogLevel.LOG: Console.ForegroundColor = ConsoleColor.White; break;
                case RaptorLogLevel.WARN: Console.ForegroundColor = ConsoleColor.Yellow; break;
                case RaptorLogLevel.ERROR: Console.ForegroundColor = ConsoleColor.Red; break;
                case RaptorLogLevel.FATAL: Console.ForegroundColor = ConsoleColor.Magenta; break;
            }

            //Log
            Console.WriteLine($"{Thread.CurrentThread.ManagedThreadId.ToString().PadLeft(3, '0')} [{level.ToString().PadLeft(5, ' ')}] [{topic}] {message}");

            //Rset
            Console.ForegroundColor = ConsoleColor.White;
        }

        public void SaveRuntimeSettings()
        {
            File.WriteAllText(RuntimeSettingsPath, JsonConvert.SerializeObject(runtimeSettings, Formatting.Indented));
        }
    }
}
