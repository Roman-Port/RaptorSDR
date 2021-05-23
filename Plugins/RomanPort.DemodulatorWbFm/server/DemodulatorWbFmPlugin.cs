using System;
using RaptorSDR.Server.Common;

namespace RomanPort.DemodulatorWbFm
{
    public class DemodulatorWbFmPlugin : RaptorPlugin
    {
        public override string DeveloperName => "RomanPort";
        public override string PluginName => "DemodulatorWbFm";
        
        public DemodulatorWbFmPlugin(IRaptorControl control) : base(control)
        {
            RegisterDemodulator(new WebDemodulator(this, "WbFm"));
        }
        
        public override void Init()
        {
            
        }
    }
}