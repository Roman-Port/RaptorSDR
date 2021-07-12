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
    public unsafe abstract class BaseRegisteredSpectrum<T> : IInternalRegisteredSpectrum where T : unmanaged
    {
        public BaseRegisteredSpectrum(IRaptorControl control, RaptorNamespace id, SpectrumSettings settings)
        {
            //Configure
            this.control = control;
            this.id = id;
            this.settings = settings;

            //Create stream
            fftStream = new FftStreamBuffer<T>(settings.fftSize);
            fftStream.OnFrameExported += FftStream_OnFrameExported;

            //Create buffers
            streamQueueBuffer = UnsafeBuffer.Create(settings.fftSize, out streamQueuePtr);
            streamProcessingBuffer = UnsafeBuffer.Create(settings.fftSize, out streamProcessingPtr);

            //Register the new stream
            stream = control.RegisterWebStream<RegisteredSpectrumClient>(id);
            stream.OnClientConnected += Stream_OnClientConnected;

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
        
        private Thread worker;
        private int sampleRate;

        private FftStreamBuffer<T> fftStream;
        private AutoResetEvent fftReady = new AutoResetEvent(false);

        private UnsafeBuffer streamQueueBuffer;
        private T* streamQueuePtr;
        private UnsafeBuffer streamProcessingBuffer;
        private T* streamProcessingPtr;

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

        private void Stream_OnClientConnected(RegisteredSpectrumClient stream)
        {
            stream.Initialize(this);
        }

        private void FftStream_OnFrameExported(T* ptr, int count)
        {
            lock(streamQueueBuffer)
            {
                Utils.Memcpy(streamQueuePtr, ptr, count * sizeof(T));
                fftReady.Set();
            }
        }

        private void WorkerThread()
        {
            while(true)
            {
                //Wait for an item in the queue
                fftReady.WaitOne();

                //Transfer to the processing buffer
                lock (streamQueueBuffer)
                    Utils.Memcpy(streamProcessingPtr, streamQueuePtr, settings.fftSize * sizeof(T));

                //Process frame
                float* power = ProcessPower(streamProcessingPtr, out int count);

                //Dispatch
                stream.ForEachClient((RegisteredSpectrumClient client) => client.NewFftFrameProcessed(power, count));
            }
        }

        protected abstract float* ProcessPower(T* samples, out int count);
    }
}
