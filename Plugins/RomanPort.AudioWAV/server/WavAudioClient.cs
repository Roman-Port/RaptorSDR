using RaptorSDR.Server.Common.WebStream;
using RomanPort.LibSDR.Components;
using RomanPort.LibSDR.Components.IO.WAV;
using RomanPort.LibSDR.Components.Resamplers.Arbitrary;
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

namespace RomanPort.AudioWAV
{
    public unsafe class WavAudioClient : RaptorWebStream
    {
        public WavAudioClient(IRaptorWebStreamClient ctx) : base(ctx)
        {
        }

        private float outputSampleRate;
        private float inputSampleRate;
        private ArbitraryStereoResampler resampler;

        private byte[] buffer;
        private GCHandle bufferHandle;
        private float* bufferFloatPtr;
        private short* bufferShortPtr;

        private const float MAX_SAMPLE_RATE = 96000;
        private const float MIN_SAMPLE_RATE = 1000;

        public override bool HandleRequest()
        {
            return HttpQuery.TryGetValue("sample_rate", out string sampleRateString) && float.TryParse(sampleRateString, out outputSampleRate) && outputSampleRate <= MAX_SAMPLE_RATE && outputSampleRate >= MIN_SAMPLE_RATE;
        }

        public override void HandleOpen()
        {
            //Create buffer
            buffer = new byte[Control.BufferSize * 2 * sizeof(float)];
            bufferHandle = GCHandle.Alloc(buffer, GCHandleType.Pinned);
            bufferFloatPtr = (float*)bufferHandle.AddrOfPinnedObject();
            bufferShortPtr = (short*)bufferHandle.AddrOfPinnedObject();

            //Only on an HTTP stream, send WAV headers
            if(!IsWebSocket)
            {
                SendMessage(WavHeaderUtil.CreateHeader(new WavFileInfo
                {
                    bitsPerSample = 16,
                    channels = 2,
                    sampleRate = (int)outputSampleRate
                }), WavHeaderUtil.HEADER_LENGTH);
            }
        }

        public override void HandleMessage(byte[] data, int count)
        {
            
        }

        public override void HandleClose()
        {
            
        }

        public void SendAudio(float inputSampleRate, float* left, float* right, int count)
        {
            //Check if reconfiguration is needed
            if(inputSampleRate != this.inputSampleRate)
            {
                //Create resampler
                resampler = new ArbitraryStereoResampler(inputSampleRate, outputSampleRate, Control.BufferSize);

                //Update config
                this.inputSampleRate = inputSampleRate;
            }

            //Input into resampler
            resampler.Input(left, right, count);

            //Output
            int read = resampler.Output(bufferFloatPtr, Control.BufferSize);
            while(read != 0)
            {
                //Convert
                for(int i = 0; i<read * 2; i++)
                    bufferShortPtr[i] = (short)(bufferFloatPtr[i] * short.MaxValue);
                
                //Send on network
                SendMessage(buffer, read * 2 * sizeof(short));

                //Read
                read = resampler.Output(bufferFloatPtr, Control.BufferSize);
            }
        }
    }
}
