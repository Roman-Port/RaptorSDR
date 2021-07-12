using System;
using System.Collections.Generic;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.DataProviders;
using RomanPort.ViewSpectrum.API;
using RomanPort.ViewSpectrum.Spectrums;

namespace RomanPort.ViewSpectrum
{
    public unsafe class ViewSpectrumPlugin : RaptorPlugin, ISpectrumProvider
    {
        public override string DeveloperName => "RomanPort";
        public override string PluginName => "ViewSpectrum";

        private List<RegisteredSpectrumEntry> spectrums = new List<RegisteredSpectrumEntry>();
        private RaptorPrimitiveDataProvider<List<RegisteredSpectrumEntry>> dpSpectrums;
        private IRegisteredSpectrumComplex mainSpectrum;
        
        public ViewSpectrumPlugin(IRaptorControl control) : base(control)
        {
            //Create data provider
            dpSpectrums = new RaptorPrimitiveDataProvider<List<RegisteredSpectrumEntry>>(this, "Spectrums")
                .SetWebReadOnly(true);
            dpSpectrums.Value = spectrums;
            
            //Register built-in main FFT
            mainSpectrum = RegisterSpectrumComplex(Id.Then("MainFFT"), new SpectrumSettings
            {
                name = "Main FFT",
                fftSize = 32768*2,
                defaultOffset = 20,
                defaultRange = 80,
                freqDataProvider = "RaptorSDR.Radio.CenterFreq"
            });
            control.Radio.OnConfigured += (IRaptorRadio radio) => mainSpectrum.SampleRate = (int)radio.SampleRate;
            control.Radio.OnSamples += mainSpectrum.AddSamples;

            //Register ourselves as an interface so other plugins can add their own FFTs
            control.RegisterPluginInterface<ISpectrumProvider>(this);
        }
        
        public IRegisteredSpectrumComplex RegisterSpectrumComplex(RaptorNamespace id, SpectrumSettings settings)
        {
            var spectrum = new ComplexRegisteredSpectrum(Control, id, settings);
            spectrums.Add(new RegisteredSpectrumEntry(spectrum));
            return spectrum;
        }

        public IRegisteredSpectrumReal RegisterSpectrumReal(RaptorNamespace id, SpectrumSettings settings)
        {
            var spectrum = new RealRegisteredSpectrum(Control, id, settings);
            spectrums.Add(new RegisteredSpectrumEntry(spectrum));
            return spectrum;
        }

        public override void Init()
        {
            
        }
    }
}