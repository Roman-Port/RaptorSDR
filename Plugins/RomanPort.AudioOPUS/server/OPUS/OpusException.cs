using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.AudioOPUS.OPUS
{
    public class OpusException : Exception
    {
        private OpusError error;
        
        public OpusError OpusError { get => error; }

        public OpusException(OpusError error) : base("OPUS error: " + error.ToString())
        {
            this.error = error;
        }
    }
}
