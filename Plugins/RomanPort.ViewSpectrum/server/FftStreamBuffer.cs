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
        public FftStreamBuffer(int frameSize)
        {
            //Configure
            this.frameSize = frameSize;
            free = frameSize;

            //Create buffers
            loopBuffer = UnsafeBuffer.Create(frameSize, out loopBufferPtr);
        }

        private readonly int frameSize;
        private readonly UnsafeBuffer loopBuffer;
        private readonly T* loopBufferPtr;

        private volatile int bufferPos;
        private volatile int free;

        public event FftStreamBuffer_ExportedEventArgs<T> OnFrameExported;

        public void Write(T* buffer, int count)
        {
            while (count > 0)
            {
                //Determine how much is writable
                int writable = Math.Min(free, count);

                //Transfer and update state
                Utils.Memcpy(loopBufferPtr + bufferPos, buffer, writable * sizeof(T));
                bufferPos += writable;
                free -= writable;
                buffer += writable;
                count -= writable;

                //Check if it's time to export a frame
                if (free == 0)
                {
                    //Export
                    OnFrameExported?.Invoke(loopBufferPtr, frameSize);

                    //Reset
                    bufferPos = 0;
                    free = frameSize;
                }
            }
        }

        public void Dispose()
        {
            loopBuffer.Dispose();
        }
    }
}
