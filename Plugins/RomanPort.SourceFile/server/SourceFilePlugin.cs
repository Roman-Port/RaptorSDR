using System;
using RaptorSDR.Server.Common;

namespace RomanPort.SourceFile
{
    public class SourceFilePlugin : RaptorPlugin
    {
        public override string DeveloperName => "RomanPort";
        public override string PluginName => "SourceFile";
        
        public SourceFilePlugin(IRaptorControl control) : base(control)
        {
                
        }
        
        public override void Init()
        {
            
        }
    }
}