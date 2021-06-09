using RaptorSDR.Server.Common.Dispatchers;
using RaptorSDR.Server.Common.PluginComponents;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public abstract class RaptorPlugin : IRaptorContext
    {
        public RaptorPlugin(IRaptorControl control)
        {
            this.control = control;
            dispatcher = new RaptorDispatcherOpcode(control.RpcPluginDispatcher.CreateSubscription(Id.ToString()));
        }

        public RaptorNamespace Id => control.Id.Then(DeveloperName).Then(PluginName);
        public IRaptorControl Control => control;
        public RaptorDispatcherOpcode PluginRpc { get => dispatcher; }

        public abstract string DeveloperName { get; }
        public abstract string PluginName { get; }

        private IRaptorControl control;
        private RaptorDispatcherOpcode dispatcher;

        public abstract void Init();

        protected void RegisterDemodulator(IPluginDemodulator demodulator)
        {
            control.RegisterPluginDemodulator(this, demodulator);
        }

        protected void RegisterSource(IPluginSource source)
        {
            control.RegisterPluginSource(this, source);
        }

        protected void RegisterAudio(IPluginAudio audio)
        {
            control.RegisterPluginAudio(this, audio);
        }
    }
}
