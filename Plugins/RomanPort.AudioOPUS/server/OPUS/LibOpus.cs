using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

namespace RomanPort.AudioOPUS.OPUS
{
    public class LibOpus
    {
        public const string OpusLibraryName = "libopus";

        [DllImport(OpusLibraryName, CallingConvention = CallingConvention.Cdecl, EntryPoint = "opus_encoder_create")]
        public static extern IntPtr _OpusCreateEncoder(int sampleRate, int channels, int application, out OpusError error);

        [DllImport(OpusLibraryName, CallingConvention = CallingConvention.Cdecl, EntryPoint = "opus_encoder_destroy")]
        public static extern void OpusDestroyEncoder(IntPtr encoder);

        [DllImport(OpusLibraryName, CallingConvention = CallingConvention.Cdecl, EntryPoint = "opus_encode")]
        public static unsafe extern int _OpusEncode(IntPtr encoder, byte* pcmData, int frameSize, byte* data, int maxDataBytes);

        [DllImport(OpusLibraryName, CallingConvention = CallingConvention.Cdecl, EntryPoint = "opus_encode_float")]
        public static unsafe extern int _OpusEncodeFloat(IntPtr encoder, byte* pcmData, int frameSize, byte* data, int maxDataBytes);

        [DllImport(OpusLibraryName, CallingConvention = CallingConvention.Cdecl, EntryPoint = "opus_encoder_ctl")]
        public static extern OpusError _OpusEncoderControl(IntPtr encoder, OpusControl request, int value);

        [DllImport(OpusLibraryName, CallingConvention = CallingConvention.Cdecl, EntryPoint = "opus_decoder_create")]
        public static extern IntPtr _OpusCreateDecoder(int sampleRate, int channels, out OpusError error);

        [DllImport(OpusLibraryName, CallingConvention = CallingConvention.Cdecl, EntryPoint = "opus_decoder_destroy")]
        public static extern void OpusDestroyDecoder(IntPtr decoder);

        [DllImport(OpusLibraryName, CallingConvention = CallingConvention.Cdecl, EntryPoint = "opus_decode")]
        public static unsafe extern int _OpusDecode(IntPtr decoder, byte* opusData, int opusDataLength, byte* data, int frameSize, int decodeFec);

        [DllImport(OpusLibraryName, CallingConvention = CallingConvention.Cdecl, EntryPoint = "opus_packet_get_nb_channels")]
        public static unsafe extern int _OpusGetPacketChanelCount(byte* opusData);

        [DllImport(OpusLibraryName, CallingConvention = CallingConvention.Cdecl, EntryPoint = "opus_packet_get_nb_frames")]
        public static unsafe extern int _OpusGetPacketFrameCount(byte* opusData, int length);

        [DllImport(OpusLibraryName, CallingConvention = CallingConvention.Cdecl, EntryPoint = "opus_packet_get_samples_per_frame")]
        public static unsafe extern int _OpusGetPacketSamplePerFrameCount(byte* opusData, int samplingRate);

        [DllImport(OpusLibraryName, CallingConvention = CallingConvention.Cdecl, EntryPoint = "opus_decoder_ctl")]
        public static extern int _OpusDecoderControl(IntPtr decoder, OpusControl request, out int value);
    }

    [Flags]
    public enum OpusError
    {
        Ok = 0,
        BadArgument = -1,
        BufferTooSmall = -2,
        InternalError = -3,
        InvalidPacket = -4,
        Unimplemented = -5,
        InvalidState = -6,
        AllocationFailure = -7
    }

    public enum OpusControl : int
    {
        SetBitrate = 4002,
        SetBandwidth = 4008,
        SetInBandFec = 4012,
        SetPacketLossPercent = 4014,
        SetSignal = 4024,
        ResetState = 4028,
        GetLastPacketDuration = 4039
    }
}
