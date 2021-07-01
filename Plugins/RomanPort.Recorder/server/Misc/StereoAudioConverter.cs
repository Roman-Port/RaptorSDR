using RomanPort.LibSDR.Components;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.Recorder.Misc
{
    public unsafe class StereoAudioConverter
    {
        public StereoAudioConverter(int bufferSize, RecorderSession output)
        {
            this.bufferSize = bufferSize;
            this.output = output;
            buffer = UnsafeBuffer.Create(bufferSize * 2, out bufferPtr);
        }

        private RecorderSession output;

        private int bufferSize;
        private UnsafeBuffer buffer;
        private float* bufferPtr;

        public void Convert(float* left, float* right, int count)
        {
            while(count > 0)
            {
                float* ptr = bufferPtr;
                int written = 0;
                for (int i = 0; i < bufferSize && count > 0; i++)
                {
                    *ptr++ = *left++;
                    *ptr++ = *right++;
                    count--;
                    written++;
                }
                output.WriteSamples(bufferPtr, written * 2);
            }
        }
    }
}
