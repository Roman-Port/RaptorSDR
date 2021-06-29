using RaptorSDR.Server.Common.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Core.Web.Auth
{
    public class RaptorAuthException : Exception
    {
        private RaptorAuthStatus status;

        public RaptorAuthException(RaptorAuthStatus status) : base(status.ToString())
        {
            this.status = status;
        }

        public RaptorAuthStatus Status { get => status; }
    }
}
