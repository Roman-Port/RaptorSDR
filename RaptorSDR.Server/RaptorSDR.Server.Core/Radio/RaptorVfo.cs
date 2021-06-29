using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.DataProviders;
using RaptorSDR.Server.Common.PluginComponents;
using RomanPort.LibSDR.Components;
using RomanPort.LibSDR.Components.Filters.Builders;
using RomanPort.LibSDR.Components.Filters.FIR.ComplexFilter;
using RomanPort.LibSDR.Components.General;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Core.Radio
{
    public unsafe class RaptorVfo : IRaptorVfo
    {
        public RaptorVfo(RaptorControl control)
        {
            this.control = control;

            //Create buffers
            iqBuffer = UnsafeBuffer.Create(control.BufferSize, out iqBufferPtr);
            audioLBuffer = UnsafeBuffer.Create(control.BufferSize, out audioLBufferPtr);
            audioRBuffer = UnsafeBuffer.Create(control.BufferSize, out audioRBufferPtr);

            //Bind to radio
            control.Radio.OnConfigured += (IRaptorRadio radio) =>
            {
                sampleRate = radio.SampleRate;
                configStale = true;
            };
            control.Radio.OnSamples += (Complex* ptr, int count) => Process(ptr, count);

            //Create data providers
            dpStereoDetected = new RaptorPrimitiveDataProvider<bool>(this, "StereoDetected")
                .SetWebReadOnly(true);
            dpRdsDetected = new RaptorPrimitiveDataProvider<bool>(this, "RdsDetected")
                .SetWebReadOnly(true);
            dpFreqOffset = new RaptorPrimitiveDataProvider<long>(this, "FreqOffset")
                .SetRequiredScope(Common.Auth.RaptorScope.CONTROL_BASIC)
                .BindOnChanging((long v, IRaptorSession session) => osc.Frequency = v);
            dpBandwidth = new RaptorPrimitiveDataProvider<float>(this, "Bandwidth")
                .SetRequiredScope(Common.Auth.RaptorScope.CONTROL_BASIC)
                .BindOnChanging((float v, IRaptorSession session) => configStale = true);
            dpDemodulator = new RaptorSelectionDataProvider<IPluginDemodulator>(this, "Demodulator", control.PluginDemodulators)
                .SetRequiredScope(Common.Auth.RaptorScope.CONTROL_BASIC)
                .BindOnChanging((IPluginDemodulator v, IRaptorSession session) => configStale = true);

            //Create RDS
            rds = new RaptorRds(this, "RDS");
        }

        private RaptorControl control;
        private RaptorRds rds;

        public RaptorNamespace Id => control.Id.Then("VFO");
        public IRaptorControl Control => control;

        public bool StereoDetected { get => dpStereoDetected.Value; set => dpStereoDetected.Value = value; }
        public bool RdsDetected { get => dpRdsDetected.Value; set => dpRdsDetected.Value = value; }
        public long FreqOffset { get => dpFreqOffset.Value; set => dpFreqOffset.Value = value; }
        public float Bandwidth { get => dpBandwidth.Value; set => dpBandwidth.Value = value; }
        public IPluginDemodulator Demodulator { get => dpDemodulator.Value; set => dpDemodulator.Value = value; }

        public float AudioSampleRate => sampleRate;

        public event IRaptorVfo_AudioReconfiguredEventArgs OnAudioReconfigured;
        public event IRaptorVfo_AudioEmittedEventArgs OnAudioEmitted;

        private RaptorPrimitiveDataProvider<bool> dpStereoDetected;
        private RaptorPrimitiveDataProvider<bool> dpRdsDetected;
        private RaptorPrimitiveDataProvider<long> dpFreqOffset;
        private RaptorPrimitiveDataProvider<float> dpBandwidth;
        private RaptorPrimitiveDataProvider<IPluginDemodulator> dpDemodulator;

        //Thread safe. For next configuration
        private bool configStale;
        private float sampleRate;

        //Buffers
        private UnsafeBuffer iqBuffer;
        private UnsafeBuffer audioLBuffer;
        private UnsafeBuffer audioRBuffer;

        //Buffer pointers
        private Complex* iqBufferPtr;
        private float* audioLBufferPtr;
        private float* audioRBufferPtr;

        //Only to be accessed by worker thread
        private bool configBad;
        private OscillatorAccurate osc = new OscillatorAccurate();
        private IComplexFirFilter filter;
        private IPluginDemodulator demodulator;

        private void Configure()
        {
            //Reset
            configBad = false;
            
            //Set up
            try
            {
                //Unbind from current demodulator
                if(demodulator != null)
                {
                    demodulator.OnWebStereoDetected -= Demodulator_OnWebStereoDetected;
                    demodulator.OnWebRdsDetected -= Demodulator_OnWebRdsDetected;
                    demodulator.OnWebRdsFrame -= Demodulator_OnWebRdsFrame;
                }
                
                //Configure oscilator
                osc.SampleRate = sampleRate;

                //Create decimation filter
                float bandwidth = dpBandwidth.Value;
                var filterParams = new LowPassFilterBuilder(sampleRate, (int)(bandwidth / 2))
                    .SetAutomaticTapCount(0.15f * bandwidth, 60)
                    .SetWindow();
                filter = ComplexFirFilter.CreateFirFilter(filterParams, filterParams.GetDecimation(out float decimatedSampleRate));

                //Configure the demodulator
                demodulator = dpDemodulator.Value;
                float audioSampleRate = demodulator.Configure(control.BufferSize, decimatedSampleRate, 48000);

                //Bind to demodulator
                demodulator.OnWebStereoDetected += Demodulator_OnWebStereoDetected;
                demodulator.OnWebRdsDetected += Demodulator_OnWebRdsDetected;
                demodulator.OnWebRdsFrame += Demodulator_OnWebRdsFrame;

                //Send events
                OnAudioReconfigured?.Invoke(this, audioSampleRate);
            } catch (Exception ex)
            {
                Control.Log(RaptorLogLevel.WARN, "RaptorVFO", "The settings for the VFO are incorrect. This will result in silence until they're fixed! Error: " + ex.Message);
                configBad = true;
            }

            //Reset flag
            configStale = false;
        }

        public void Process(Complex* inputSamples, int count)
        {
            //Check if reconfiguration is neeeded
            if (configStale)
                Configure();

            //If the VFO is bad, skip
            if (configBad)
                return;
            
            //Mix and transfer from input to our own buffer
            osc.Mix(inputSamples, iqBufferPtr, count);

            //Filter and decimate
            count = filter.Process(iqBufferPtr, count);

            //Demodulate
            count = demodulator.DemodulateStereo(iqBufferPtr, audioLBufferPtr, audioRBufferPtr, count);

            //Dispatch audio
            OnAudioEmitted?.Invoke(this, audioLBufferPtr, audioRBufferPtr, count);
        }

        private void Demodulator_OnWebRdsFrame(IPluginDemodulator demodulator, ulong frame)
        {
            rds.SendRdsFrame(frame);
        }

        private void Demodulator_OnWebRdsDetected(IPluginDemodulator demodulator, bool data)
        {
            RdsDetected = data;
        }

        private void Demodulator_OnWebStereoDetected(IPluginDemodulator demodulator, bool data)
        {
            StereoDetected = data;
        }
    }
}
