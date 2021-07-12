using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
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
            string resourceName = $"RaptorPluginUtil.Templates.{name}";
            var assembly = Assembly.GetExecutingAssembly();
            Stream stream = assembly.GetManifestResourceStream(resourceName);
            if (stream == null)
                throw new Exception($"Internal error: Attempted to load template \"{resourceName}\" but it didn't exist! Valid names: {assembly.GetManifestResourceNames().Aggregate("", (current, next) => current + "\n" + next)}");

            //Read
            using (StreamReader reader = new StreamReader(stream))
                response = reader.ReadToEnd();

            //Do replacements
            foreach (var r in replacements)
            {
                response = response.Replace("{{" + r.Key + "}}", r.Value);
            }

            //Clean up
            stream.Close();

            return response;
        }
    }
}
