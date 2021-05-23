using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text;

namespace RaptorPluginUtil
{
    public static class TemplateUtil
    {
        public static string LoadTemplate(string name, Dictionary<string, string> replacements)
        {
            //Load embedded resource
            string response;
            var assembly = Assembly.GetExecutingAssembly();
            using (Stream stream = assembly.GetManifestResourceStream($"RaptorPluginUtil.Templates.{name}"))
            using (StreamReader reader = new StreamReader(stream))
            {
                response = reader.ReadToEnd();
            }

            //Do replacements
            foreach(var r in replacements)
            {
                response = response.Replace("{{" + r.Key + "}}", r.Value);
            }

            return response;
        }
    }
}
