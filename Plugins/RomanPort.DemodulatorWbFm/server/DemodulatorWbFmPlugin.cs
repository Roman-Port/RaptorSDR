using System;
using RaptorSDR.Server.Common;
using RomanPort.ViewSpectrum.API;

namespace RomanPort.DemodulatorWbFm
{
    public unsafe partial class DemodulatorWbFmPlugin : RaptorPlugin
    {
        private WebDemodulator demod;
        
        public DemodulatorWbFmPlugin(IRaptorControl control) : base(control)
        {
            demod = new WebDemodulator(this, "WbFm");
            RegisterDemodulator(demod);
        }
        
        public override void Init()
        {
            //Register FFT for MPX
            if (Control.GetPluginInterface<ISpectrumProvider>(out ISpectrumProvider provider))
            {
                //Add the spectrum
                IRegisteredSpectrumReal spectrum = provider.RegisterSpectrumReal(Id.Then("SpectrumMPX"), new SpectrumSettings
                {
                    fftSize = 16384,
                    name = "MPX Spectrum",
                    fixedIncrement = 19000
                });

                //Map it
                demod.OnMpxSampleRateChanged += spectrum.SetSampleRate;
                demod.OnMpxSamplesEmitted += spectrum.AddSamples;
            }
        }
    }
}