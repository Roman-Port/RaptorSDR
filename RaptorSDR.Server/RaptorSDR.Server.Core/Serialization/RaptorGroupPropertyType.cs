using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Core.Serialization
{
    public enum RaptorGroupPropertyType : byte
    {
        INVALID = 0,
        NULL = 1,

        BYTE = 10,
        SHORT = 11,
        INT = 12,
        LONG = 13,
        STRING = 14,
        GROUP = 15,

        ARRAY_BYTE = 20,
        ARRAY_SHORT = 21,
        ARRAY_INT = 22,
        ARRAY_LONG = 23,
        ARRAY_STRING = 24,
        ARRAY_GROUP = 25
    }
}
