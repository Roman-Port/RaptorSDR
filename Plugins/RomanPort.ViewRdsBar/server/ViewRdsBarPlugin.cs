using System;
using RaptorSDR.Server.Common;

namespace RomanPort.ViewRdsBar
{
    public class ViewRdsBarPlugin : RaptorPlugin
    {
        public override string DeveloperName => "RomanPort";
        public override string PluginName => "ViewRdsBar";
        
        public ViewRdsBarPlugin(IRaptorControl control) : base(control)
        {
                
        }
        
        public override void Init()
        {
            
        }
    }
}