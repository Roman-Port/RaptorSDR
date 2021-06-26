using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.ViewSpectrum
{
    enum SpectrumStreamOpcode : byte
    {
        OP_INVALID = 0,
        OP_FRAME_ZOOM = 1,
        OP_FRAME_FULL = 2
    }
}
