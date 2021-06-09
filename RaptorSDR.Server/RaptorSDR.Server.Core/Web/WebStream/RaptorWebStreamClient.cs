using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.WebStream;
using RaptorSDR.Server.Core.Web.HTTP;
using RaptorSDR.Server.Core.Web.HTTP.WebSocket;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace RaptorSDR.Server.Core.Web.WebStream
{
    public abstract class RaptorWebStreamClient : IRaptorWebStreamClient
    {
        public RaptorWebStreamClient(RaptorControl control, RaptorHttpContext context, IRaptorSession session)
        {
            this.control = control;
            this.context = context;
            this.session = session;
            channel = Channel.CreateUnbounded<byte[]>();
        }

        protected RaptorControl control;
        protected RaptorHttpContext context;
        protected IRaptorSession session;
        protected Channel<byte[]> channel;

        public abstract bool IsWebSocket { get; }

        public abstract event IRaptorWebStreamClient_MessageEventArgs OnMessage;

        public IRaptorSession Session => session;
        public IReadOnlyDictionary<string, string> HttpQuery => context.Query;
        public IRaptorControl Control => control;

        public abstract void InitConnection();

        public abstract void EnterConnectionLoop();

        public void SendMessage(byte[] payload, int len)
        {
            //Copy buffer
            byte[] buffer = new byte[len];
            Array.Copy(payload, 0, buffer, 0, len);

            //Queue
            channel.Writer.WriteAsync(buffer);
        }
    }
}
