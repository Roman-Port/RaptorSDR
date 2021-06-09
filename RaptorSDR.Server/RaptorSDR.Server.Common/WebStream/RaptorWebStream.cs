using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.WebStream
{
    public abstract class RaptorWebStream
    {
        public RaptorWebStream(IRaptorWebStreamClient ctx)
        {
            this.ctx = ctx;
        }

        private IRaptorWebStreamClient ctx;

        public bool IsWebSocket { get => ctx.IsWebSocket; }
        public IRaptorSession Session { get => ctx.Session; }
        public IReadOnlyDictionary<string, string> HttpQuery { get => ctx.HttpQuery; }
        public IRaptorControl Control { get => ctx.Control; }

        /// <summary>
        /// Return if this client is allowed to connect or not. You will be unable to send messages during this stage.
        /// </summary>
        /// <returns></returns>
        public abstract bool HandleRequest();

        /// <summary>
        /// Handle opening. At this point, you can send messages freely.
        /// </summary>
        public abstract void HandleOpen();

        /// <summary>
        /// Handle incoming data from the client.
        /// </summary>
        /// <param name="data"></param>
        /// <param name="count"></param>
        public abstract void HandleMessage(byte[] data, int count);

        /// <summary>
        /// Handle the client closing the connection.
        /// </summary>
        public abstract void HandleClose();

        public void SendMessage(byte[] data, int count)
        {
            ctx.SendMessage(data, count);
        }
    }
}
