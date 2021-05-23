using RaptorSDR.Server.Common.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Core.Web.Auth
{
    public class RaptorAuthDatabase
    {
        public List<RaptorAuthenticatedUserAccount> users = new List<RaptorAuthenticatedUserAccount>();
    }
}
