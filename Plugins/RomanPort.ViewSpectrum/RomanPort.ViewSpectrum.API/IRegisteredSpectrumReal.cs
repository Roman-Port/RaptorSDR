using RomanPort.LibSDR.Components;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum.API
{
    public interface IRegisteredSpectrumReal : IRegisteredSpectrum
    {
        unsafe void AddSamples(float* ptr, int count);
    }
}
