using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.WebStream
{
    public delegate void IRaptorWebStreamClient_MessageEventArgs(byte[] data, int count);

    public interface IRaptorWebStreamClient
    {
        bool IsWebSocket { get; }
        IRaptorSession Session { get; }
        IReadOnlyDictionary<string, string> HttpQuery { get; }
        IRaptorControl Control { get; }

        event IRaptorWebStreamClient_MessageEventArgs OnMessage;

        void SendMessage(byte[] data, int count);
    }
}
