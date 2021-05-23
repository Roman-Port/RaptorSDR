using RomanPort.LibSDR.Components;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.PluginComponents
{
    public interface IPluginSource : IPluginComponent
    {
        void Init(int bufferSize);
        void Start();
        unsafe int Read(Complex* bufferPtr, int count);
        void Stop();

        event IPluginSource_SampleRateChanged OnSampleRateChanged;

        float OutputSampleRate { get; }
        long CenterFreq { get; set; }
    }

    public delegate void IPluginSource_SampleRateChanged(IPluginSource source);
}
