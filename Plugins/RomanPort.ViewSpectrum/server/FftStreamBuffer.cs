using RomanPort.LibSDR.Components;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;

namespace RomanPort.ViewSpectrum
{
    public unsafe class FftStreamBuffer<T> : IDisposable where T : unmanaged
    {
        /// <summary>
        /// A circular buffer that will pull the latest readSize number of samples from a stream.
        /// </summary>
        /// <param name="frameSize">The number of samples that will be read.</param>
        public FftStreamBuffer(int frameSize, int bufferSize)
        {
            //Configure
            this.frameSize = frameSize;
            this.bufferSize = bufferSize;
            free = bufferSize;

            //Create buffers
            loopBuffer = UnsafeBuffer.Create(bufferSize, out loopBufferPtr);

            //Create dummy lock object
            lockObject = new object();
        }

        private readonly int frameSize;
        private readonly int bufferSize;
        private readonly UnsafeBuffer loopBuffer;
        private readonly T* loopBufferPtr;
        private readonly object lockObject;

        private volatile int bufferReadPos;
        private volatile int bufferWritePos;
        private volatile int available;
        private volatile int free;

        public void Read(T* buffer)
        {
            //Lock
            Monitor.Enter(lockObject);

            //Only proceed if we've got space
            if (available > frameSize)
            {
                //Read but don't update global state
                for (int i = 0; i < frameSize; i++)
                    buffer[i] = loopBufferPtr[(bufferReadPos + i) % bufferSize];

                //Update state from the calculated amount
                available = Math.Max(0, available - frameSize);
                free = Math.Min(bufferSize, free + frameSize);
                bufferReadPos = (bufferReadPos + frameSize) % bufferSize;
            }

            //Unlock
            Monitor.Exit(lockObject);
        }

        public void Write(T* buffer, int count)
        {
            //Lock
            Monitor.Enter(lockObject);

            //On the write end, we just treat this as a regular circular buffer
            while(count > 0 && free > 0)
            {
                loopBufferPtr[bufferWritePos++] = *buffer++;
                bufferWritePos %= bufferSize;
                count--;
                free--;
                available++;
            }

            //Unlock
            Monitor.Exit(lockObject);
        }

        public void Dispose()
        {
            loopBuffer.Dispose();
        }
    }
}
