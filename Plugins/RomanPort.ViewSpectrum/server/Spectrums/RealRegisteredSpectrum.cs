using RaptorSDR.Server.Common;
using RomanPort.LibSDR.Components;
using RomanPort.LibSDR.Components.FFTX;
using RomanPort.LibSDR.Components.FFTX.Kiss;
using RomanPort.ViewSpectrum.API;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum.Spectrums
{
    public unsafe class RealRegisteredSpectrum : BaseRegisteredSpectrum<float>, IRegisteredSpectrumReal
    {
        public RealRegisteredSpectrum(IRaptorControl control, RaptorNamespace id, SpectrumSettings settings) : base(control, id, settings)
        {
            //Create buffers
            powerBuffer = UnsafeBuffer.Create(settings.fftSize, out powerBufferPtr);
            computedBuffer = UnsafeBuffer.Create(settings.fftSize, out computedBufferPtr);
            fftBuffer = UnsafeBuffer.Create(settings.fftSize, out fftBufferPtr);

            //Create FFT
            fft = new KissFFTComplex(settings.fftSize, false);
            window = new FFTWindow(settings.fftSize);
        }

        private UnsafeBuffer powerBuffer;
        protected float* powerBufferPtr;
        private UnsafeBuffer computedBuffer;
        protected Complex* computedBufferPtr;
        private UnsafeBuffer fftBuffer;
        protected Complex* fftBufferPtr;

        protected KissFFTComplex fft;
        protected FFTWindow window;

        public override bool IsHalf => true;

        protected override float* ProcessPower(float* streamBufferPtr, out int count)
        {
            //Copy to the complex buffer
            for (int i = 0; i < settings.fftSize; i++)
                fftBufferPtr[i] = streamBufferPtr[i];
            
            //Apply window
            window.Apply(fftBufferPtr);

            //Compute buffer
            fft.Process(fftBufferPtr, computedBufferPtr);
            FFTUtil.CalculatePower(computedBufferPtr, powerBufferPtr, settings.fftSize);

            //Push to center
            FFTUtil.OffsetSpectrum(powerBufferPtr, settings.fftSize);

            count = settings.fftSize / 2;
            return powerBufferPtr + count; //get the last half of it
        }
    }
}
