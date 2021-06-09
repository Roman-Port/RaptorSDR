using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.WebStream;
using RaptorSDR.Server.Core.Web.HTTP;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace RaptorSDR.Server.Core.Web.WebStream.Clients
{
    public class RaptorWebStreamClientHttp : RaptorWebStreamClient
    {
        public RaptorWebStreamClientHttp(RaptorControl control, RaptorHttpContext context, IRaptorSession session) : base(control, context, session)
        {
        }

        public override bool IsWebSocket => false;

        public override event IRaptorWebStreamClient_MessageEventArgs OnMessage;

        public override void InitConnection()
        {
            context.SendHeaders();
        }

        public override void EnterConnectionLoop()
        {
            while (true)
            {
                //Wait for us to get incoming data
                Task<byte[]> waitTask = channel.Reader.ReadAsync().AsTask();
                Task.WaitAny(waitTask);
                byte[] buffer = waitTask.Result;

                //Send
                context.OutputStream.Write(buffer, 0, buffer.Length);
            }
        }
    }
}
