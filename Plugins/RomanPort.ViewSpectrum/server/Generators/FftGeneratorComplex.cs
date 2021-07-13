using RomanPort.LibSDR.Components;
using RomanPort.LibSDR.Components.FFTX;
using RomanPort.LibSDR.Components.FFTX.Kiss;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum.Generators
{
    public unsafe class FftGeneratorComplex : IFftGenerator<Complex>
    {
        public FftGeneratorComplex(int fftSize)
        {
            //Configure
            this.fftSize = fftSize;

            //Create buffers
            powerBuffer = UnsafeBuffer.Create(fftSize, out powerPtr);
            computedBuffer = UnsafeBuffer.Create(fftSize, out computedBufferPtr);

            //Create FFT
            fft = new KissFFTComplex(fftSize, false);
            window = new FFTWindow(fftSize, LibSDR.Components.Filters.WindowType.Youssef);
        }

        private readonly int fftSize;
        private readonly UnsafeBuffer powerBuffer;
        private readonly float* powerPtr;
        private readonly UnsafeBuffer computedBuffer;
        private readonly Complex* computedBufferPtr;

        private readonly KissFFTComplex fft;
        private readonly FFTWindow window;

        public float* PowerPtr => powerPtr;
        public int InputFftSize => fftSize;
        public int OutputFftSize => fftSize;

        public void ProcessFrame(Complex* ptr)
        {
            //Apply window
            window.Apply(ptr);

            //Compute buffer
            fft.Process(ptr, computedBufferPtr);
            FFTUtil.CalculatePower(computedBufferPtr, powerPtr, fftSize);

            //Push to center
            FFTUtil.OffsetSpectrum(powerPtr, fftSize);
        }
    }
}
