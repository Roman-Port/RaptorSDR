using RaptorSDR.Server.Common.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    /// <summary>
    /// An authenticated session that allows access to certain permissions
    /// </summary>
    public interface IRaptorSession
    {
        string Id { get; }
        string AccessToken { get; }
        bool IsAdmin { get; }

        bool CheckSystemScope(RaptorScope scope);
        bool CheckSystemScope(params RaptorScope[] scopes);
        bool CheckPluginScope(RaptorPlugin plugin, string scope);
        bool CheckPluginScope(RaptorPlugin plugin, params string[] scopes);
    }
}
