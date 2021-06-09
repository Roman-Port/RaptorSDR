using Newtonsoft.Json;
using RaptorSDR.Server.Core.Web.HTTP;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;

namespace RaptorSDR.Server.Core.Web.WebPackage
{
    /// <summary>
    /// Allows sending a "package" of a bunch of binary data over the internet
    /// </summary>
    public class RaptorWebPackageEndpoint
    {
        public RaptorWebPackageEndpoint()
        {

        }

        private List<RaptorWebPackage> packages = new List<RaptorWebPackage>();

        public RaptorWebPackage RegisterPackage(byte[] binary)
        {
            RaptorWebPackage package = new RaptorWebPackage(binary);
            packages.Add(package);
            return package;
        }

        public bool FindPackageByHash(string id, out RaptorWebPackage package)
        {
            foreach(var p in packages)
            {
                if(p.Sha256 == id)
                {
                    package = p;
                    return true;
                }
            }
            package = null;
            return false;
        }

        public string[] GetPackageHashes()
        {
            string[] h = new string[packages.Count];
            for (int i = 0; i < h.Length; i++)
                h[i] = packages[i].Sha256;
            return h;
        }

        public void HandleHttpRequest(RaptorHttpContext ctx)
        {
            //Load list of SHA-256 hashes to use
            string[] hashes;
            using (StreamReader sr = new StreamReader(ctx.InputStream))
                hashes = JsonConvert.DeserializeObject<string[]>(sr.ReadToEnd());

            //Loop through these hashes and find each
            RaptorWebPackage[] frontends = new RaptorWebPackage[hashes.Length];
            for (int i = 0; i < hashes.Length; i++)
            {
                if (!FindPackageByHash(hashes[i], out frontends[i]))
                {
                    ctx.StatusCode = HttpStatusCode.NotFound;
                    return;
                }
            }

            //We know we have them all. Send all
            for (int i = 0; i < frontends.Length; i++)
            {
                ctx.OutputStream.Write(BitConverter.GetBytes((uint)frontends[i].Binary.Length), 0, 4);
                ctx.OutputStream.Write(frontends[i].Binary, 0, frontends[i].Binary.Length);
            }
        }
    }
}
