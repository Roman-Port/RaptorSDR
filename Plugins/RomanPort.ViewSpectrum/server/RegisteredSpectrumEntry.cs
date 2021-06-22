using Newtonsoft.Json;
using RaptorSDR.Server.Common;
using RomanPort.ViewSpectrum.API;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum
{
    public class RegisteredSpectrumEntry
    {
        public RegisteredSpectrumEntry(IRegisteredSpectrum spectrum)
        {
            this.spectrum = spectrum;
        }

        private IRegisteredSpectrum spectrum;

        [JsonProperty("name")]
        public string DisplayName { get => spectrum.Settings.name; }

        [JsonProperty("id")]
        public string Id { get => spectrum.Id.ToString(); }

        [JsonProperty("defaultOffset")]
        public float DefaultOffset { get => spectrum.Settings.defaultOffset; }

        [JsonProperty("defaultRange")]
        public float DefaultRange { get => spectrum.Settings.defaultRange; }

        [JsonProperty("defaultAttack")]
        public float DefaultAttack { get => spectrum.Settings.defaultAttack; }

        [JsonProperty("defaultDecay")]
        public float DefaultDecay { get => spectrum.Settings.defaultDecay; }

        [JsonProperty("fixedIncrement")]
        public float? FixedIncrement { get => spectrum.Settings.fixedIncrement; }

        [JsonProperty("freqDataProvider")]
        public string FreqDataProvider { get => spectrum.Settings.freqDataProvider; }

        [JsonProperty("useCenterFreq")]
        public bool UseCenterFreq { get => !spectrum.IsHalf; }
    }
}
