using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public interface IRaptorLogger
    {
        void Log(RaptorLogLevel level, string topic, string message);
    }
}
