using RaptorSDR.Server.Core.Web.WebPackage;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace RaptorSDR.Server.Core.Plugin
{
    public class RaptorPluginFrontend
    {
        public RaptorPluginFrontend(string name, string platform, byte[] binary, RaptorWebPackage package)
        {
            this.name = name;
            this.platform = platform;
            this.binary = binary;
            sha256 = package.Sha256;
        }

        private string name;
        private string platform;
        private byte[] binary;
        private string sha256;

        public string Name { get => name; }
        public string Platform { get => platform; }
        public byte[] Binary { get => binary; }
        public string Sha256 { get => sha256; }
    }
}
