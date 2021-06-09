using System;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.PluginComponents;
using RaptorSDR.Server.Common.WebStream;

namespace RomanPort.AudioOPUS
{
    public class AudioOPUSPlugin : RaptorPlugin, IPluginAudio
    {
        public override string DeveloperName => "RomanPort";
        public override string PluginName => "AudioOPUS";

        private IRaptorWebStreamServer<OpusStreamClient> stream;

        public int PriorityWeight => 100;
        public string DisplayName => "OPUS Low-Latency Audio";

        public AudioOPUSPlugin(IRaptorControl control) : base(control)
        {
            
        }
        
        public override void Init()
        {
            //Create stream
            stream = Control.RegisterWebStream<OpusStreamClient>(Id.Then("Stream"));

            //Register
            Control.RegisterPluginAudio(this, this);
        }

        public void ReconfigureAudio(float sampleRate)
        {
            stream.ForEachClient((OpusStreamClient c) => c.ConfigureAudio(sampleRate));
        }

        public unsafe void SendAudio(float* left, float* right, int count)
        {
            stream.ForEachClient((OpusStreamClient c) => c.ProcessAudio(left, right, count));
        }
    }
}