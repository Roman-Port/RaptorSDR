using RomanPort.LibSDR.Components;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;

namespace RomanPort.Recorder.Buffers
{
    public unsafe class RecorderGrowingBuffer<T> where T : unmanaged
    {
        public RecorderGrowingBuffer(int length)
        {
            buffer = UnsafeBuffer.Create(length, out bufferPtr);
            bufferLen = length;
            bufferFree = length;
            bufferUsed = 0;
        }

        private UnsafeBuffer buffer;
        private long bufferLen;
        private long bufferFree;
        private long bufferUsed;
        private T* bufferPtr;

        private long bufferWrite;
        private long bufferRead;

        private ManualResetEvent wait = new ManualResetEvent(false);

        public long Free { get => bufferFree; }
        public long Used { get => bufferUsed; }

        public void Wait(int timeout)
        {
            if (bufferUsed == 0)
                wait.WaitOne(timeout);
        }

        public void Write(T* ptr, long count)
        {
            //Check if we have enough space
            while (bufferFree - count < 0)
            {
                //Create new buffer
                long expandedBufferLen = bufferLen * 2;
                UnsafeBuffer expandedBuffer = UnsafeBuffer.Create(expandedBufferLen, out T* expandedBufferPtr);

                //Copy all in-use memory to the expanded buffer
                bufferUsed = Read(expandedBufferPtr, bufferUsed);

                //Dispose old buffer
                buffer.Dispose();

                //Apply and recalculate
                buffer = expandedBuffer;
                bufferPtr = expandedBufferPtr;
                bufferLen = expandedBufferLen;
                bufferFree = expandedBufferLen - bufferUsed;
                bufferWrite = bufferUsed;
                bufferRead = 0;
            }

            //Copy into buffer now that we're guarenteed to have enough space
            while (count > 0)
            {
                long writable = Math.Min(bufferLen - bufferWrite, count);
                Utils.Memcpy(bufferPtr + bufferWrite, ptr, writable * sizeof(T));
                bufferWrite = (bufferWrite + writable) % bufferLen;
                bufferFree -= writable;
                bufferUsed += writable;
                count -= writable;
                ptr += writable;
            }

            //Set wait
            wait.Set();
        }

        public long Read(T* ptr, long count)
        {
            //Perform read
            long read = 0;
            while (count > 0 && bufferUsed > 0)
            {
                long readable = Math.Min(bufferLen - bufferRead, Math.Min(count, bufferUsed));
                Utils.Memcpy(ptr, bufferPtr + bufferRead, readable * sizeof(T));
                bufferRead = (bufferRead + readable) % bufferLen;
                bufferFree += readable;
                bufferUsed -= readable;
                read += readable;
                count -= readable;
                ptr += readable;
            }

            //Clear wait
            if (bufferUsed == 0)
                wait.Reset();
            return read;
        }
    }
}