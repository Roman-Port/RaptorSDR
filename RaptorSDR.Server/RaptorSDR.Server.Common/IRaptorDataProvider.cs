using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public interface IRaptorDataProvider
    {
        string DisplayName { get; }
        RaptorNamespace Id { get; }

        void BuildInfo(JObject info);
    }
}
