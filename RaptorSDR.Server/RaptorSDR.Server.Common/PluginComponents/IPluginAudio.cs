using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.PluginComponents
{
    public interface IPluginAudio : IPluginComponent
    {
        int PriorityWeight { get; }

        void ReconfigureAudio(float sampleRate);
        unsafe void SendAudio(float* left, float* right, int count);
    }
}
