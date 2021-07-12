using System;
using RaptorSDR.Server.Common;

namespace RomanPort.SourceFile
{
    public partial class SourceFilePlugin : RaptorPlugin
    {
        public SourceFilePlugin(IRaptorControl control) : base(control)
        {
                
        }
        
        public override void Init()
        {
            RegisterSource(new PluginIqFileSource(this));
        }
    }
}