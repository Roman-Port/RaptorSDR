using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public delegate void IRaptorEndpoint_ClientStatusChanged(IRaptorEndpointClient client, IRaptorSession session);
    public delegate void IRaptorEndpoint_MessageEventArgs(IRaptorEndpointClient client, JObject payload);

    public interface IRaptorEndpoint
    {
        event IRaptorEndpoint_ClientStatusChanged OnClientLost;
        event IRaptorEndpoint_ClientStatusChanged OnClientConnected;
        event IRaptorEndpoint_MessageEventArgs OnMessage;

        void SendAll(JObject payload);
        void SendTo(IRaptorEndpointClient client, JObject payload);
    }
}
