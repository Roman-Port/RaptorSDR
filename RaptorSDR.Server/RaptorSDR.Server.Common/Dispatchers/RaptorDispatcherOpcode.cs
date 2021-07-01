using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.Dispatchers
{
    public class RaptorDispatcherOpcode
    {
        private List<RaptorDispatcherOpcodeSubscription> subscriptions = new List<RaptorDispatcherOpcodeSubscription>();

        public RaptorDispatcherOpcode(IRaptorEndpoint parent)
        {
            this.parent = parent;
        }

        private IRaptorEndpoint parent;

        public IRaptorEndpoint CreateSubscription(string opcode)
        {
            RaptorDispatcherOpcodeSubscription subscription = new RaptorDispatcherOpcodeSubscription(parent, opcode);
            subscriptions.Add(subscription);
            return subscription;
        }

        class RaptorDispatcherOpcodeSubscription : IRaptorEndpoint
        {
            public RaptorDispatcherOpcodeSubscription(IRaptorEndpoint parent, string opcode)
            {
                this.parent = parent;
                this.opcode = opcode;
                parent.OnMessage += Parent_OnMessage;
                parent.OnClientLost += (IRaptorEndpoint ep, IRaptorEndpointClient client, IRaptorSession session) => OnClientLost?.Invoke(ep, client, session);
                parent.OnClientConnected += (IRaptorEndpoint ep, IRaptorEndpointClient client, IRaptorSession session) => OnClientConnected?.Invoke(ep, client, session);
            }

            private string opcode;
            private IRaptorEndpoint parent;

            public event IRaptorEndpoint_ClientStatusChanged OnClientLost;
            public event IRaptorEndpoint_ClientStatusChanged OnClientConnected;
            public event IRaptorEndpoint_MessageEventArgs OnMessage;

            private void Parent_OnMessage(IRaptorEndpoint ep, IRaptorEndpointClient client, JObject payload)
            {
                if (payload.ContainsKey("op") && payload.ContainsKey("d") && (string)payload["op"] == opcode)
                    OnMessage?.Invoke(this, client, (JObject)payload["d"]);
            }

            public void SendAll(JObject payload)
            {
                JObject output = new JObject();
                output["op"] = opcode;
                output["d"] = payload;
                parent.SendAll(output);
            }

            public void SendTo(IRaptorEndpointClient client, JObject payload)
            {
                JObject output = new JObject();
                output["op"] = opcode;
                output["d"] = payload;
                parent.SendTo(client, output);
            }

            public IRaptorEndpoint BindOnMessage(IRaptorEndpoint_MessageEventArgs evt)
            {
                OnMessage += evt;
                return this;
            }
        }
    }
}
