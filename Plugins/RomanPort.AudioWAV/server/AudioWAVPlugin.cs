using System;
using RaptorSDR.Server.Common;

namespace RomanPort.AudioWAV
{
    public partial class AudioWAVPlugin : RaptorPlugin
    {
        public AudioWAVPlugin(IRaptorControl control) : base(control)
        {
                
        }
        
        public override void Init()
        {
            RegisterAudio(new WavAudioProvider(this));
        }
    }
}