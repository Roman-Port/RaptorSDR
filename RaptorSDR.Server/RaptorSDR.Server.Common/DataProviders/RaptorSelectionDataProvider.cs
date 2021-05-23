using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.DataProviders
{
    public class RaptorSelectionDataProvider<T> : RaptorPrimitiveDataProvider<T> where T : IRaptorContext
    {
        public RaptorSelectionDataProvider(IRaptorContext context, string id, IReadOnlyList<T> collection) : base(context, id)
        {
            this.collection = collection;
        }

        private IReadOnlyList<T> collection;

        protected override bool DeserializeIncoming(JToken incoming, out T value)
        {
            //Set default value
            value = default(T);

            //Validate type
            if (incoming.Type != JTokenType.String)
                return false;

            //Search
            foreach(var v in collection)
            {
                if(v.Id.ToString() == (string)incoming)
                {
                    value = v;
                    return true;
                }
            }

            //Failed
            return false;
        }

        protected override JToken SerializeOutgoing(T value)
        {
            //Check if null https://stackoverflow.com/questions/65351/null-or-default-comparison-of-generic-argument-in-c-sharp
            if (EqualityComparer<T>.Default.Equals(value, default(T)))
                return null;

            //Find
            foreach (var v in collection)
            {
                if (value.Equals(v))
                    return v.Id.ToString();
            }

            return null;
        }

        public override void BuildInfo(JObject info)
        {
            base.BuildInfo(info);

            //Build array of values
            JArray values = new JArray();
            foreach (var v in collection)
                values.Add(v.Id.ToString());
            info["options"] = values;
        }
    }
}
