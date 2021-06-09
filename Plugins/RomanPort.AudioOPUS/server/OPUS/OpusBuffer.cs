using RomanPort.LibSDR.Components;
using RomanPort.LibSDR.Components.IO.Buffers;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.AudioOPUS.OPUS
{
    public unsafe delegate void OpusBuffer_FrameEventArgs(float* ptr, int frameSize);

    public unsafe class OpusBuffer : IDisposable
    {
        public OpusBuffer(int channels, int sampleRate, int frameDuration, int bufferSize)
        {
            //Set
            this.channels = channels;

            //Calculate frame size
            frameSize = (sampleRate * frameDuration) / 1000;

            //Create buffers
            frameBuffer = UnsafeBuffer.Create(frameSize * channels, out frameBufferPtr);
            audioBuffer = new CircularBuffer<float>(bufferSize * channels * 2);
        }

        private int channels;
        private int frameSize;
        private CircularBuffer<float> audioBuffer;

        private UnsafeBuffer frameBuffer;
        private float* frameBufferPtr;

        public event OpusBuffer_FrameEventArgs OnFrame;

        public void Write(float* ptr, int count)
        {
            //Write to buffer
            audioBuffer.Write(ptr, count * channels);

            //Read
            while (audioBuffer.Waiting >= frameSize * channels)
            {
                //Read frame
                audioBuffer.Read(frameBufferPtr, frameSize * channels);

                //Emit events
                OnFrame?.Invoke(frameBufferPtr, frameSize);
            }
        }

        public void Dispose()
        {
            frameBuffer.Dispose();
        }
    }
}
