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

namespace RomanPort.ViewSpectrum.Spectrums
{
    public unsafe abstract class BaseRegisteredSpectrum<T> : IRegisteredSpectrum where T : unmanaged
    {
        public BaseRegisteredSpectrum(IRaptorControl control, RaptorNamespace id, SpectrumSettings settings)
        {
            //Configure
            this.control = control;
            this.id = id;
            this.settings = settings;

            //Create buffers
            fftStream = new FftStreamBuffer<T>(settings.fftSize, Math.Max(control.BufferSize, settings.fftSize) * 2);
            streamBuffer = UnsafeBuffer.Create(settings.fftSize, out streamBufferPtr);

            //Register the new stream
            stream = control.RegisterWebStream<RegisteredSpectrumClient>(id);

            //Create and start worker thread
            worker = new Thread(WorkerThread);
            worker.Name = "FFT Worker: " + id.Id;
            worker.IsBackground = true;
            worker.Priority = ThreadPriority.BelowNormal;
            worker.Start();
        }

        protected readonly IRaptorContext control;
        protected readonly RaptorNamespace id;
        protected readonly SpectrumSettings settings;

        private IRaptorWebStreamServer<RegisteredSpectrumClient> stream;
        
        private bool suspended = true;
        private Thread worker;
        private int sampleRate;

        private FftStreamBuffer<T> fftStream;
        private UnsafeBuffer streamBuffer;
        private T* streamBufferPtr;

        public RaptorNamespace Id { get => id; }
        public SpectrumSettings Settings { get => settings; }
        public abstract bool IsHalf { get; }

        public int SampleRate
        {
            get => sampleRate;
            set
            {
                sampleRate = value;
            }
        }

        public void AddSamples(T* ptr, int count)
        {
            if (suspended) { return; }
            fftStream.Write(ptr, count);
        }

        public void SetSampleRate(int sampleRate) //simply for compatibility
        {
            SampleRate = sampleRate;
        }

        public void SetSampleRate(float sampleRate) //simply for compatibility
        {
            SampleRate = (int)sampleRate;
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
                Thread.Sleep(1000 / settings.framesPerSec);
            }
        }

        private void ProcessFrame()
        {
            //Read from the stream
            fftStream.Read(streamBufferPtr);

            //Process
            float* power = ProcessPower(streamBufferPtr, out int count);

            //Dispatch to clients
            stream.ForEachClient((RegisteredSpectrumClient client) =>
            {
                client.OnFftFrame(power, count, IsHalf ? sampleRate / 2 : sampleRate);
            });
        }

        protected abstract float* ProcessPower(T* samples, out int count);
    }
}
