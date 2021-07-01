using Newtonsoft.Json.Linq;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.DataProviders;
using RaptorSDR.Server.Common.Dispatchers;
using RomanPort.LibSDR.Components;
using RomanPort.Recorder.Config;
using RomanPort.Recorder.Misc;
using System;
using System.Collections.Generic;
using System.Text;
using System.Timers;

namespace RomanPort.Recorder
{
    public unsafe class RecorderSessionApi : IRaptorContext
    {
        public RecorderSessionApi(RecorderPlugin plugin, RecorderSettings settings, IRaptorEndpoint endpoint)
        {
            //Configure
            this.plugin = plugin;
            this.settings = settings;

            //Create endpoints
            dispatcher = new RaptorDispatcherOpcode(endpoint);
            endpointStart = dispatcher.CreateSubscription("RECORDING_START").BindOnMessage(EndpointStart_OnMessage);
            endpointStop = dispatcher.CreateSubscription("RECORDING_STOP").BindOnMessage(EndpointEnd_OnMessage);
            endpointCancel = dispatcher.CreateSubscription("RECORDING_CANCEL").BindOnMessage(EndpointCancel_OnMessage);

            //Create session
            session = new RecorderSession(settings, plugin.Control.BufferSize, 2);

            //Create data providers
            dpStatus = new RaptorPrimitiveDataProvider<string>(this, "Status")
                .SetWebReadOnly(true);
            dpSize = new RaptorPrimitiveDataProvider<long>(this, "Size")
                .SetWebReadOnly(true);
            dpDuration = new RaptorPrimitiveDataProvider<long>(this, "Duration")
                .SetWebReadOnly(true);

            //Set default values
            dpStatus.Value = session.Status.ToString();

            //Bind events from session
            session.OnStatusChanged += Session_OnStatusChanged;

            //Create timer
            updateTimer = new Timer(500);
            updateTimer.AutoReset = true;
            updateTimer.Elapsed += UpdateTimer_Elapsed;
            updateTimer.Start();

            //Bind to source
            switch(settings.source)
            {
                case RecorderSource.AUDIO:
                    converter = new StereoAudioConverter(plugin.Control.BufferSize, session);
                    Control.Vfo.OnAudioEmitted += (IRaptorVfo vfo, float* left, float* right, int count) => converter.Convert(left, right, count);
                    Control.Vfo.OnAudioReconfigured += (IRaptorVfo vfo, float audioSampleRate) => session.ChangeSampleRate((int)audioSampleRate);
                    break;
                case RecorderSource.BASEBAND:
                    Control.Radio.OnConfigured += (IRaptorRadio radio) => session.ChangeSampleRate((int)radio.SampleRate);
                    Control.Radio.OnSamples += (Complex* ptr, int count) => session.WriteSamples((float*)ptr, count * 2);
                    break;
                default:
                    throw new Exception("Unknown and unsupported audio source.");
            }
        }

        private RecorderPlugin plugin;
        private RecorderSettings settings;
        private RecorderSession session;
        private Timer updateTimer;

        private RaptorDispatcherOpcode dispatcher;
        private IRaptorEndpoint endpointStart;
        private IRaptorEndpoint endpointStop;
        private IRaptorEndpoint endpointCancel;

        private StereoAudioConverter converter;

        private RaptorPrimitiveDataProvider<string> dpStatus;
        private RaptorPrimitiveDataProvider<long> dpSize;
        private RaptorPrimitiveDataProvider<long> dpDuration;

        public RaptorNamespace Id => plugin.Id.Then(settings.id);
        public IRaptorControl Control => plugin.Control;

        private void UpdateTimer_Elapsed(object sender, ElapsedEventArgs e)
        {
            dpSize.Value = session.BytesWritten / 1000;
            dpDuration.Value = session.SecondsWritten;
        }

        private void Session_OnStatusChanged(RecorderSession session, RecorderStatus status)
        {
            dpStatus.Value = status.ToString();
        }

        private void EndpointStart_OnMessage(IRaptorEndpoint endpoint, IRaptorEndpointClient client, JObject payload)
        {
            //Make sure user has required scope
            if (!client.Session.CheckPluginScope(RecorderScopes.SCOPE_MANAGE_RECORDING))
                return;
            
            //Perform action
            session.StartRecording();
        }

        private void EndpointEnd_OnMessage(IRaptorEndpoint endpoint, IRaptorEndpointClient client, JObject payload)
        {
            //Read file path for output
            if (!payload.TryGetValue("output", out JToken output) || output.Type != JTokenType.String)
                return;

            //Validate access
            var file = client.Session.ResolveWebFile((string)output);
            if (!file.CanWrite)
                return;
            
            //Stop
            session.EndRecording(file.AbsoluteFilename);
        }

        private void EndpointCancel_OnMessage(IRaptorEndpoint endpoint, IRaptorEndpointClient client, JObject payload)
        {
            //Make sure user has required scope
            if (!client.Session.CheckPluginScope(RecorderScopes.SCOPE_MANAGE_RECORDING))
                return;

            //Perform action
            session.CancelRecording();
        }
    }
}
