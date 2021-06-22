using RaptorSDR.Server.Common;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum.API
{
    public interface ISpectrumProvider
    {
        IRegisteredSpectrumComplex RegisterSpectrumComplex(RaptorNamespace id, SpectrumSettings settings);
        IRegisteredSpectrumReal RegisterSpectrumReal(RaptorNamespace id, SpectrumSettings settings);
    }
}
