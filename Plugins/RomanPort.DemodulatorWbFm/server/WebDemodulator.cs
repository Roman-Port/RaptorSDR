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
        }
        
        public string DisplayName => "Wideband FM";
        public string DisplayNameShort => "WFM";

        public RaptorNamespace Id => ctx.Id.Then(id);

        public IRaptorControl Control => ctx.Control;

        private IRaptorVfo vfo;
        private IRaptorContext ctx;
        private string id;

        public void BindToVfo(IRaptorVfo vfo)
        {
            OnRdsDetected += WebDemodulator_OnRdsDetected;
            OnRdsFrameEmitted += WebDemodulator_OnRdsFrameEmitted;
            OnStereoDetected += WebDemodulator_OnStereoDetected;
        }

        private void WebDemodulator_OnStereoDetected(bool stereoDetected)
        {
            vfo.StereoDetected = stereoDetected;
        }

        private void WebDemodulator_OnRdsFrameEmitted(ulong frame)
        {
            vfo.ReportRdsFrame(frame);
        }

        private void WebDemodulator_OnRdsDetected(bool rdsDetected)
        {
            vfo.RdsDetected = rdsDetected;
        }
    }
}
