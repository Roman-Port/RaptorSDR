using RaptorSDR.Server.Common.Dispatchers;
using RaptorSDR.Server.Common.PluginComponents;
using RaptorSDR.Server.Common.WebStream;
using System;
using System.Collections.Generic;
using System.IO;
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

        IRaptorWebFileInfo ResolveWebFile(IRaptorSession session, string webPathname);

        IRaptorWebPackage RegisterIcon(byte[] binary);
        IRaptorWebPackage RegisterIcon(Stream stream);
        IRaptorWebPackage RegisterIcon(string embeddedResourceName);
        IRaptorEndpoint RegisterDataProvider(IRaptorDataProvider provider);
        IRaptorWebStreamServer<WebStream> RegisterWebStream<WebStream>(RaptorNamespace id) where WebStream : RaptorWebStream;

        void RegisterPluginDemodulator(RaptorPlugin plugin, IPluginDemodulator demodulator);
        void RegisterPluginSource(RaptorPlugin plugin, IPluginSource source);
        void RegisterPluginAudio(RaptorPlugin plugin, IPluginAudio audio);
        void RegisterPluginInterface<T>(T pluginInterface);

        void WriteSetting<T>(RaptorNamespace group, string key, T value);
        T ReadSetting<T>(RaptorNamespace group, string key, T defaultValue);

        bool GetPluginInterface<T>(out T pluginInterface);
    }
}
