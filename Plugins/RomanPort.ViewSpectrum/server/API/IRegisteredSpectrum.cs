using RomanPort.LibSDR.Components;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum.API
{
    public interface IRegisteredSpectrum
    {
        int SampleRate { get; set; }
        unsafe void AddSamples(Complex* ptr, int count);
    }
}
