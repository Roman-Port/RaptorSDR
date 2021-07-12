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
        public abstract Guid PluginUuid { get; }
        public abstract ushort VersionMajor { get; }
        public abstract ushort VersionMinor { get; }
        public abstract ushort VersionBuild { get; }
        public abstract uint SdkVersion { get; }

        public ulong VersionCode { get => ((ulong)VersionMajor << 32) | ((ulong)VersionMinor << 16) | VersionBuild; }

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

        protected T ReadPluginSetting<T>(string key, T defaultValue)
        {
            return control.ReadSetting(Id, key, defaultValue);
        }

        protected void WritePluginSetting<T>(string key, T value)
        {
            control.WriteSetting(Id, key, value);
        }

        protected IRaptorEndpoint CreateEndpoint(string name)
        {
            return PluginRpc.CreateSubscription(name);
        }
    }
}
