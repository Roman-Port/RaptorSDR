using RomanPort.LibSDR.Components;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.Recorder.Buffers
{
    public unsafe class RecorderGrowingBuffer<T> : RecorderCircularBuffer<T> where T : unmanaged
    {
        public RecorderGrowingBuffer(int length) : base(length)
        {
        }

        public override unsafe long Write(T* ptr, long count)
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

            return base.Write(ptr, count);
        }
    }
}
