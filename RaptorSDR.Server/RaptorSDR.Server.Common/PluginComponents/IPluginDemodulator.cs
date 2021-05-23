using RomanPort.LibSDR.Demodulators;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.PluginComponents
{
    public interface IPluginDemodulator : IPluginComponent, IAudioDemodulator
    {
        string DisplayNameShort { get; }
        void BindToVfo(IRaptorVfo vfo);
    }
}
