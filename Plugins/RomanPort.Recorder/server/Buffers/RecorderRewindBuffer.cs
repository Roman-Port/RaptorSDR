using RomanPort.LibSDR.Components;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;

namespace RomanPort.Recorder.Buffers
{
    public unsafe class RecorderRewindBuffer<T> : IDisposable where T : unmanaged
    {
        public RecorderRewindBuffer(long length)
        {
            buffer = UnsafeBuffer.Create(length, out bufferPtr);
            bufferLen = length;
            bufferUsed = 0;
        }

        protected UnsafeBuffer buffer;
        protected long bufferLen;
        protected long bufferUsed;
        protected T* bufferPtr;

        protected long bufferWrite;
        protected long bufferRead;

        public long Used { get => bufferUsed; }

        public virtual long Write(T* ptr, long count)
        {
            //Do nothing if the buffer length is zero
            if (bufferLen == 0)
                return 0;
            
            //Perform operation
            long written = 0;
            while (count > 0)
            {
                long writable = Math.Min(bufferLen - bufferWrite, count);
                Utils.Memcpy(bufferPtr + bufferWrite, ptr, writable * sizeof(T));
                bufferWrite = (bufferWrite + writable) % bufferLen;
                bufferUsed += writable;
                written += writable;
                count -= writable;
                ptr += writable;
            }

            //If we've written the entire buffer, update read location
            if (bufferUsed >= bufferLen)
            {
                bufferUsed = bufferLen;
                bufferRead = (bufferWrite + 1) % bufferLen;
            }

            return written;
        }

        public virtual long Read(T* ptr, long count)
        {
            //Do nothing if the buffer length is zero
            if (bufferLen == 0)
                return 0;

            //Perform operation
            long read = 0;
            while (count > 0 && bufferUsed > 0)
            {
                long readable = Math.Min(bufferLen - bufferRead, Math.Min(count, bufferUsed));
                Utils.Memcpy(ptr, bufferPtr + bufferRead, readable * sizeof(T));
                bufferRead = (bufferRead + readable) % bufferLen;
                bufferUsed -= readable;
                read += readable;
                count -= readable;
                ptr += readable;
            }
            return read;
        }

        public void Dispose()
        {
            buffer.Dispose();
        }
    }
}
