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
            http.BindToEndpoint("/accounts/logout", HandleLogout);
            http.BindToEndpoint("/accounts/info", HandleInfo);
        }

        private RaptorControl control;

        private void HandleLogin(RaptorHttpContext ctx)
        {
            //Read request body
            UserRequest request = ctx.ReadBodyAsJson<UserRequest>();

            //Begin forming response
            UserResponse response = new UserResponse
            {
                ok = false,
                status = null,
                info = null,
                access_token = null
            };

            //Attempt to register
            try
            {
                response.access_token = control.Auth.LoginAccount(request.username, request.password);
                response.ok = true;
                response.status = "OK";
            }
            catch (RaptorAuthException ex)
            {
                response.ok = false;
                response.status = ex.Status.ToString();
            }

            //Get user info
            if (control.Auth.AuthenticateSession(response.access_token, out IRaptorSession session))
                response.info = CreateUserInfo(session);

            //Send
            ctx.WriteBodyAsJson(response);
        }

        private void HandleRegister(RaptorHttpContext ctx)
        {
            //Read request body
            UserRequest request = ctx.ReadBodyAsJson<UserRequest>();

            //Begin forming response
            UserResponse response = new UserResponse
            {
                ok = false,
                status = null,
                info = null,
                access_token = null
            };

            //Attempt to register
            try
            {
                response.access_token = control.Auth.CreateAccount(request.username, request.password);
                response.ok = true;
                response.status = "OK";
            }
            catch (RaptorAuthException ex)
            {
                response.ok = false;
                response.status = ex.Status.ToString();
            }

            //Get user info
            if (control.Auth.AuthenticateSession(response.access_token, out IRaptorSession session))
                response.info = CreateUserInfo(session);

            //Send
            ctx.WriteBodyAsJson(response);
        }

        private void HandleLogout(RaptorHttpContext ctx)
        {
            //Read request body
            TokenRequest request = ctx.ReadBodyAsJson<TokenRequest>();

            //Get session
            bool ok = false;
            if (control.Auth.AuthenticateSession(request.access_token, out IRaptorSession session))
            {
                control.Auth.InvalidateAccountTokens(session.Username);
                ok = true;
            }

            //Send
            ctx.WriteBodyAsJson(new TokenResponse
            {
                ok = ok
            });
        }

        private void HandleInfo(RaptorHttpContext ctx)
        {
            //Read request body
            TokenRequest request = ctx.ReadBodyAsJson<TokenRequest>();

            //Get session
            if (control.Auth.AuthenticateSession(request.access_token, out IRaptorSession session))
                ctx.WriteBodyAsJson(CreateUserInfo(session));
            else
                ctx.StatusCode = System.Net.HttpStatusCode.Unauthorized;
        }

        private UserInfo CreateUserInfo(IRaptorSession sessionBase)
        {
            //Get session as a RaptorSession
            RaptorSession session = (RaptorSession)sessionBase;

            //Create
            return new UserInfo
            {
                admin = session.Info.is_admin,
                scope_system = session.Info.scope_system,
                scope_plugin = session.Info.scope_plugin.ToArray()
            };
        }

        class TokenRequest
        {
            public string access_token;
        }

        class TokenResponse
        {
            public bool ok;
        }

        class UserRequest
        {
            public string username;
            public string password;
        }

        class UserResponse
        {
            public bool ok;
            public string status;
            public string access_token;

            public UserInfo info;
        }

        class UserInfo
        {
            public bool admin;
            public ulong scope_system;
            public string[] scope_plugin;
        }
    }
}
