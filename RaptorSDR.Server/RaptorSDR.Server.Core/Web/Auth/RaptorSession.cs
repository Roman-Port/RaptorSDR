using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.Auth;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace RaptorSDR.Server.Core.Web.Auth
{
    public class RaptorSession : IRaptorSession
    {
        public RaptorSession(IRaptorControl control, string id, RaptorAuthenticatedUserAccount info)
        {
            this.control = control;
            this.id = id;
            this.info = info;
            this.token = info.access_token;
        }

        private string id;
        private string token;
        private RaptorAuthenticatedUserAccount info;
        private IRaptorControl control;

        public string Id => id;

        public string AccessToken => token;

        public string RefreshToken => info.access_token;

        public bool IsAdmin => info.is_admin;

        public RaptorUserAccount Info => info;

        public string Username => info.username;

        public bool CheckSystemScope(RaptorScope scope)
        {
            return IsAdmin || ((info.scope_system >> (int)scope) & 1) == 1;
        }

        public bool CheckSystemScope(params RaptorScope[] scopes)
        {
            bool ok = true;
            foreach (var s in scopes)
                ok = ok && CheckSystemScope(s);
            return ok;
        }

        public bool CheckPluginScope(RaptorPlugin plugin, string scope)
        {
            return IsAdmin || info.scope_plugin.Contains(plugin.Id.Then(scope).ToString());
        }

        public bool CheckPluginScope(RaptorPlugin plugin, params string[] scopes)
        {
            bool ok = true;
            foreach (var s in scopes)
                ok = ok && CheckPluginScope(plugin, s);
            return ok;
        }

        public void SetToken(string token)
        {
            this.token = token;
        }

        public IRaptorWebFileInfo ResolveWebFile(string webPathname)
        {
            return control.ResolveWebFile(this, webPathname);
        }
    }
}
