using RaptorSDR.Server.Common;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace RaptorSDR.Server.Core.Web.HTTP.WebSocket
{
    public class RaptorWebSocket
    {
        public RaptorWebSocket(RaptorHttpContext ctx)
        {
            //Log
            ctx.Log(RaptorLogLevel.DEBUG, "HTTP-WEBSOCK", $"Opening as WebSocket request...");

            //Prepare
            this.ctx = ctx;
            incomingHeaderBuffer = new byte[16];
            outgoingHeaderBuffer = new byte[16];

            //Search for the upgrade header
            if (!ctx.RequestHeaders.ContainsKey("upgrade") || ctx.RequestHeaders["upgrade"].ToLower() != "websocket")
            {
                ctx.Log(RaptorLogLevel.LOG, "HTTP-WEBSOCK", "Failed to open as websocket: required headers \"upgrade\" is missing or not equal to \"websocket\".");
                throw new Exception("WebSocket Error");
            }

            //Create the WebSocket accept header
            string accept = ctx.RequestHeaders["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
            using (SHA1 sha = SHA1.Create())
                accept = Convert.ToBase64String(sha.ComputeHash(Encoding.ASCII.GetBytes(accept)));

            //Set server headers
            ctx.StatusCode = System.Net.HttpStatusCode.SwitchingProtocols;
            ctx.ResponseHeaders.Add("Connection", "Upgrade");
            ctx.ResponseHeaders.Add("Sec-WebSocket-Accept", accept);
            ctx.ResponseHeaders.Add("Upgrade", "websocket");
            ctx.SendHeaders();

            //Log
            ctx.Log(RaptorLogLevel.DEBUG, "HTTP-WEBSOCK", "WebSocket handshake completed successfully.");
        }

        private RaptorHttpContext ctx;
        private byte[] incomingHeaderBuffer;
        private byte[] outgoingHeaderBuffer;

        public WebSocketFrame ReadFrame()
        {
            ctx.InputStream.Read(incomingHeaderBuffer, 0, 2);
            return DecodeFrame();
        }

        public async Task<WebSocketFrame> ReadFrameAsync()
        {
            await ctx.InputStream.ReadAsync(incomingHeaderBuffer, 0, 2);
            return DecodeFrame();
        }

        private WebSocketFrame DecodeFrame()
        {
            bool fin = ReadBitBool(incomingHeaderBuffer, 0);
            ulong opcode = ReadBitInt(incomingHeaderBuffer, 4, 4);
            bool mask = ReadBitBool(incomingHeaderBuffer, 8);
            ulong payloadLen = ReadBitInt(incomingHeaderBuffer, 9, 7);

            //Read extended payload length
            if (payloadLen == 126)
            {
                //Interpet the next two bytes as the length
                ctx.InputStream.Read(incomingHeaderBuffer, 0, 2);
                payloadLen = ReadBitInt(incomingHeaderBuffer, 0, 16);
            }
            else if (payloadLen == 127)
            {
                //Interpet the next eight bytes as the length
                ctx.InputStream.Read(incomingHeaderBuffer, 0, 8);
                payloadLen = ReadBitInt(incomingHeaderBuffer, 0, 64);
            }

            //Read masking key
            if (mask)
                ctx.InputStream.Read(incomingHeaderBuffer, 0, 4);

            //Limit payload length
            if (payloadLen > 128 * 1000 * 1000)
                throw new Exception("Payload length too long!");

            //Read the payload
            byte[] payload = new byte[payloadLen];
            if (payloadLen != 0)
                ctx.InputStream.Read(payload, 0, (int)payloadLen);

            //Unmask masked frame if needed
            if (mask)
                ApplyMask(payload, incomingHeaderBuffer);

            return new WebSocketFrame
            {
                opcode = (ushort)opcode,
                payload = payload,
                payloadLen = payload.Length
            };
        }

        public void SendFrame(WebSocketFrame frame)
        {
            //Determine size
            int len = frame.payloadLen;
            bool isExtendedLen = len >= 126;
            bool isContinuedExtendedLen = len > ushort.MaxValue;

            //Create and write header
            WriteBitBool(outgoingHeaderBuffer, 0, true);
            WriteBitBool(outgoingHeaderBuffer, 1, false);
            WriteBitBool(outgoingHeaderBuffer, 2, false);
            WriteBitBool(outgoingHeaderBuffer, 3, false);
            WriteBitInt(outgoingHeaderBuffer, 4, 4, frame.opcode);
            WriteBitBool(outgoingHeaderBuffer, 8, false);
            WriteBitInt(outgoingHeaderBuffer, 9, 7, (ulong)len);
            if (isExtendedLen)
                WriteBitInt(outgoingHeaderBuffer, 9, 7, 126);
            if (isContinuedExtendedLen)
                WriteBitInt(outgoingHeaderBuffer, 9, 7, 127);
            ctx.OutputStream.Write(outgoingHeaderBuffer, 0, 2);

            //Send extended lengths if needed
            if (isContinuedExtendedLen)
            {
                WriteBitInt(outgoingHeaderBuffer, 0, 64, (ulong)len);
                ctx.OutputStream.Write(outgoingHeaderBuffer, 0, 8);
            }
            else if (isExtendedLen)
            {
                WriteBitInt(outgoingHeaderBuffer, 0, 16, (ulong)len);
                ctx.OutputStream.Write(outgoingHeaderBuffer, 0, 2);
            }

            //Write the payload
            ctx.OutputStream.Write(frame.payload, 0, len);
        }

        /* Reading utils */

        private static int ReadBit(byte[] header, int bit)
        {
            return (header[bit / 8] >> (7 - (bit % 8))) & 1;
        }

        private static bool ReadBitBool(byte[] header, int offset)
        {
            return ReadBit(header, offset) == 1;
        }

        private static ulong ReadBitInt(byte[] header, int offset, int len)
        {
            ulong num = 0;
            for (var i = 0; i < len; i++)
            {
                ulong v = (ulong)ReadBit(header, offset + i);
                num |= (v << (len - 1 - i));
            }
            return num;
        }

        /* Writing utils */

        public static void WriteBit(byte[] header, int offset, int bit)
        {
            int bitOffs = 7 - (offset % 8);
            header[offset / 8] ^= (byte)((-bit ^ header[offset / 8]) & (1 << bitOffs));

            //sanity
            if (ReadBit(header, offset) != bit)
                throw new Exception("sanity check failed");
        }

        public static void WriteBitBool(byte[] header, int offset, bool value)
        {
            WriteBit(header, offset, value ? (byte)1 : (byte)0);
        }

        public static void WriteBitInt(byte[] header, int offset, int len, ulong value)
        {
            for (var i = 0; i < len; i++)
            {
                ulong v = (value >> (len - 1 - i)) & 1;
                WriteBit(header, offset + i, (int)v);
            }
        }

        /* Misc utils */

        private static void ApplyMask(byte[] data, byte[] mask_key)
        {
            for (int i = 0; i < data.Length; i++)
                data[i] ^= mask_key[i % 4];
        }
    }
}
