using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.PluginComponents
{
    public interface IPluginComponent : IRaptorContext
    {
        string DisplayName { get; }
    }
}
