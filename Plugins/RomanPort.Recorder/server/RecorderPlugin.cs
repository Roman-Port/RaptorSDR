using System;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.DataProviders;
using RomanPort.Recorder.Config;

namespace RomanPort.Recorder
{
    public class RecorderPlugin : RaptorPlugin
    {
        public override string DeveloperName => "RomanPort";
        public override string PluginName => "Recorder";

        private RecorderSettings[] settings;
        private RecorderSessionApi[] sessions;

        private RaptorPrimitiveDataProvider<RecorderSettings[]> dpSettings;

        public RecorderPlugin(IRaptorControl control) : base(control)
        {
            
        }
        
        public override void Init()
        {
            //Create default settings
            settings = new RecorderSettings[]
            {
                new RecorderSettings
                {
                    name = "Audio",
                    rewindBufferSeconds = 60,
                    source = RecorderSource.AUDIO,
                    bitsPerSample = 16,
                    id = "audio"
                },
                new RecorderSettings
                {
                    name = "Baseband",
                    rewindBufferSeconds = 60,
                    source = RecorderSource.BASEBAND,
                    bitsPerSample = 16,
                    id = "baseband"
                }
            };

            //Load actual settings
            settings = ReadPluginSetting("recorders", settings);

            //Create all sessions
            sessions = new RecorderSessionApi[settings.Length];
            for (int i = 0; i < sessions.Length; i++)
                sessions[i] = new RecorderSessionApi(this, settings[i], CreateEndpoint(settings[i].id));

            //Create data provider for the settings so clients can discover what recorders exist
            dpSettings = new RaptorPrimitiveDataProvider<RecorderSettings[]>(this, "RecorderList")
                .SetWebReadOnly(true);
            dpSettings.Value = settings;
        }
    }
}