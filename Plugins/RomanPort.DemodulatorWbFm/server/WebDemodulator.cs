using System;
using System.Collections.Generic;
using System.Text;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.PluginComponents;
using RomanPort.LibSDR.Demodulators.Analog.Broadcast;

namespace RomanPort.DemodulatorWbFm
{
    public class WebDemodulator : WbFmDemodulator, IPluginDemodulator
    {
        public WebDemodulator(IRaptorContext ctx, string id)
        {
            this.ctx = ctx;
            this.id = id;

            OnRdsDetected += (bool detected) => OnWebRdsDetected?.Invoke(this, detected);
            OnRdsFrameEmitted += (ulong frame) => OnWebRdsFrame?.Invoke(this, frame);
            OnStereoDetected += (bool detected) => OnWebStereoDetected?.Invoke(this, detected);
        }
        
        public string DisplayName => "Wideband FM";
        public string DisplayNameShort => "WFM";

        public RaptorNamespace Id => ctx.Id.Then(id);

        public IRaptorControl Control => ctx.Control;

        private IRaptorContext ctx;
        private string id;

        public event IPluginDemodulator_EventArgs<bool> OnWebStereoDetected;
        public event IPluginDemodulator_EventArgs<bool> OnWebRdsDetected;
        public event IPluginDemodulator_EventArgs<ulong> OnWebRdsFrame;
    }
}
