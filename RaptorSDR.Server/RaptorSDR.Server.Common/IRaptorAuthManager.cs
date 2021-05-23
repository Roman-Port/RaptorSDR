using RaptorSDR.Server.Common.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public interface IRaptorAuthManager
    {
        RaptorAuthStatus SessionRegister(string username, string password, out IRaptorSession session);
        RaptorAuthStatus SessionLogin(string username, string password, out IRaptorSession session);
        bool Authenticate(string token, out IRaptorSession session);
    }
}
