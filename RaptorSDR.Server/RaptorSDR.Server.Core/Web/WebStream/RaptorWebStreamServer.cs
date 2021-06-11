using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.WebStream;
using RaptorSDR.Server.Core.Web.Auth;
using RaptorSDR.Server.Core.Web.HTTP;
using RaptorSDR.Server.Core.Web.HTTP.WebSocket;
using RaptorSDR.Server.Core.Web.WebStream.Clients;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Core.Web.WebStream
{
    public class RaptorWebStreamServer<WebStream> : IRaptorWebStreamServer<WebStream> where WebStream: RaptorWebStream
    {
        public RaptorWebStreamServer(RaptorControl control, string endpoint)
        {
            this.control = control;
            control.Http.BindToEndpoint(endpoint, OnHttpRequest);
        }

        private RaptorControl control;
        private List<WebStream> streams = new List<WebStream>();

        public event RaptorWebStreamServerClientConnectedEventArgs<WebStream> OnClientConnected;

        public bool HasClients => streams.Count > 0;

        private void OnHttpRequest(RaptorHttpContext ctx)
        {
            //First, authenticate the client
            if (!ctx.AuthenticateSession(control, out IRaptorSession session))
                return;

            //Wrap in a client
            RaptorWebStreamClient clientCtx;
            if (RaptorWebSocket.IsWebSocket(ctx))
                clientCtx = new RaptorWebStreamClientWebsocket(control, ctx, session);
            else
                clientCtx = new RaptorWebStreamClientHttp(control, ctx, session);

            //Create a new stream
            WebStream clientStream = CreateStream(clientCtx);
            clientCtx.OnMessage += clientStream.HandleMessage;

            //Check if we're allowed to open the connection
            if(!clientStream.HandleRequest())
            {
                ctx.StatusCode = System.Net.HttpStatusCode.BadRequest;
                return;
            }

            //Send event to allow initialization
            OnClientConnected?.Invoke(clientStream);

            //Initialize connection
            clientCtx.InitConnection();

            //Send ready command
            clientStream.HandleOpen();

            //Register
            lock (streams)
                streams.Add(clientStream);

            //Enter loop
            try
            {
                clientCtx.EnterConnectionLoop();
            } catch (Exception ex)
            {
                control.Log(RaptorLogLevel.DEBUG, "RaptorWebStreamServer", $"Stream exited with error: {ex.Message}{ex.StackTrace}");
            }

            //Unregister
            lock (streams)
                streams.Remove(clientStream);

            //Close
            clientStream.HandleClose();
        }

        public void ForEachClient(ForEachClientEnumerate<WebStream> enumerate)
        {
            //Clone the list to allow enumeration
            List<WebStream> localStreams = new List<WebStream>();
            lock (streams)
                localStreams.AddRange(streams);

            //Loop
            foreach (var s in localStreams)
            {
                try
                {
                    enumerate(s);
                }
                catch { }
            }
        }

        public virtual WebStream CreateStream(IRaptorWebStreamClient client)
        {
            return (WebStream)Activator.CreateInstance(typeof(WebStream), client);
        }
    }
}
