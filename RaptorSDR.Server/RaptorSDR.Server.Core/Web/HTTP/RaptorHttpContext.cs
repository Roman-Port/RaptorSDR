using Newtonsoft.Json;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Core.Web.HTTP.WebSocket;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Web;

namespace RaptorSDR.Server.Core.Web.HTTP
{
    public class RaptorHttpContext : Stream
    {
        public RaptorHttpContext(IRaptorLogger logger, Socket sock)
        {
            //Set
            this.sock = sock;
            this.logger = logger;

            //Read status line
            string[] status = ReadLine().Split(' ');
            method = status[0];
            url = new Uri(new Uri("http://0.0.0.0/"), new Uri(status[1], UriKind.Relative));

            //Read headers
            string lastHeader = ReadLine();
            while (lastHeader != "")
            {
                string key = lastHeader.Split(':')[0];
                string value = lastHeader.Substring(key.Length + 2);
                requestHeaders.Add(key.ToLower(), value);
                lastHeader = ReadLine();
            }

            //Add server headers
            responseHeaders.Add("server", $"RaptorSDR HTTP Server/{RaptorControl.VERSION_MAJOR}.{RaptorControl.VERSION_MINOR}");

            //Parse the query
            var parsedQuery = HttpUtility.ParseQueryString(url.Query);
            foreach (var q in parsedQuery.AllKeys)
                query.Add(q, parsedQuery.Get(q));
        }

        private IRaptorLogger logger;
        private Socket sock;
        private HttpStatusCode statusCode = HttpStatusCode.OK;
        private string method;
        private Uri url;
        private Dictionary<string, string> requestHeaders = new Dictionary<string, string>();
        private Dictionary<string, string> responseHeaders = new Dictionary<string, string>();
        private Dictionary<string, string> query = new Dictionary<string, string>();
        private bool hasSentHeaders;
        private bool isWebSocket;
        private long requestRemaining = -1;

        public Stream InputStream => this;

        public Stream OutputStream => this;

        public HttpStatusCode StatusCode
        {
            get => statusCode;
            set
            {
                EnsureSetHeader();
                statusCode = value;
            }
        }
        public string Method { get => method; }

        public Uri Url => url;

        public Dictionary<string, string> RequestHeaders => requestHeaders;

        public Dictionary<string, string> ResponseHeaders => responseHeaders;

        public Dictionary<string, string> Query => query;

        public override bool CanRead => true;

        public override bool CanSeek => false;

        public override bool CanWrite => true;

        public override long Length => throw new NotSupportedException();

        public override long Position { get => throw new NotSupportedException(); set => throw new NotSupportedException(); }

        public void FinalizeHttp()
        {
            SendHeaders();
        }

        private void EnsureSetHeader()
        {
            if (hasSentHeaders)
                throw new Exception("Headers have already been sent. You cannot update them now.");
        }

        public RaptorWebSocket AsWebSocket()
        {
            isWebSocket = true;
            return new RaptorWebSocket(this);
        }

        public void SendHeaders()
        {
            //Check flags
            if (hasSentHeaders)
                return;
            hasSentHeaders = true;

            //Send status
            SendData($"HTTP/1.1 {(int)statusCode} {statusCode}\r\n");

            //Send headers
            foreach (var h in responseHeaders)
                SendData(h.Key + ": " + h.Value + "\r\n");

            //Send end
            SendData("\r\n");
        }

        public T ReadBodyAsJson<T>()
        {
            //Read content
            string content;
            using (StreamReader sr = new StreamReader(InputStream))
                content = sr.ReadToEnd();

            //Parse
            return JsonConvert.DeserializeObject<T>(content);
        }

        public void WriteBodyAsJson<T>(T payload)
        {
            //Serialize
            string content = JsonConvert.SerializeObject(payload, Formatting.Indented);

            //Write content
            using (StreamWriter wr = new StreamWriter(OutputStream))
                wr.Write(content);
        }

        public void WriteText(string text)
        {
            byte[] data = Encoding.UTF8.GetBytes(text);
            OutputStream.Write(data, 0, data.Length);
        }

        /// <summary>
        /// Automatically authenticates the user and returns errors if it failed. Do nothing but quit if false is returned.
        /// </summary>
        /// <param name="session"></param>
        /// <returns></returns>
        public bool AuthenticateSession(IRaptorControl ctx, out IRaptorSession session)
        {
            session = null;
            if(TryGetQueryParameter("access_token", out string token) && ctx.Auth.AuthenticateSession(token, out session))
            {
                //OK
                return true;
            } else
            {
                //Failed
                StatusCode = HttpStatusCode.Unauthorized;
                return false;
            }
        }

        public bool TryGetQueryParameter(string key, out string value)
        {
            if(Query.ContainsKey(key))
            {
                value = Query[key];
                return true;
            } else
            {
                value = null;
                return false;
            }
        }

        private string ReadLine(int bufferSize = 16384)
        {
            byte[] buffer = new byte[bufferSize];
            int i = 0;
            while (i < bufferSize)
            {
                //Read
                if (sock.Receive(buffer, i, 1, SocketFlags.None) != 1)
                    throw new Exception("Unexpected end of stream.");
                char last = (char)buffer[i];

                //Process
                if (last == '\n')
                    return Encoding.UTF8.GetString(buffer, 0, i);
                if (last != '\r' && last != '\n')
                    i++;
            }
            throw new Exception("Buffer full!");
        }

        private void SendData(string text)
        {
            byte[] data = Encoding.UTF8.GetBytes(text);
            SendData(data, data.Length);
        }

        private void SendData(byte[] buffer, int len)
        {
            sock.Send(buffer, len, SocketFlags.None);
        }

        public override void Flush()
        {

        }

        public override int Read(byte[] buffer, int offset, int count)
        {
            //If we're a websocket, ignore this behavior and run raw
            if (isWebSocket)
                return sock.Receive(buffer, offset, count, SocketFlags.None);

            //Check if we know how much to get yet
            if (requestRemaining == -1 && (!RequestHeaders.TryGetValue("content-length", out string valueString) || !long.TryParse(valueString, out requestRemaining) || requestRemaining < 0))
            {
                requestRemaining = -1;
                throw new Exception("Content-Length header required");
            }

            //Check if we're done
            if (requestRemaining == 0)
                return 0;

            //Get
            int read = sock.Receive(buffer, offset, (int)Math.Min(count, requestRemaining), SocketFlags.None);
            requestRemaining -= read;
            return read;
        }

        public override long Seek(long offset, SeekOrigin origin)
        {
            throw new NotSupportedException();
        }

        public override void SetLength(long value)
        {
            throw new NotSupportedException();
        }

        public override void Write(byte[] buffer, int offset, int count)
        {
            //Send headers if we haven't
            if (!hasSentHeaders)
                SendHeaders();

            //Send
            sock.Send(buffer, offset, count, SocketFlags.None);
        }

        public void Log(RaptorLogLevel level, string topic, string msg)
        {
            logger.Log(level, topic, msg);
        }
    }
}
