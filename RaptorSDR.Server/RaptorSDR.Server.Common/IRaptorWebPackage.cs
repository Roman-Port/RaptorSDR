using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public interface IRaptorWebPackage
    {
        string Sha256 { get; }
        byte[] Binary { get; }
    }
}
