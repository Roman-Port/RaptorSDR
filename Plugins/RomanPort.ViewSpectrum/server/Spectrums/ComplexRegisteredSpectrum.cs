using RaptorSDR.Server.Common;
using RomanPort.LibSDR.Components;
using RomanPort.LibSDR.Components.FFTX;
using RomanPort.LibSDR.Components.FFTX.Kiss;
using RomanPort.ViewSpectrum.API;
using RomanPort.ViewSpectrum.Generators;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum.Spectrums
{
    public unsafe class ComplexRegisteredSpectrum : BaseRegisteredSpectrum<Complex>, IRegisteredSpectrumComplex
    {
        public ComplexRegisteredSpectrum(IRaptorControl control, RaptorNamespace id, SpectrumSettings settings) : base(control, id, settings)
        {
        }

        public override bool IsHalf => false;

        public override IFftGenerator<Complex> CreateGenerator()
        {
            return new FftGeneratorComplex(settings.fftSize);
        }
    }
}
