using RaptorSDR.Server.Common.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Core.Web.Auth
{
    public class RaptorAuthenticatedUserAccount : RaptorUserAccount
    {
        public string username;
        public byte[] password_hash;
        public byte[] salt;
    }
}
