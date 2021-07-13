using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.WebStream;
using RomanPort.LibSDR.Components;
using RomanPort.LibSDR.Components.FFTX;
using RomanPort.LibSDR.Components.FFTX.Kiss;
using RomanPort.LibSDR.Components.IO.Buffers;
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
            this.bufferSize = control.BufferSize * 4;

            //Create thread stream
            threadStream = new GrowingBuffer<T>(bufferSize);

            //Create buffers
            tempBuffer = UnsafeBuffer.Create(bufferSize, out tempBufferPtr);

            //Register the new stream
            stream = control.RegisterWebStream<RegisteredSpectrumClient<T>>(id);
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
        private readonly int bufferSize;

        private IRaptorWebStreamServer<RegisteredSpectrumClient<T>> stream;
        private Thread worker;
        private int sampleRate;
        private GrowingBuffer<T> threadStream;
        private UnsafeBuffer tempBuffer;
        private T* tempBufferPtr;

        public RaptorNamespace Id { get => id; }
        public SpectrumSettings Settings { get => settings; }
        public abstract bool IsHalf { get; }

        public int SampleRate { get => sampleRate; set => sampleRate = value; }

        public void AddSamples(T* ptr, int count)
        {
            threadStream.Write(ptr, count);
        }

        public void SetSampleRate(int sampleRate) //simply for compatibility
        {
            SampleRate = sampleRate;
        }

        public void SetSampleRate(float sampleRate) //simply for compatibility
        {
            SampleRate = (int)sampleRate;
        }

        private void Stream_OnClientConnected(RegisteredSpectrumClient<T> stream)
        {
            stream.Initialize(this);
        }

        private void WorkerThread()
        {
            while(true)
            {
                //Wait for an item in the queue
                threadStream.Wait(1000);

                //Read to the processing buffer
                long read = threadStream.Read(tempBufferPtr, bufferSize);

                //Dispatch
                stream.ForEachClient((RegisteredSpectrumClient<T> client) => client.ProcessIncoming(tempBufferPtr, (int)read, sampleRate));
            }
        }

        public abstract IFftGenerator<T> CreateGenerator();
    }
}
