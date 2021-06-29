using RaptorSDR.Server.Common.Auth;
using System;
using System.Collections.Generic;
using System.IO;
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
        string RefreshToken { get; }
        bool IsAdmin { get; }
        string Username { get; }

        bool CheckSystemScope(RaptorScope scope);
        bool CheckSystemScope(params RaptorScope[] scopes);
        bool CheckPluginScope(RaptorPlugin plugin, string scope);
        bool CheckPluginScope(RaptorPlugin plugin, params string[] scopes);

        IRaptorWebFileInfo ResolveWebFile(string webPathname);
    }
}
