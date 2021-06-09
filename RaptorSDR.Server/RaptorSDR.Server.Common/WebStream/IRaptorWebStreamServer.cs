using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.WebStream
{
    public delegate void ForEachClientEnumerate<WebStream>(WebStream stream);

    public interface IRaptorWebStreamServer<WebStream>
    {
        bool HasClients { get; }
        void ForEachClient(ForEachClientEnumerate<WebStream> enumerate);
    }
}
