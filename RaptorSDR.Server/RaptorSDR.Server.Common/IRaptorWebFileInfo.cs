using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public interface IRaptorWebFileInfo
    {
        FileInfo Info { get; }
        string AbsoluteFilename { get; }
        bool Exists { get; }
        bool IsManaged { get; }
        bool CanRead { get; }
        bool CanWrite { get; }

        void EnsureCanRead();
        void EnsureCanWrite();

        FileStream OpenRead();
        FileStream OpenWrite();
    }
}
