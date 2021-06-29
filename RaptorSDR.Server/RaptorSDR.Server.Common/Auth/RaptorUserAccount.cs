using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.Auth
{
    public class RaptorUserAccount
    {
        public ulong scope_system;
        public List<string> scope_plugin;
        public bool is_admin;
        public DateTime created;
        public string access_token;
    }
}
