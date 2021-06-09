using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.WebStream;
using RaptorSDR.Server.Core.Web.HTTP;
using RaptorSDR.Server.Core.Web.HTTP.WebSocket;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace RaptorSDR.Server.Core.Web.WebStream.Clients
{
    public class RaptorWebStreamClientWebsocket : RaptorWebStreamClient
    {
        public RaptorWebStreamClientWebsocket(RaptorControl control, RaptorHttpContext context, IRaptorSession session) : base(control, context, session)
        {
            
        }

        protected RaptorWebSocket sock;

        public override event IRaptorWebStreamClient_MessageEventArgs OnMessage;

        public override bool IsWebSocket => true;

        public override void InitConnection()
        {
            sock = context.AsWebSocket();
        }

        public override void EnterConnectionLoop()
        {
            //Get
            Task<byte[]> waitTask = channel.Reader.ReadAsync().AsTask();
            Task<WebSocketFrame> wsTask = sock.ReadFrameAsync();

            //Enter loop
            WebSocketFrame frame;
            while (true)
            {
                //Wait for us to get incoming data
                switch(Task.WaitAny(waitTask, wsTask))
                {
                    case 0: //Got outgoing frame
                        byte[] buffer = waitTask.Result;
                        sock.SendFrame(new WebSocketFrame
                        {
                            opcode = WebSocketFrame.OPCODE_BINARY,
                            payload = buffer,
                            payloadLen = buffer.Length
                        });
                        waitTask = channel.Reader.ReadAsync().AsTask();
                        break;
                    case 1: //Got incoming frame
                        frame = wsTask.Result;
                        if (frame.opcode == WebSocketFrame.OPCODE_TEXT || frame.opcode == WebSocketFrame.OPCODE_BINARY)
                            OnMessage?.Invoke(frame.payload, frame.payloadLen);
                        else if (frame.opcode == WebSocketFrame.OPCODE_CLOSE)
                            return;
                        wsTask = sock.ReadFrameAsync();
                        break;
                    default: throw new Exception("Unknown index reading websocket. Memory corruption?");
                }
            }
        }
    }
}
