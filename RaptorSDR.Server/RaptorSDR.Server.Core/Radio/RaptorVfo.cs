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

            //Create data providers
            dpStereoDetected = new RaptorPrimitiveDataProvider<bool>(this, "StereoDetected")
                .SetWebReadOnly(true);
            dpRdsDetected = new RaptorPrimitiveDataProvider<bool>(this, "RdsDetected")
                .SetWebReadOnly(true);
            dpFreqOffset = new RaptorPrimitiveDataProvider<long>(this, "FreqOffset")
                .BindOnChanged((long v) => osc.Frequency = v);
            dpBandwidth = new RaptorPrimitiveDataProvider<float>(this, "Bandwidth")
                .BindOnChanged((float v) => configStale = true);
            dpDemodulator = new RaptorSelectionDataProvider<IPluginDemodulator>(this, "Demodulator", control.PluginDemodulators)
                .BindOnChanged((IPluginDemodulator v) => configStale = true);
        }

        private RaptorControl control;

        public RaptorNamespace Id => control.Id.Then("VFO");
        public IRaptorControl Control => control;

        public bool StereoDetected { get => dpStereoDetected.Value; set => dpStereoDetected.Value = value; }
        public bool RdsDetected { get => dpRdsDetected.Value; set => dpRdsDetected.Value = value; }
        public long FreqOffset { get => dpFreqOffset.Value; set => dpFreqOffset.Value = value; }
        public float Bandwidth { get => dpBandwidth.Value; set => dpBandwidth.Value = value; }
        public IPluginDemodulator Demodulator { get => dpDemodulator.Value; set => dpDemodulator.Value = value; }

        public event IRaptorVfo_AudioReconfiguredEventArgs OnAudioReconfigured;
        public event IRaptorVfo_AudioEmittedEventArgs OnAudioEmitted;

        private RaptorPrimitiveDataProvider<bool> dpStereoDetected;
        private RaptorPrimitiveDataProvider<bool> dpRdsDetected;
        private RaptorPrimitiveDataProvider<long> dpFreqOffset;
        private RaptorPrimitiveDataProvider<float> dpBandwidth;
        private RaptorPrimitiveDataProvider<IPluginDemodulator> dpDemodulator;

        //Thread safe. For next configuration
        private bool configStale;

        //Buffers
        private UnsafeBuffer iqBuffer;
        private UnsafeBuffer audioLBuffer;
        private UnsafeBuffer audioRBuffer;

        //Buffer pointers
        private Complex* iqBufferPtr;
        private float* audioLBufferPtr;
        private float* audioRBufferPtr;

        //Only to be accessed by worker thread
        private float sampleRate;
        private OscillatorAccurate osc = new OscillatorAccurate();
        private IComplexFirFilter filter;
        private IPluginDemodulator demodulator;

        private void Configure()
        {
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

            //Send events
            OnAudioReconfigured?.Invoke(this, audioSampleRate);

            //Reset flag
            configStale = false;
        }

        public void Process(Complex* inputSamples, int count)
        {
            //Check if reconfiguration is neeeded
            if (configStale)
                Configure();
            
            //Mix and transfer from input to our own buffer
            osc.Mix(inputSamples, iqBufferPtr, count);

            //Filter and decimate
            count = filter.Process(iqBufferPtr, count);

            //Demodulate
            count = demodulator.DemodulateStereo(iqBufferPtr, audioLBufferPtr, audioRBufferPtr, count);

            //Dispatch audio
            OnAudioEmitted?.Invoke(this, audioLBufferPtr, audioRBufferPtr, count);
        }

        public void ReportRdsFrame(ulong frame)
        {
            
        }
    }
}
