using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.AudioOPUS.OPUS
{
    public unsafe class OpusEncoder : IDisposable
    {
        public OpusEncoder(int channels, int sampleRate)
        {
            //Set
            this.channels = channels;
            this.sampleRate = sampleRate;

            //Create OPUS encoder
            opus = LibOpus._OpusCreateEncoder(sampleRate, channels, MUSIC_SIG, out OpusError error);
            if (error != OpusError.Ok)
                throw new OpusException(error);
        }

        private const int MUSIC_SIG = 2049;

        private int channels;
        private int sampleRate;

        private IntPtr opus;

        public int EncodeFrame(byte* opusDataPtr, int opusDataSize, float* frameBufferPtr, int frameSize)
        {
            //Process
            int read = LibOpus._OpusEncodeFloat(opus, (byte*)frameBufferPtr, frameSize, opusDataPtr, opusDataSize);

            //Check for errors
            if (read < 0)
                throw new OpusException((OpusError)read);

            return read;
        }

        public void Dispose()
        {
            LibOpus.OpusDestroyEncoder(opus);
        }
    }
}
