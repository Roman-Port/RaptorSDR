using RaptorSDR.Server.Common.Dispatchers;
using RaptorSDR.Server.Common.PluginComponents;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    /// <summary>
    /// Where everything is kept
    /// </summary>
    public interface IRaptorControl : IRaptorContext, IRaptorLogger
    {
        RaptorDispatcherOpcode Rpc { get; }
        RaptorDispatcherOpcode RpcPluginDispatcher { get; }

        int BufferSize { get; }
        IRaptorAuthManager Auth { get; }
        IRaptorRadio Radio { get; }
        IRaptorVfo Vfo { get; }
        IReadOnlyList<IPluginDemodulator> PluginDemodulators { get; }
        IReadOnlyList<IPluginSource> PluginSources { get; }

        IRaptorEndpoint RegisterDataProvider(IRaptorDataProvider provider);
        void RegisterPluginDemodulator(RaptorPlugin plugin, IPluginDemodulator demodulator);
    }
}
