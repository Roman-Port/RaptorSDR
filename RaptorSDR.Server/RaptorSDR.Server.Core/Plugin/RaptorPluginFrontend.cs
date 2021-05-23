using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace RaptorSDR.Server.Core.Plugin
{
    public class RaptorPluginFrontend
    {
        public RaptorPluginFrontend(string name, string platform, byte[] binary)
        {
            //Set
            this.name = name;
            this.platform = platform;
            this.binary = binary;

            //Hash
            using (SHA256 sha = SHA256.Create())
                sha256 = BitConverter.ToString(sha.ComputeHash(binary)).Replace("-", "");
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
