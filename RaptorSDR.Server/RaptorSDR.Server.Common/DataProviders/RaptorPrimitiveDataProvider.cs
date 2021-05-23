using Newtonsoft.Json.Linq;
using RaptorSDR.Server.Common.Dispatchers;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.DataProviders
{
    public delegate bool RaptorDataProvider_PermisionCheckFunc(IRaptorSession session);
    public delegate void RaptorDataProvider_OnChangedEventArgs<T>(T data);

    public class RaptorPrimitiveDataProvider<T> : IRaptorDataProvider
    {
        public RaptorPrimitiveDataProvider(IRaptorContext context, string id)
        {
            this.context = context;
            this.id = id;
            dispatcher = new RaptorDispatcherOpcode(context.Control.RegisterDataProvider(this));
            endpointSetValue = dispatcher.CreateSubscription("SET_VALUE");
            endpointAck = dispatcher.CreateSubscription("ACK");
            endpointSetValue.OnMessage += EndpointSetValue_OnMessage;
            endpointSetValue.OnClientConnected += EndpointSetValue_OnClientConnected;
        }

        private RaptorDispatcherOpcode dispatcher;
        private IRaptorEndpoint endpointSetValue;
        private IRaptorEndpoint endpointAck;
        private IRaptorContext context;
        private T value;
        private bool readOnly;
        private RaptorDataProvider_PermisionCheckFunc permissionCheck;
        private string id;

        public event RaptorDataProvider_OnChangedEventArgs<T> OnChanged;

        public T Value
        {
            get => value;
            set
            {
                this.value = value;
                OnChanged?.Invoke(value);
                WebNotifyUpdated();
            }
        }

        public string DisplayName => id;

        public RaptorNamespace Id => context.Id.Then(id);

        public RaptorPrimitiveDataProvider<T> SetWebReadOnly(bool readOnly)
        {
            this.readOnly = readOnly;
            return this;
        }

        public RaptorPrimitiveDataProvider<T> SetPermissionCheckFunction(RaptorDataProvider_PermisionCheckFunc func)
        {
            permissionCheck = func;
            return this;
        }

        public RaptorPrimitiveDataProvider<T> BindOnChanged(RaptorDataProvider_OnChangedEventArgs<T> callback)
        {
            OnChanged += callback;
            return this;
        }

        private void EndpointSetValue_OnClientConnected(IRaptorEndpointClient client, IRaptorSession session)
        {
            WebNotifyUpdated(null, client);
        }

        private void EndpointSetValue_OnMessage(IRaptorEndpointClient client, JObject message)
        {
            //Make sure we have permission
            if (!CheckIfWritePermitted(client.Session))
            {
                //Notify this sender that their change was bad
                SendAck(client, message, false, "You do not have permission to modify this value.");
                return;
            }

            //Attempt to read value
            if(DeserializeIncoming(message["value"], out T incomingValue))
            {
                //Notify this sender that their change was bad
                SendAck(client, message, false, "Invalid value.");
                return;
            }

            //Apply
            try
            {
                value = incomingValue;
                OnChanged?.Invoke(value);
            } catch (Exception ex)
            {
                //Notify this sender that their change was bad
                SendAck(client, message, false, "Unknown exception thrown: " + ex.Message + ex.StackTrace);
            }

            //Notify clients of change
            WebNotifyUpdated(client.Session);

            //Notify this sender that their change was OK
            SendAck(client, message, true);
        }

        private void SendAck(IRaptorEndpointClient client, JObject message, bool ok, string error = null)
        {
            JObject ack = new JObject();
            ack["ok"] = ok;
            ack["token"] = message.ContainsKey("token") ? message["token"] : null;
            ack["error"] = error;
            endpointAck.SendTo(client, ack);
        }

        private bool CheckIfWritePermitted(IRaptorSession session)
        {
            return !readOnly && (permissionCheck == null || permissionCheck(session));
        }

        private void WebNotifyUpdated(IRaptorSession sender = null, IRaptorEndpointClient client = null)
        {
            //Create message
            JObject message = new JObject();
            message["value"] = SerializeOutgoing(value);
            message["sender"] = sender == null ? null : sender.Id;

            //Send
            if (client == null)
                endpointSetValue.SendAll(message);
            else
                endpointSetValue.SendTo(client, message);
        }

        public virtual void BuildInfo(JObject info)
        {
            info["underlying_type"] = typeof(T).FullName;
            info["read_only"] = readOnly;
        }

        protected virtual bool DeserializeIncoming(JToken incoming, out T value)
        {
            value = incoming.ToObject<T>();
            return true;
        }

        protected virtual JToken SerializeOutgoing(T value)
        {
            return value == null ? null : JToken.FromObject(value);
        }
    }
}
