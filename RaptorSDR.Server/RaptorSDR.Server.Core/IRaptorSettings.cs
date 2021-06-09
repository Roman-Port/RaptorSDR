using RaptorSDR.Server.Common;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text;

namespace RaptorSDR.Server.Core
{
    public interface IRaptorSettings : IRaptorLogger
    {
        string InstallPath { get; }
        string ManagedPath { get; }
        IPEndPoint Listening { get; }
    }
}
