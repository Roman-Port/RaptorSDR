using Newtonsoft.Json.Linq;
using RaptorSDR.Server.Common.Auth;
using RaptorSDR.Server.Common.Dispatchers;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.DataProviders
{
    public delegate bool RaptorDataProvider_PermisionCheckFunc(IRaptorSession session);
    public delegate void RaptorDataProvider_OnChangedEventArgs<T>(T data, IRaptorSession session);

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
        private string id;
        private List<RaptorScope> requiredScopeSystem = new List<RaptorScope>();
        private List<string> requiredScopePlugin = new List<string>();

        public event RaptorDataProvider_OnChangedEventArgs<T> OnChanging;

        public T Value
        {
            get => value;
            set
            {
                this.value = value;
                OnChanging?.Invoke(value, null);
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

        public RaptorPrimitiveDataProvider<T> SetRequiredScope(RaptorScope scope)
        {
            requiredScopeSystem.Add(scope);
            return this;
        }

        public RaptorPrimitiveDataProvider<T> SetRequiredScope(string scope)
        {
            requiredScopePlugin.Add(scope);
            return this;
        }

        public RaptorPrimitiveDataProvider<T> BindOnChanging(RaptorDataProvider_OnChangedEventArgs<T> callback)
        {
            OnChanging += callback;
            return this;
        }

        private void EndpointSetValue_OnClientConnected(IRaptorEndpoint ep, IRaptorEndpointClient client, IRaptorSession session)
        {
            WebNotifyUpdated(null, client);
        }

        private void EndpointSetValue_OnMessage(IRaptorEndpoint ep, IRaptorEndpointClient client, JObject message)
        {
            //Make sure we have permission
            if (!CheckIfWritePermitted(client.Session))
            {
                //Notify this sender that their change was bad
                SendAck(client, message, false, "You do not have permission to modify this value.");
                return;
            }

            //Attempt to read value
            if (!DeserializeIncoming(message["value"], out T incomingValue))
            {
                //Notify this sender that their change was bad
                SendAck(client, message, false, "Invalid value.");
                return;
            }

            //If for some reason the client has no session, abort. This shouldn't be possible
            if (client.Session == null)
                throw new Exception("Unexpected no session for client!");

            //Attempt to apply
            try
            {
                OnChanging?.Invoke(incomingValue, client.Session);
            } catch (RaptorWebException wex)
            {
                //Notify the sender that their change was bad
                SendAck(client, message, false, wex.WebCaption, wex.WebBody);
                return;
            } catch (Exception ex)
            {
                //Notify this sender that their change was bad
                SendAck(client, message, false, "Unknown exception thrown: " + ex.Message + ex.StackTrace);
                return;
            }

            //Update here
            value = incomingValue;

            //Notify clients of change
            WebNotifyUpdated(client.Session);

            //Notify this sender that their change was OK
            SendAck(client, message, true);
        }

        private void SendAck(IRaptorEndpointClient client, JObject message, bool ok, string errorCaption = null, string errorBody = null)
        {
            JObject ack = new JObject();
            ack["ok"] = ok;
            ack["token"] = message.ContainsKey("token") ? message["token"] : null;
            ack["error_caption"] = errorCaption;
            ack["error_body"] = errorBody;
            endpointAck.SendTo(client, ack);
        }

        private bool CheckIfWritePermitted(IRaptorSession session)
        {
            return !readOnly && session.CheckPluginScope(requiredScopePlugin.ToArray()) && session.CheckSystemScope(requiredScopeSystem.ToArray());
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
            //Create the numerical representation of the system scopes
            ulong scope = 0;
            foreach (var s in requiredScopeSystem)
                scope |= 1ul << (int)s;

            //Write other info
            info["underlying_type"] = typeof(T).FullName;
            info["read_only"] = readOnly;
            info["scope_plugin"] = JToken.FromObject(requiredScopePlugin);
            info["scope_system"] = scope;
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
