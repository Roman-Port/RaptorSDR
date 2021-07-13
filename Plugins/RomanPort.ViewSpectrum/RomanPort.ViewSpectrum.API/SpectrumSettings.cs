using RaptorSDR.Server.Common;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum.API
{
    public class SpectrumSettings
    {
        public string name = "Unnamed Spectrum";
        public int fftSize = 2048;
        public int framesPerSec = 30;
        public float defaultOffset = 0;
        public float defaultRange = 100;
        public float defaultAttack = 0.4f;
        public float defaultDecay = 0.7f;
        public int defaultSpeed = 30;
        public float? fixedIncrement = null;
        public string freqDataProvider = null;
    }
}
