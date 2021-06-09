using RomanPort.LibSDR.Components;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public delegate void IRaptorRadio_OnConfiguredEventArgs(IRaptorRadio radio);
    public unsafe delegate void IRaptorRadio_OnSamplesEventArgs(Complex* ptr, int count);

    public interface IRaptorRadio
    {
        float SampleRate { get; }
        
        event IRaptorRadio_OnConfiguredEventArgs OnConfigured;
        event IRaptorRadio_OnSamplesEventArgs OnSamples;
    }
}
