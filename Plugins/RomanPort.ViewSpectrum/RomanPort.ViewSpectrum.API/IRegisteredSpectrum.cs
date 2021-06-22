using RaptorSDR.Server.Common;
using RomanPort.LibSDR.Components;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum.API
{
    public interface IRegisteredSpectrum
    {
        int SampleRate { get; set; }
        RaptorNamespace Id { get; }
        SpectrumSettings Settings { get; }
        bool IsHalf { get; }

        void SetSampleRate(int sampleRate); //simply for compatibility
        void SetSampleRate(float sampleRate); //simply for compatibility
    }
}
