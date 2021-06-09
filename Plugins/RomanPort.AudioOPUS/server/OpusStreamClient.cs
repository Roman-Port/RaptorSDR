using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.WebStream;
using RomanPort.AudioOPUS.OGG;
using RomanPort.AudioOPUS.OPUS;
using RomanPort.LibSDR.Components;
using RomanPort.LibSDR.Components.Resamplers.Arbitrary;
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

namespace RomanPort.AudioOPUS
{
    public unsafe class OpusStreamClient : RaptorWebStream
    {
        public OpusStreamClient(IRaptorWebStreamClient ctx) : base(ctx)
        {
        }

        private OpusEncoder encoder;
        private int outputSampleRate;

        private OggEncoder ogg;
        private long oggGranulePos;
        private byte[] oggBuffer;

        private bool configStale;
        private float inputSampleRate;
        private ArbitraryStereoResampler resampler;

        private byte[] opusBuffer;
        private GCHandle opusBufferHandle;
        private byte* opusBufferPtr;

        private UnsafeBuffer audioBuffer;
        private float* audioBufferPtr;

        private OpusBuffer opusInputBuffer;

        private const int OPUS_BUFFER_SIZE = 65536;
        private const int OPUS_CHANNELS = 2;

        public override bool HandleRequest()
        {
            //Get sample rate
            if (!HttpQuery.TryGetValue("sample_rate", out string sampleRateString) || !int.TryParse(sampleRateString, out outputSampleRate))
                return false;

            //Create encoder
            try
            {
                encoder = new OpusEncoder(OPUS_CHANNELS, outputSampleRate);
            } catch (OpusException error)
            {
                Control.Log(RaptorLogLevel.WARN, "OpusStreamClient", $"Client failed to open OPUS session due to OPUS create error: {error.OpusError.ToString()}");
                return false;
            } catch (DllNotFoundException)
            {
                Control.Log(RaptorLogLevel.FATAL, "OpusStreamClient", "Unable to start ANY OPUS streams, as the LibOpus DLL is missing.");
                return false;
            } catch (Exception ex)
            {
                Control.Log(RaptorLogLevel.ERROR, "OpusStreamClient", $"Unable to create OPUS encoder: {ex.Message}{ex.StackTrace}");
                return false;
            }

            return true;
        }

        public override void HandleOpen()
        {
            //Create the OPUS buffer
            opusBuffer = new byte[OPUS_BUFFER_SIZE];
            opusBufferHandle = GCHandle.Alloc(opusBuffer, GCHandleType.Pinned);
            opusBufferPtr = (byte*)opusBufferHandle.AddrOfPinnedObject();

            //Create the audio buffer
            audioBuffer = UnsafeBuffer.Create(Control.BufferSize, out audioBufferPtr);

            //Create OPUS input buffer
            opusInputBuffer = new OpusBuffer(OPUS_CHANNELS, outputSampleRate, 20, Control.BufferSize);
            opusInputBuffer.OnFrame += OpusInputBuffer_OnFrame;

            //Handle OGG stuff if needed
            if (!IsWebSocket)
            {
                //Create
                ogg = new OggEncoder();
                oggBuffer = new byte[OPUS_BUFFER_SIZE + 128];

                //Write OPUS header
                byte[] head = OggEncoder.CreateOpusHeader(2, 0, outputSampleRate, 0);
                int count = ogg.WriteOggFrame(oggBuffer, head, head.Length, 0, 2);
                SendMessage(oggBuffer, count);

                //Write tags
                byte[] tags = OggEncoder.CreateOpusTags("RaptorSDR", new Dictionary<string, string>());
                count = ogg.WriteOggFrame(oggBuffer, tags, tags.Length, 0, 0);
                SendMessage(oggBuffer, count);
            }
        }

        public void ConfigureAudio(float audioSampleRate)
        {
            inputSampleRate = audioSampleRate;
            configStale = true;
        }

        public void ProcessAudio(float* left, float* right, int count)
        {
            //Check if the resampler is stale
            if(configStale)
            {
                resampler?.Dispose();
                resampler = new ArbitraryStereoResampler(inputSampleRate, outputSampleRate, Control.BufferSize);
                configStale = false;
            }

            //Add to resampler
            resampler.Input(left, right, count);

            //Read from resampler
            count = resampler.Output(audioBufferPtr, Control.BufferSize);
            while(count != 0)
            {
                //Write to OPUS buffer
                opusInputBuffer.Write(audioBufferPtr, count);

                //Read from resampler
                count = resampler.Output(audioBufferPtr, Control.BufferSize);
            }
        }

        private void OpusInputBuffer_OnFrame(float* ptr, int count)
        {
            //Compress
            int compressed = encoder.EncodeFrame(opusBufferPtr, OPUS_BUFFER_SIZE, ptr, count);

            //Send over network
            SendOpusFrame(compressed, count);
        }

        private void SendOpusFrame(int count, int deltaSamples)
        {
            //If this is a websocket, send the raw frame. If it isn't, wrap it in an OGG container
            if(IsWebSocket)
            {
                //Send raw
                SendMessage(opusBuffer, count);
            } else
            {
                //Wrap in an OGG container
                oggGranulePos += deltaSamples;
                count = ogg.WriteOggFrame(oggBuffer, opusBuffer, count, oggGranulePos, 0);
                SendMessage(oggBuffer, count);
            }
        }

        public override void HandleClose()
        {
            //Free buffers
            audioBuffer.Dispose();
            opusBufferHandle.Free();

            //Free encoder
            encoder.Dispose();
        }

        public override void HandleMessage(byte[] data, int count)
        {
            //Ignore, this is one-way only
        }
    }
}
