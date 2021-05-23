using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public delegate void IRaptorVfo_AudioReconfiguredEventArgs(IRaptorVfo vfo, float audioSampleRate);
    public unsafe delegate void IRaptorVfo_AudioEmittedEventArgs(IRaptorVfo vfo, float* left, float* right, int count);
    
    public interface IRaptorVfo : IRaptorContext
    {
        bool StereoDetected { get; set; }
        bool RdsDetected { get; set; }
        long FreqOffset { get; set; }

        event IRaptorVfo_AudioReconfiguredEventArgs OnAudioReconfigured;
        event IRaptorVfo_AudioEmittedEventArgs OnAudioEmitted;

        void ReportRdsFrame(ulong frame);
    }
}
