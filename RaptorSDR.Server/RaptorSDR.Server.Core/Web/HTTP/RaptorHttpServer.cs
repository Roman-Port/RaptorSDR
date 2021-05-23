using RaptorSDR.Server.Common;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace RaptorSDR.Server.Core.Web.HTTP
{
    public delegate void IRaptorHttpServer_BoundEvent(RaptorHttpContext ctx);

    public class RaptorHttpServer
    {
        public RaptorHttpServer(IRaptorLogger logger, IPEndPoint ep)
        {
            this.logger = logger;
            server = new Socket(SocketType.Stream, ProtocolType.Tcp);
            server.Bind(ep);
            server.Listen(8);
        }

        public void Start()
        {
            server.BeginAccept(OnAcceptSocket, null);
        }

        private IRaptorLogger logger;
        private Socket server;
        private Dictionary<string, IRaptorHttpServer_BoundEvent> endpoints = new Dictionary<string, IRaptorHttpServer_BoundEvent>();

        public void BindToEndpoint(string endpoint, IRaptorHttpServer_BoundEvent callback)
        {
            endpoints.Add(endpoint, callback);
        }

        private void OnAcceptSocket(IAsyncResult ar)
        {
            //Get
            Socket sock = server.EndAccept(ar);

            //Spawn a new thread for this
            Thread t = new Thread(HttpWorkerThread);
            t.IsBackground = true;
            t.Name = "HTTP Worker Thread";
            t.Start(sock);

            //Listen
            server.BeginAccept(OnAcceptSocket, null);
        }

        private void HttpWorkerThread(object ctx)
        {
            try
            {
                //Get the socket
                Socket sock = (Socket)ctx;

                //Create a new context
                RaptorHttpContext context = new RaptorHttpContext(logger, sock);

                //Log
                logger.Log(RaptorLogLevel.DEBUG, "RaptorHttpServer", $"{context.Method} request opened to {context.Url.AbsolutePath}");

                //Handle
                OnHttpRequest(context);

                //Close
                context.FinalizeHttp();
                sock.Close();

                //Log
                logger.Log(RaptorLogLevel.DEBUG, "RaptorHttpServer", $"HTTP request handled successfully with code {(int)context.StatusCode}. Socket closed.");
            }
            catch (Exception ex)
            {
                logger.Log(RaptorLogLevel.ERROR, "RaptorHttpServer", $"Encountered unhandled error while processing non-user request: {ex.Message} {ex.StackTrace}");
            }
        }

        private void OnHttpRequest(RaptorHttpContext ctx)
        {
            //Get path
            string path = ctx.Url.AbsolutePath;

            //Search for endpoint
            if (!endpoints.ContainsKey(path))
            {
                ctx.StatusCode = HttpStatusCode.NotFound;
                return;
            }

            //Run
            try
            {
                endpoints[path](ctx);
            }
            catch (Exception ex)
            {
                try
                {
                    ctx.StatusCode = HttpStatusCode.InternalServerError;
                    logger.Log(RaptorLogLevel.WARN, "RaptorHttpServer", $"Encountered user error: {ex.Message}{ex.StackTrace}");
                }
                catch
                {
                    logger.Log(RaptorLogLevel.WARN, "RaptorHttpServer", "Server error after body had been sent: " + ex.Message + ex.StackTrace);
                }
            }
        }
    }
}
