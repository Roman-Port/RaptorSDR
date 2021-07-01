using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public static class RaptorExtensions
    {
        public static IRaptorEndpoint BindOnMessage(this IRaptorEndpoint endpoint, IRaptorEndpoint_MessageEventArgs evt)
        {
            endpoint.OnMessage += evt;
            return endpoint;
        }
    }
}
