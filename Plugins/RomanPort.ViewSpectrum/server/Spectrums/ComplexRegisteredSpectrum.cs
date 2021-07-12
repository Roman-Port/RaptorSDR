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
    public unsafe class ComplexRegisteredSpectrum : BaseRegisteredSpectrum<Complex>, IRegisteredSpectrumComplex
    {
        public ComplexRegisteredSpectrum(IRaptorControl control, RaptorNamespace id, SpectrumSettings settings) : base(control, id, settings)
        {
            //Create buffers
            powerBuffer = UnsafeBuffer.Create(settings.fftSize, out powerBufferPtr);
            computedBuffer = UnsafeBuffer.Create(settings.fftSize, out computedBufferPtr);

            //Create FFT
            fft = new KissFFTComplex(settings.fftSize, false);
            window = new FFTWindow(settings.fftSize, LibSDR.Components.Filters.WindowType.Youssef);
        }

        private UnsafeBuffer powerBuffer;
        protected float* powerBufferPtr;
        private UnsafeBuffer computedBuffer;
        protected Complex* computedBufferPtr;

        protected KissFFTComplex fft;
        protected FFTWindow window;

        public override bool IsHalf => false;

        protected override float* ProcessPower(Complex* fftBufferPtr, out int count)
        {
            //Apply window
            window.Apply(fftBufferPtr);

            //Compute buffer
            fft.Process(fftBufferPtr, computedBufferPtr);
            FFTUtil.CalculatePower(computedBufferPtr, powerBufferPtr, settings.fftSize);

            //Push to center
            FFTUtil.OffsetSpectrum(powerBufferPtr, settings.fftSize);

            count = settings.fftSize;
            return powerBufferPtr;
        }
    }
}
