using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.Recorder.Config
{
    public class RecorderSettings
    {
        [JsonProperty("name")]
        public string name;

        [JsonProperty("source", ItemConverterType = typeof(StringEnumConverter))]
        public RecorderSource source;

        [JsonProperty("rewind_buffer_seconds")]
        public int rewindBufferSeconds;

        [JsonProperty("bits_per_sample")]
        public int bitsPerSample;
        
        [JsonProperty("id")]
        public string id;
    }
}
