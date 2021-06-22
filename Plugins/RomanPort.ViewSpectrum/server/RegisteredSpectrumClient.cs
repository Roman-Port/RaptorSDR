using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RaptorSDR.Server.Common.WebStream;
using RomanPort.LibSDR.Components;
using RomanPort.LibSDR.Components.FFTX;
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

namespace RomanPort.ViewSpectrum
{
    public unsafe class RegisteredSpectrumClient : RaptorWebStream
    {
        public RegisteredSpectrumClient(IRaptorWebStreamClient ctx) : base(ctx)
        {
        }

        private bool hasInitialized;
        private bool useHd; //When this is true, we use shorts instead of bytes when sending samples

        private int settingOutputSize;
        private float settingAttack = 0.4f;
        private float settingDecay = 0.4f;
        private float settingSampleOffset = 20;
        private float settingSampleRange = 80;

        private int outputSize; //thread safe, not changed until we're able to

        private UnsafeBuffer powerBuffer;
        private float* powerBufferPtr;
        private UnsafeBuffer resizedBuffer;
        private float* resizedBufferPtr;
        private byte[] outputBuffer;

        private const int PACKET_HEADER_LEN = 4;

        public override bool HandleRequest()
        {
            return true;
        }

        public override void HandleMessage(byte[] data, int count)
        {
            //Decode as JSON
            JObject payload = JsonConvert.DeserializeObject<JObject>(Encoding.UTF8.GetString(data, 0, count));

            //Update settings
            UpdateSetting(payload["size"], 0, 3840, ref settingOutputSize);
            UpdateSetting(payload["attack"], 0f, 1f, ref settingAttack);
            UpdateSetting(payload["decay"], 0f, 1f, ref settingDecay);
            UpdateSetting(payload["offset"], 0f, 10000f, ref settingSampleOffset);
            UpdateSetting(payload["range"], 1f, 10000f, ref settingSampleRange);
        }

        private static void UpdateSetting(JToken input, float min, float max, ref float output)
        {
            //Validate
            if (input == null || (input.Type != JTokenType.Float && input.Type != JTokenType.Integer))
                return;

            //Constrain and apply
            output = Math.Max(min, Math.Min(max, (float)input));
        }

        private static void UpdateSetting(JToken input, int min, int max, ref int output)
        {
            //Validate
            if (input == null || (input.Type != JTokenType.Float && input.Type != JTokenType.Integer))
                return;

            //Constrain and apply
            output = Math.Max(min, Math.Min(max, (int)input));
        }

        public override void HandleOpen()
        {
            //Read if this should be HD or not
            useHd = HttpQuery.ContainsKey("hd") && HttpQuery["hd"] == "true";
        }

        public override void HandleClose()
        {

        }

        public void OnFftFrame(float* power, int size, int sampleRate)
        {
            //If we haven't initialized, do that
            if(!hasInitialized)
            {
                //Create new buffer
                powerBuffer = UnsafeBuffer.Create(size, out powerBufferPtr);

                //Copy current samples to it so it isn't 0
                Utils.Memcpy(powerBufferPtr, power, size * sizeof(float));

                //Update state
                hasInitialized = true;
            }

            //If the requested buffer size is 0, stop
            if (settingOutputSize == 0)
                return;

            //If the output buffer size changed, update it 
            if(settingOutputSize != outputSize)
            {
                //Clear old buffers
                resizedBuffer?.Dispose();

                //Change state
                outputSize = settingOutputSize;

                //Create new bufers
                resizedBuffer = UnsafeBuffer.Create(outputSize, out resizedBufferPtr);
                outputBuffer = new byte[PACKET_HEADER_LEN + (outputSize * (useHd ? 2 : 1))];
            }

            //Apply smoothening
            FFTUtil.ApplySmoothening(powerBufferPtr, power, size, settingAttack, settingDecay);
            //Utils.Memcpy(powerBufferPtr, power, size * sizeof(float));

            //Resize to output
            FFTUtil.ResizePower(powerBufferPtr, resizedBufferPtr, size, outputSize);

            //Bring output frame to range
            for (int i = 0; i < outputSize; i++)
                resizedBufferPtr[i] = (-resizedBufferPtr[i] - settingSampleOffset) / settingSampleRange;

            //Clamp output frame to 0-1
            for (int i = 0; i < outputSize; i++)
                resizedBufferPtr[i] = Math.Max(0, Math.Min(1, resizedBufferPtr[i]));

            //Write output header
            outputBuffer[0] = ((byte*)&sampleRate)[0];
            outputBuffer[1] = ((byte*)&sampleRate)[1];
            outputBuffer[2] = ((byte*)&sampleRate)[2];
            outputBuffer[3] = ((byte*)&sampleRate)[3];

            //Encode frame
            if (useHd)
                EncodeFrameHd();
            else
                EncodeFrameSd();

            //Send frame
            SendMessage(outputBuffer, outputBuffer.Length);
        }

        private void EncodeFrameSd()
        {
            //Convert all to bytes
            for (int i = 0; i < outputSize; i++)
                outputBuffer[PACKET_HEADER_LEN + i] = (byte)(resizedBufferPtr[i] * byte.MaxValue);
        }

        private void EncodeFrameHd()
        {
            //Allocate a temporary ushort that we can use
            ushort temp = 0;
            byte* tempPtr = (byte*)&temp;

            //Convert all to ushort and then write
            int outputIndex = PACKET_HEADER_LEN;
            for (int i = 0; i < outputSize; i++)
            {
                //Convert
                temp = (ushort)(resizedBufferPtr[i] * ushort.MaxValue);
                
                //Write
                outputBuffer[outputIndex++] = tempPtr[0];
                outputBuffer[outputIndex++] = tempPtr[1];
            }
        }
    }
}
