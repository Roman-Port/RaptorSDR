using Newtonsoft.Json;
using Newtonsoft.Json.Bson;
using Newtonsoft.Json.Linq;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Core.Serialization;
using RaptorSDR.Server.Core.Web.HTTP;
using RaptorSDR.Server.Core.Web.HTTP.WebSocket;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace RaptorSDR.Server.Core.Web
{
    public class RaptorWebSocketEndpointServer : IRaptorEndpoint
    {
        public RaptorWebSocketEndpointServer(IRaptorContext ctx, RaptorHttpServer server, string endpoint)
        {
            this.ctx = ctx;
            server.BindToEndpoint(endpoint, OnHttpRequest);
        }

        public event IRaptorEndpoint_ClientStatusChanged OnClientLost;
        public event IRaptorEndpoint_ClientStatusChanged OnClientConnected;
        public event IRaptorEndpoint_MessageEventArgs OnMessage;

        private List<EndpointClient> clients = new List<EndpointClient>();
        private IRaptorContext ctx;

        private void OnHttpRequest(RaptorHttpContext ctx)
        {
            //First, authenticate the client
            if (!ctx.AuthenticateSession(this.ctx.Control, out IRaptorSession session))
                return;

            //Now, get the encoding type
            if(!ctx.TryGetQueryParameter("encoding", out string encodingString) || !Enum.TryParse(encodingString, out EndpointClientEncoding encoding))
            {
                ctx.StatusCode = System.Net.HttpStatusCode.BadRequest;
                ctx.WriteText("Encoding was not specified or was invalid. Must be JSON, BSON.");
                return;
            }

            //Open as WebSocket
            var sock = ctx.AsWebSocket();

            //Wrap as client
            var client = new EndpointClient(this, sock, session, encoding);

            //Log
            ctx.Log(RaptorLogLevel.DEBUG, "RaptorWebSocketEndpointServer", $"Client {session.Id} connected to RPC.");
            OnClientConnected?.Invoke(client, session);

            //Add to clients
            lock (clients)
                clients.Add(client);

            //Enter loop
            try
            {
                client.RunLoop();
            }
            catch (Exception ex)
            {
                ctx.Log(RaptorLogLevel.LOG, "RaptorWebSocketEndpointServer", $"Client {session.Id} disconnected ungracefully: {ex.Message} {ex.StackTrace}");
            }

            //Log
            OnClientLost?.Invoke(client, session);
            ctx.Log(RaptorLogLevel.DEBUG, "RaptorWebSocketEndpointServer", $"Client {session.Id} disconnected from RPC.");

            //Remove from clients
            lock (clients)
                clients.Remove(client);
        }

        public void SendAll(JObject payload)
        {
            //Broadcast to all
            lock (clients)
            {
                foreach (var c in clients)
                    c.SendMessage(payload);
            }
        }

        public void SendTo(IRaptorEndpointClient client, JObject payload)
        {
            //Send
            ((EndpointClient)client).SendMessage(payload);
        }

        private void OnClientSentMessage(IRaptorEndpointClient client, JObject message)
        {
            OnMessage?.Invoke(client, message);
        }

        enum EndpointClientEncoding
        {
            JSON,
            BSON
        }

        class EndpointClient : IRaptorEndpointClient
        {
            public EndpointClient(RaptorWebSocketEndpointServer server, RaptorWebSocket client, IRaptorSession session, EndpointClientEncoding encoding)
            {
                this.server = server;
                this.client = client;
                this.session = session;
                this.encoding = encoding;
            }

            private RaptorWebSocketEndpointServer server;
            private RaptorWebSocket client;
            private IRaptorSession session;
            private EndpointClientEncoding encoding;

            public IRaptorSession Session => session;

            public void SendMessage(JObject message)
            {
                //Determine how to send the message from the encoding
                ushort wsOpcode = PrepareMessageOutgoing(message, out byte[] payload);

                //Send on wire
                client.SendFrame(new WebSocketFrame
                {
                    opcode = wsOpcode,
                    payload = payload,
                    payloadLen = payload.Length
                });
            }

            public void RunLoop()
            {
                //Loop
                WebSocketFrame frame;
                do
                {
                    //Read
                    frame = client.ReadFrame();

                    //If this message isn't binary or text, ignore it
                    if (frame.opcode != WebSocketFrame.OPCODE_BINARY && frame.opcode != WebSocketFrame.OPCODE_TEXT)
                        continue;

                    //Decode based on the encoding settings
                    JObject group = PrepareMessageIncoming(frame.payload, frame.payloadLen);

                    //Dispatch
                    server.OnClientSentMessage(this, group);
                } while (frame.opcode != WebSocketFrame.OPCODE_CLOSE);

                //Client sent graceful close. Sending back our own...
                client.SendFrame(frame);
            }

            private JObject PrepareMessageIncoming(byte[] payload, int length)
            {
                switch(encoding)
                {
                    case EndpointClientEncoding.BSON:
                        JObject group;
                        using (MemoryStream ms = new MemoryStream(payload, 0, length))
                        using (BsonDataReader reader = new BsonDataReader(ms))
                        {
                            JsonSerializer serializer = new JsonSerializer();
                            group = serializer.Deserialize<JObject>(reader);
                        }
                        return group;
                    case EndpointClientEncoding.JSON:
                        return JsonConvert.DeserializeObject<JObject>(Encoding.UTF8.GetString(payload, 0, length));
                    default:
                        throw new Exception("Unknown encoding type.");
                }
            }

            private ushort PrepareMessageOutgoing(JObject message, out byte[] payload)
            {
                switch (encoding)
                {
                    case EndpointClientEncoding.BSON:
                        using (MemoryStream ms = new MemoryStream())
                        using (BsonDataWriter reader = new BsonDataWriter(ms))
                        {
                            JsonSerializer serializer = new JsonSerializer();
                            serializer.Serialize(reader, message);
                            payload = ms.ToArray();
                        }
                        return WebSocketFrame.OPCODE_BINARY;
                    case EndpointClientEncoding.JSON:
                        payload = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(message));
                        return WebSocketFrame.OPCODE_TEXT;
                    default:
                        throw new Exception("Unknown encoding type.");
                }
            }
        }
    }
}
