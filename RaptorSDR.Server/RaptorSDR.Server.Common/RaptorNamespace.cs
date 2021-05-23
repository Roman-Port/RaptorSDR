using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public class RaptorNamespace
    {
        public RaptorNamespace(string myId)
        {
            SanitizeId(myId);
            id = myId;
        }

        public RaptorNamespace(RaptorNamespace parent, string myId)
        {
            SanitizeId(myId);
            id = parent.Id + "." + myId;
        }

        public RaptorNamespace Then(string id)
        {
            return new RaptorNamespace(this, id);
        }

        private const string ALLOWED_CHARS = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890";

        private static void SanitizeId(string id)
        {
            char[] m = id.ToCharArray();
            char[] charset = ALLOWED_CHARS.ToCharArray();
            for (int i = 0; i<m.Length; i++)
            {
                bool allowed = false;
                for (int j = 0; j < charset.Length; j++)
                    allowed = allowed || charset[j] == m[i];
                if (!allowed)
                    throw new Exception("There were invalid characters in the ID: " + id);
            }
        }

        private string id;

        public string Id { get => id; }

        public override string ToString()
        {
            return Id;
        }
    }
}
