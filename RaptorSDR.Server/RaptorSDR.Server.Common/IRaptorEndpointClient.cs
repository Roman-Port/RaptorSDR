using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public interface IRaptorEndpointClient
    {
        IRaptorSession Session { get; }
    }
}
