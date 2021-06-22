using RomanPort.LibSDR.Components;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum.API
{
    public interface IRegisteredSpectrumComplex : IRegisteredSpectrum
    {
        unsafe void AddSamples(Complex* ptr, int count);
    }
}
