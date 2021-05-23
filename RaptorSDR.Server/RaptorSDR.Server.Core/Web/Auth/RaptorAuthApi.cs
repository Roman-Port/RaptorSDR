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
            http.BindToEndpoint("/accounts/register", HandleRegister);
            http.BindToEndpoint("/accounts/login", HandleLogin);
        }

        private RaptorControl control;

        private void HandleRegister(RaptorHttpContext ctx)
        {
            //Read request body
            RequestBody request = ctx.ReadBodyAsJson<RequestBody>();

            //Register
            RaptorAuthStatus status = control.Auth.SessionRegister(request.username, request.password, out IRaptorSession session);

            //Write
            ctx.WriteBodyAsJson(new ResponseBody
            {
                status = status.ToString(),
                token = session == null ? null : session.AccessToken,
                id = session == null ? null : session.Id
            });
        }

        private void HandleLogin(RaptorHttpContext ctx)
        {
            //Read request body
            RequestBody request = ctx.ReadBodyAsJson<RequestBody>();

            //Register
            RaptorAuthStatus status = control.Auth.SessionLogin(request.username, request.password, out IRaptorSession session);

            //Write
            ctx.WriteBodyAsJson(new ResponseBody
            {
                status = status.ToString(),
                token = session == null ? null : session.AccessToken,
                id = session == null ? null : session.Id,
                ok = (int)status >= 0
            });
        }

        class RequestBody
        {
            public string username;
            public string password;
        }

        class ResponseBody
        {
            public string status;
            public string token;
            public string id;
            public bool ok;
        }
    }
}
