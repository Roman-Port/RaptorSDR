using RomanPort.LibSDR.Components;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;

namespace RomanPort.Recorder.Buffers
{
    public unsafe class RecorderCircularBuffer<T> : IDisposable where T : unmanaged
    {
        public RecorderCircularBuffer(long length)
        {
            buffer = UnsafeBuffer.Create(length, out bufferPtr);
            bufferLen = length;
            bufferFree = length;
            bufferUsed = 0;
        }

        protected UnsafeBuffer buffer;
        protected long bufferLen;
        protected long bufferFree;
        protected long bufferUsed;
        protected T* bufferPtr;

        protected long bufferWrite;
        protected long bufferRead;

        private ManualResetEvent wait = new ManualResetEvent(false);

        public long Free { get => bufferFree; }
        public long Used { get => bufferUsed; }

        public void Wait(int timeout)
        {
            if(bufferUsed == 0)
                wait.WaitOne(timeout);
        }

        public virtual long Write(T* ptr, long count)
        {
            long written = 0;
            while (count > 0 && bufferFree > 0)
            {
                long writable = Math.Min(bufferLen - bufferWrite, Math.Min(count, bufferFree));
                Utils.Memcpy(bufferPtr + bufferWrite, ptr, writable * sizeof(T));
                bufferWrite = (bufferWrite + writable) % bufferLen;
                bufferFree -= writable;
                bufferUsed += writable;
                written += writable;
                count -= writable;
                ptr += writable;
            }
            wait.Set();
            return written;
        }

        public virtual long Read(T* ptr, long count)
        {
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
            if (bufferUsed == 0)
                wait.Reset();
            return read;
        }

        public void Dispose()
        {
            buffer.Dispose();
        }
    }
}
