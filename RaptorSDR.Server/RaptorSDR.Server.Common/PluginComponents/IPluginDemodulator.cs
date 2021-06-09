using RomanPort.LibSDR.Demodulators;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.PluginComponents
{
    public delegate void IPluginDemodulator_EventArgs<T>(IPluginDemodulator demodulator, T data);

    public interface IPluginDemodulator : IPluginComponent, IAudioDemodulator
    {
        string DisplayNameShort { get; }

        event IPluginDemodulator_EventArgs<bool> OnWebStereoDetected;
        event IPluginDemodulator_EventArgs<bool> OnWebRdsDetected;
        event IPluginDemodulator_EventArgs<ulong> OnWebRdsFrame;
    }
}
