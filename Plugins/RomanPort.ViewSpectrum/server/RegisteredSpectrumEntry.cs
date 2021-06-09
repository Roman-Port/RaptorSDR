using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum
{
    public class RegisteredSpectrumEntry
    {
        public RegisteredSpectrumEntry(RegisteredSpectrum spectrum)
        {
            this.spectrum = spectrum;
        }

        private RegisteredSpectrum spectrum;

        [JsonProperty("name")]
        public string DisplayName { get => spectrum.Settings.name; }

        [JsonProperty("id")]
        public string Id { get => spectrum.Id.ToString(); }
    }
}
