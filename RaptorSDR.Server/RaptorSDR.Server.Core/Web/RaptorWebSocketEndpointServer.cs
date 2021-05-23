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

        private static byte[] SerializeToArray(JObject group)
        {
            byte[] payload;
            using (MemoryStream ms = new MemoryStream())
            using (BsonDataWriter reader = new BsonDataWriter(ms))
            {
                JsonSerializer serializer = new JsonSerializer();
                serializer.Serialize(reader, group);
                payload = ms.ToArray();
            }
            return payload;
        }

        private void OnHttpRequest(RaptorHttpContext ctx)
        {
            //First, authenticate the client
            if (!ctx.AuthenticateSession(this.ctx.Control, out IRaptorSession session))
                return;

            //Open as WebSocket
            var sock = ctx.AsWebSocket();

            //Wrap as client
            var client = new EndpointClient(this, sock, session);

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
            catch
            {
                ctx.Log(RaptorLogLevel.LOG, "RaptorWebSocketEndpointServer", $"Client {session.Id} disconnected ungracefully!");
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
            //Serialize
            byte[] serialized = SerializeToArray(payload);

            //Broadcast to all
            lock (clients)
            {
                foreach (var c in clients)
                    c.SendBinary(serialized);
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

        class EndpointClient : IRaptorEndpointClient
        {
            public EndpointClient(RaptorWebSocketEndpointServer server, RaptorWebSocket client, IRaptorSession session)
            {
                this.server = server;
                this.client = client;
                this.session = session;
            }

            private RaptorWebSocketEndpointServer server;
            private RaptorWebSocket client;
            private IRaptorSession session;

            public IRaptorSession Session => session;

            public void SendMessage(JObject message)
            {
                //Serialize
                byte[] serialized = SerializeToArray(message);

                //Broadcast
                SendBinary(serialized);
            }

            public void SendBinary(byte[] serialized)
            {
                client.SendFrame(new WebSocketFrame
                {
                    opcode = WebSocketFrame.OPCODE_BINARY,
                    payload = serialized,
                    payloadLen = serialized.Length
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

                    //If this is binary, go
                    if(frame.opcode == WebSocketFrame.OPCODE_BINARY)
                    {
                        //Deserialize
                        JObject group;
                        using (MemoryStream ms = new MemoryStream(frame.payload, 0, frame.payloadLen))
                        using (BsonDataReader reader = new BsonDataReader(ms))
                        {
                            JsonSerializer serializer = new JsonSerializer();
                            group = serializer.Deserialize<JObject>(reader);
                        }

                        //Dispatch
                        server.OnClientSentMessage(this, group);
                    }
                } while (frame.opcode != WebSocketFrame.OPCODE_CLOSE);

                //Client sent graceful close. Sending back our own...
                client.SendFrame(frame);
            }
        }
    }
}
