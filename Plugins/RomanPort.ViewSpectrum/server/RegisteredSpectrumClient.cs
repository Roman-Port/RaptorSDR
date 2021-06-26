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

        private byte PROTOCOL_VERSION = 1;

        private bool hasInitialized;
        private bool useHd; //When this is true, we use shorts instead of bytes when sending samples

        private int settingOutputSize;
        private ushort settingToken = 0;
        private float settingAttack = 0.4f;
        private float settingDecay = 0.4f;
        private float settingSampleOffset = 20;
        private float settingSampleRange = 80;
        private float settingZoom = 0.5f;
        private float settingZoomCenter = 0.5f;

        private int outputSize; //thread safe, not changed until we're able to
        private int framesSinceLastFull;

        private UnsafeBuffer powerBuffer;
        private float* powerBufferPtr;
        private UnsafeBuffer resizedBuffer;
        private float* resizedBufferPtr;
        private byte[] outputBuffer;

        private const int PACKET_HEADER_LEN = 8;

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
            UpdateSetting(payload["zoom"], 0f, 1f, ref settingZoom);
            UpdateSetting(payload["center"], 0f, 1f, ref settingZoomCenter);

            //Update token. This is simply just an optional addition so that the client can know when their settings were applied
            settingToken = (ushort)(payload.TryGetValue("token", out JToken token) ? token : 0);
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

            //Apply zoom
            int zoomSize = ProcessZoom(size, out float* zoomedPtr);

            //Send frame
            EncodeSendFrame(SpectrumStreamOpcode.OP_FRAME_ZOOM, zoomedPtr, zoomSize, sampleRate);

            //Every once in a while send a frame that isn't zoomed for the "unzoomed" thumbnail
            if(framesSinceLastFull == 0 || ++framesSinceLastFull == 30)
            {
                EncodeSendFrame(SpectrumStreamOpcode.OP_FRAME_FULL, powerBufferPtr, size, sampleRate);
                framesSinceLastFull = 1;
            }
        }

        private int ProcessZoom(int inputSize, out float* ptr)
        {
            //Process the output size
            int outputSize = Math.Min(inputSize, Math.Max(2, (int)(inputSize * settingZoom)));

            //Determine how much to offset it by
            int offset = (int)((inputSize * settingZoomCenter) - (outputSize / 2));

            //Constrain
            offset = Math.Max(0, Math.Min(inputSize - outputSize, offset));

            //Create the pointer by taking offsetting the bit by the difference
            ptr = powerBufferPtr + offset;

            //Do a little verification
            if (ptr < powerBufferPtr || (ptr + outputSize) > (powerBufferPtr + inputSize) || outputSize > inputSize)
                throw new Exception("Processed zoom is out of range. This would've caused unmanaged memory corruption. This is a calculation bug.");

            return outputSize;
        }

        private void EncodeSendFrame(SpectrumStreamOpcode opcode, float* ptr, int count, int sampleRate)
        {
            //Resize to output
            FFTUtil.ResizePower(ptr, resizedBufferPtr, count, outputSize);

            //Bring output frame to range
            for (int i = 0; i < outputSize; i++)
                resizedBufferPtr[i] = (-resizedBufferPtr[i] - settingSampleOffset) / settingSampleRange;

            //Clamp output frame to 0-1
            for (int i = 0; i < outputSize; i++)
                resizedBufferPtr[i] = Math.Max(0, Math.Min(1, resizedBufferPtr[i]));

            //Write output header
            WriteHeaderValue(0, PROTOCOL_VERSION);
            WriteHeaderValue(1, (byte)opcode);
            WriteHeaderValue(2, settingToken);
            WriteHeaderValue(4, sampleRate);

            //Encode frame
            if (useHd)
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
            } else
            {
                //Convert all to bytes
                for (int i = 0; i < outputSize; i++)
                    outputBuffer[PACKET_HEADER_LEN + i] = (byte)(resizedBufferPtr[i] * byte.MaxValue);
            }

            //Send frame
            SendMessage(outputBuffer, outputBuffer.Length);
        }

        private void WriteHeaderValue<T>(int offset, T value) where T : unmanaged
        {
            //Get pointer as bytes as well as size
            byte* ptr = (byte*)&value;
            int size = sizeof(T);

            //Write in little endian, regardless of the current system's endianess
            if(BitConverter.IsLittleEndian)
            {
                for (int i = 0; i < size; i++)
                    outputBuffer[offset + i] = ptr[i];
            } else
            {
                for (int i = 0; i < size; i++)
                    outputBuffer[offset + i] = ptr[size - 1 - i];
            }
        }
    }
}
