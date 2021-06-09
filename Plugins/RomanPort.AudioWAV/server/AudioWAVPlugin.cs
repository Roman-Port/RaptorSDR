using System;
using RaptorSDR.Server.Common;

namespace RomanPort.AudioWAV
{
    public class AudioWAVPlugin : RaptorPlugin
    {
        public override string DeveloperName => "RomanPort";
        public override string PluginName => "AudioWAV";
        
        public AudioWAVPlugin(IRaptorControl control) : base(control)
        {
                
        }
        
        public override void Init()
        {
            RegisterAudio(new WavAudioProvider(this));
        }
    }
}