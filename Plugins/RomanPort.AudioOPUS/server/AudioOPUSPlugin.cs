using System;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.PluginComponents;
using RaptorSDR.Server.Common.WebStream;

namespace RomanPort.AudioOPUS
{
    public partial class AudioOPUSPlugin : RaptorPlugin, IPluginAudio
    {
        private IRaptorWebStreamServer<OpusStreamClient> stream;
        private float inputSampleRate;

        public int PriorityWeight => 100;
        public string DisplayName => "OPUS Low-Latency Audio";

        public AudioOPUSPlugin(IRaptorControl control) : base(control)
        {
            
        }
        
        public override void Init()
        {
            //Create stream
            stream = Control.RegisterWebStream<OpusStreamClient>(Id.Then("Stream"));
            stream.OnClientConnected += Stream_OnClientConnected;

            //Register
            Control.RegisterPluginAudio(this, this);
        }

        private void Stream_OnClientConnected(OpusStreamClient client)
        {
            if(inputSampleRate != 0)
                client.ConfigureAudio(inputSampleRate);
        }

        public void ReconfigureAudio(float sampleRate)
        {
            inputSampleRate = sampleRate;
            stream.ForEachClient((OpusStreamClient c) => c.ConfigureAudio(sampleRate));
        }

        public unsafe void SendAudio(float* left, float* right, int count)
        {
            stream.ForEachClient((OpusStreamClient c) => c.ProcessAudio(left, right, count));
        }
    }
}