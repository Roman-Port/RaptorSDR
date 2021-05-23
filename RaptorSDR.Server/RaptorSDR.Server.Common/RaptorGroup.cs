using RaptorSDR.Server.Common;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public class RaptorGroup : Dictionary<string, object>
    {
        public T GetValue<T>(string key)
        {
            return (T)this[key];
        }
    }
}
