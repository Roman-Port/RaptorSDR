using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.PluginComponents;
using RaptorSDR.Server.Common.WebStream;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.AudioWAV
{
    public unsafe class WavAudioProvider : IPluginAudio
    {
        public WavAudioProvider(AudioWAVPlugin plugin)
        {
            this.plugin = plugin;
            stream = plugin.Control.RegisterWebStream<WavAudioClient>(Id.Then("Wav"));
        }
        
        public int PriorityWeight => -100;
        public string DisplayName => "WAV Audio (fallback)";
        public RaptorNamespace Id => plugin.Id.Then("AudioProvider");
        public IRaptorControl Control => plugin.Control;

        private AudioWAVPlugin plugin;
        private float sampleRate;
        private IRaptorWebStreamServer<WavAudioClient> stream;

        public void ReconfigureAudio(float sampleRate)
        {
            this.sampleRate = sampleRate;
        }

        public void SendAudio(float* left, float* right, int count)
        {
            stream.ForEachClient((WavAudioClient client) => client.SendAudio(sampleRate, left, right, count));
        }
    }
}
