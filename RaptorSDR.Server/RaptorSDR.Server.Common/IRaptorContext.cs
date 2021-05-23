using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    /// <summary>
    /// Provides the basics
    /// </summary>
    public interface IRaptorContext
    {
        RaptorNamespace Id { get; }
        IRaptorControl Control { get; }
    }
}
