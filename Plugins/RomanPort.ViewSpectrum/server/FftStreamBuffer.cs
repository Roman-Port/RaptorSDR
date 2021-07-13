using RomanPort.LibSDR.Components;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;

namespace RomanPort.ViewSpectrum
{
    public unsafe delegate void FftStreamBuffer_ExportedEventArgs<T>(T* ptr, int count) where T : unmanaged;

    public unsafe class FftStreamBuffer<T> : IDisposable where T : unmanaged
    {
        public FftStreamBuffer(int bufferSize, int frameSize)
        {
            //Configure
            this.bufferSize = bufferSize;
            this.frameSize = frameSize;
            samplesToFrame = frameSize;

            //Create buffers
            loopBuffer = UnsafeBuffer.Create(bufferSize, out loopBufferPtr);
            exportBuffer = UnsafeBuffer.Create(bufferSize, out exportBufferPtr);
        }

        private readonly int bufferSize;
        private readonly UnsafeBuffer loopBuffer;
        private readonly T* loopBufferPtr;
        private readonly UnsafeBuffer exportBuffer;
        private readonly T* exportBufferPtr;

        private int frameSize;
        private volatile int bufferPos;
        private volatile int samplesToFrame;

        public int FrameSize { get => frameSize; set => frameSize = value; }

        public event FftStreamBuffer_ExportedEventArgs<T> OnFrameExported;

        public void Write(T* buffer, int count)
        {
            while (count > 0 && frameSize != 0)
            {
                //Determine how much is writable
                int writable = Math.Min(Math.Min(samplesToFrame, bufferSize - bufferPos), count);

                //Transfer and update state
                Utils.Memcpy(loopBufferPtr + bufferPos, buffer, writable * sizeof(T));
                bufferPos = (bufferPos + writable) % bufferSize;
                samplesToFrame -= writable;
                buffer += writable;
                count -= writable;

                //Check if it's time to export a frame
                if (samplesToFrame == 0)
                    ExportFrame();
            }
        }

        private void ExportFrame()
        {
            //Transfer to buffer 
            Utils.Memcpy(exportBufferPtr, loopBufferPtr + bufferPos, (bufferSize - bufferPos) * sizeof(T));
            Utils.Memcpy(exportBufferPtr + (bufferSize - bufferPos), loopBufferPtr, bufferPos * sizeof(T));
            
            //Export
            OnFrameExported?.Invoke(exportBufferPtr, bufferSize);

            //Reset
            samplesToFrame = frameSize;
        }

        public void Dispose()
        {
            loopBuffer.Dispose();
            exportBuffer.Dispose();
        }
    }
}
