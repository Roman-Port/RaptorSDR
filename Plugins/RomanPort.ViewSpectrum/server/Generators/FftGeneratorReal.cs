using RomanPort.LibSDR.Components;
using RomanPort.LibSDR.Components.FFTX;
using RomanPort.LibSDR.Components.FFTX.Kiss;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum.Generators
{
    public unsafe class FftGeneratorReal : IFftGenerator<float>
    {
        public FftGeneratorReal(int realFftSize)
        {
            //Configure
            this.emuFftSize = realFftSize / 2;
            this.realFftSize = realFftSize;

            //Create buffers
            powerBuffer = UnsafeBuffer.Create(realFftSize, out powerPtr);
            computedBuffer = UnsafeBuffer.Create(realFftSize, out computedBufferPtr);
            processingBuffer = UnsafeBuffer.Create(realFftSize, out processingBufferPtr);

            //Create FFT
            fft = new KissFFTComplex(realFftSize, false);
            window = new FFTWindow(realFftSize, LibSDR.Components.Filters.WindowType.Youssef);
        }

        private readonly int emuFftSize;
        private readonly int realFftSize;

        private readonly UnsafeBuffer powerBuffer;
        private readonly float* powerPtr;
        private readonly UnsafeBuffer computedBuffer;
        private readonly Complex* computedBufferPtr;
        private readonly UnsafeBuffer processingBuffer;
        private readonly Complex* processingBufferPtr;

        private readonly KissFFTComplex fft;
        private readonly FFTWindow window;

        public float* PowerPtr => powerPtr + emuFftSize;
        public int InputFftSize => realFftSize;
        public int OutputFftSize => emuFftSize;

        public void ProcessFrame(float* ptr)
        {
            //Convert
            for (int i = 0; i < realFftSize; i++)
                processingBufferPtr[i] = new Complex(ptr[i]);
            
            //Apply window
            window.Apply(processingBufferPtr);

            //Compute buffer
            fft.Process(processingBufferPtr, computedBufferPtr);
            FFTUtil.CalculatePower(computedBufferPtr, powerPtr, realFftSize);

            //Push to center
            FFTUtil.OffsetSpectrum(powerPtr, realFftSize);
        }
    }
}
