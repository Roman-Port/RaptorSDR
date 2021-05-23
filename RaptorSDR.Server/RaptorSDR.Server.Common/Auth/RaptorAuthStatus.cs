using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.Auth
{
    public enum RaptorAuthStatus
    {
        OK = 0,
        
        NO_PERMISSIONS = 1,

        ACCOUNT_EXISTS = -1,
        INVALID_CREDENTIALS = -2,
        MALFORMED_USERNAME = -3,
        MALFORMED_PASSWORD = -4
    }
}
