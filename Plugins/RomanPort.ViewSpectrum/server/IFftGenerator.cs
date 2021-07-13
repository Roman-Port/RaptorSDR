using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum
{
    public unsafe interface IFftGenerator<T> where T : unmanaged
    {
        float* PowerPtr { get; }
        int InputFftSize { get; }
        int OutputFftSize { get; }
        void ProcessFrame(T* ptr);
    }
}
