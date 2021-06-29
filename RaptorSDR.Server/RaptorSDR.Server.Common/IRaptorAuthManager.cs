using RaptorSDR.Server.Common.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public interface IRaptorAuthManager
    {
        string CreateAccount(string username, string password);
        string LoginAccount(string username, string password);
        string InvalidateAccountTokens(string username);
        void DeleteAccount(string username);
        bool AuthenticateSession(string token, out IRaptorSession session);
    }
}
