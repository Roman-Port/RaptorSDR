using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.Auth;
using RaptorSDR.Server.Core.Web.HTTP;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Core.Web.Auth
{
    public class RaptorAuthApi
    {
        public RaptorAuthApi(RaptorControl control, RaptorHttpServer http)
        {
            this.control = control;
            http.BindToEndpoint("/accounts/login", HandleLogin);
        }

        private RaptorControl control;

        private void HandleLogin(RaptorHttpContext ctx)
        {
            //Read request body
            RequestBody request = ctx.ReadBodyAsJson<RequestBody>();

            //Process
            IRaptorSession session;
            RaptorAuthStatus status;
            switch(request.auth_type)
            {
                case "PASSWORD":
                    status = control.Auth.SessionLogin(request.username, request.password, out session);
                    break;
                case "REFRESH":
                    status = control.Auth.SessionRefresh(request.refresh_token, out session);
                    break;
                default:
                    session = null;
                    status = RaptorAuthStatus.INVALID_LOGIN_METHOD;
                    break;
            }

            //Write
            ctx.WriteBodyAsJson(new ResponseBody
            {
                status = status.ToString(),
                session_token = session == null ? null : session.AccessToken,
                refresh_token = session == null ? null : session.RefreshToken,
                id = session == null ? null : session.Id,
                ok = (int)status >= 0
            });
        }

        class RequestBody
        {
            public string auth_type;

            public string refresh_token;

            public string username;
            public string password;
        }

        class ResponseBody
        {
            public string status;
            public string session_token;
            public string refresh_token;
            public string id;
            public bool ok;
        }
    }
}
