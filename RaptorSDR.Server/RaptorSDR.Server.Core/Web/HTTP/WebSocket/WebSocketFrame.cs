using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Core.Web.HTTP.WebSocket
{
    public struct WebSocketFrame
    {
        public ushort opcode;
        public byte[] payload;
        public int payloadLen;

        //https://tools.ietf.org/html/rfc6455#section-5
        public const int OPCODE_TEXT = 1;
        public const int OPCODE_BINARY = 2;
        public const int OPCODE_CLOSE = 8;
        public const int OPCODE_PING = 9;
        public const int OPCODE_PONG = 10;
    }
}
