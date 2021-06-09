using RaptorSDR.Server.Common;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace RaptorSDR.Server.Core.Web.WebPackage
{
    public class RaptorWebPackage : IRaptorWebPackage
    {
        public RaptorWebPackage(byte[] binary)
        {
            //Set
            this.binary = binary;
            
            //Hash
            using (SHA256 sha = SHA256.Create())
                sha256 = BitConverter.ToString(sha.ComputeHash(binary)).Replace("-", "");
        }

        private byte[] binary;
        private string sha256;

        public byte[] Binary { get => binary; }
        public string Sha256 { get => sha256; }
    }
}
