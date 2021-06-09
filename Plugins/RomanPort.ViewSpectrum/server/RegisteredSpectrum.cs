using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.WebStream;
using RomanPort.LibSDR.Components;
using RomanPort.LibSDR.Components.FFTX;
using RomanPort.LibSDR.Components.FFTX.Kiss;
using RomanPort.ViewSpectrum.API;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;

namespace RomanPort.ViewSpectrum
{
    public unsafe class RegisteredSpectrum : IRegisteredSpectrum
    {
        public RegisteredSpectrum(IRaptorControl control, RaptorNamespace id, SpectrumSettings settings)
        {
            //Configure
            this.control = control;
            this.id = id;
            this.settings = settings;
            loopBufferSize = settings.fftSize * 2;

            //Create buffers
            loopBuffer = UnsafeBuffer.Create(loopBufferSize, out loopBufferPtr);
            fftBuffer = UnsafeBuffer.Create(settings.fftSize, out fftBufferPtr);
            computedBuffer = UnsafeBuffer.Create(settings.fftSize, out computedBufferPtr);
            powerBuffer = UnsafeBuffer.Create(settings.fftSize, out powerBufferPtr);

            //Create FFT
            fft = new KissFFTComplex(settings.fftSize, false);
            window = new FFTWindow(settings.fftSize);

            //Register the new stream
            stream = control.RegisterWebStream<RegisteredSpectrumClient>(id);

            //Create and start worker thread
            worker = new Thread(WorkerThread);
            worker.Name = "FFT Worker: " + id.Id;
            worker.IsBackground = true;
            worker.Priority = ThreadPriority.BelowNormal;
            worker.Start();
        }

        private readonly IRaptorContext control;
        private readonly RaptorNamespace id;
        private readonly SpectrumSettings settings;
        private readonly int loopBufferSize;

        private IRaptorWebStreamServer<RegisteredSpectrumClient> stream;
        private KissFFTComplex fft;
        private FFTWindow window;
        private int loopBufferIndex;
        private bool suspended = true;
        private Thread worker;
        private int sampleRate;

        private UnsafeBuffer loopBuffer;
        private Complex* loopBufferPtr;
        private UnsafeBuffer fftBuffer;
        private Complex* fftBufferPtr;
        private UnsafeBuffer computedBuffer;
        private Complex* computedBufferPtr;
        private UnsafeBuffer powerBuffer;
        private float* powerBufferPtr;

        public RaptorNamespace Id { get => id; }
        public SpectrumSettings Settings { get => settings; }

        public int SampleRate { get => sampleRate; set => sampleRate = value; }

        public void AddSamples(Complex* ptr, int count)
        {
            if (suspended) { return; }
            while(count > 0)
            {
                int writable = Math.Min(count, loopBufferSize - loopBufferIndex);
                Utils.Memcpy(loopBufferPtr + loopBufferIndex, ptr, writable * sizeof(Complex));
                loopBufferIndex = (loopBufferIndex + writable) % loopBufferSize;
                count -= writable;
                ptr += writable;
            }
        }

        private void WorkerThread()
        {
            while(true)
            {
                //Check if we need to suspend
                if (!stream.HasClients)
                {
                    suspended = true;
                    Thread.Sleep(100);
                    continue;
                }
                suspended = false;

                //Compute frame
                ProcessFrame();

                //Sleep
                Thread.Sleep(40);
            }
        }

        private void ProcessFrame()
        {
            //Get index to read from the loop buffer
            int readIndex = loopBufferIndex - settings.fftSize;
            if (readIndex < 0)
                readIndex += loopBufferSize;

            //Copy out of the loop buffer
            for (int i = 0; i < settings.fftSize; i++)
                fftBufferPtr[i] = loopBufferPtr[(readIndex + i) % loopBufferSize];

            //Compute buffer
            fft.Process(fftBufferPtr, computedBufferPtr);
            FFTUtil.CalculatePower(computedBufferPtr, powerBufferPtr, settings.fftSize);

            //Push to center
            FFTUtil.OffsetSpectrum(powerBufferPtr, settings.fftSize);

            //Dispatch to clients
            stream.ForEachClient((RegisteredSpectrumClient client) =>
            {
                client.OnFftFrame(powerBufferPtr, settings.fftSize, sampleRate);
            });
        }
    }
}
