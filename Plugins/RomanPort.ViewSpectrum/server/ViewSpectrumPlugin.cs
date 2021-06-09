using System;
using System.Collections.Generic;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.DataProviders;
using RomanPort.ViewSpectrum.API;

namespace RomanPort.ViewSpectrum
{
    public unsafe class ViewSpectrumPlugin : RaptorPlugin
    {
        public override string DeveloperName => "RomanPort";
        public override string PluginName => "ViewSpectrum";

        private List<RegisteredSpectrumEntry> spectrums = new List<RegisteredSpectrumEntry>();
        private RaptorPrimitiveDataProvider<List<RegisteredSpectrumEntry>> dpSpectrums;
        private IRegisteredSpectrum mainSpectrum;
        
        public ViewSpectrumPlugin(IRaptorControl control) : base(control)
        {
            //Create data provider
            dpSpectrums = new RaptorPrimitiveDataProvider<List<RegisteredSpectrumEntry>>(this, "Spectrums")
                .SetWebReadOnly(true);
            dpSpectrums.Value = spectrums;
            
            //Register built-in main FFT
            mainSpectrum = RegisterSpectrum(Id.Then("MainFFT"), new SpectrumSettings
            {
                name = "Main FFT",
                fftSize = 32768
            });
            control.Radio.OnConfigured += (IRaptorRadio radio) => mainSpectrum.SampleRate = (int)radio.SampleRate;
            control.Radio.OnSamples += mainSpectrum.AddSamples;
        }
        
        public IRegisteredSpectrum RegisterSpectrum(RaptorNamespace id, SpectrumSettings settings)
        {
            var spectrum = new RegisteredSpectrum(Control, id, settings);
            spectrums.Add(new RegisteredSpectrumEntry(spectrum));
            return spectrum;
        }

        public override void Init()
        {
            
        }
    }
}