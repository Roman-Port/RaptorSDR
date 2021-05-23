using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common
{
    public class RaptorWebException : Exception
    {
        public string WebCaption { get => caption; }
        public string WebBody { get => body; }

        private string caption;
        private string body;
        
        public RaptorWebException(string caption, string body) : base("Web exception: " + caption)
        {
            this.caption = caption;
            this.body = body;
        }

        /// <summary>
        /// Runs a command in a try catch. If a RaptorWebException is thrown, it is simply passed outwards. If a different exception is thrown, it is wrapped as a RaptorWebException.
        /// 
        /// This function will still throw an exception if there was an error, but it is guaranteed to be a RaptorWebException.
        /// </summary>
        /// <param name="command"></param>
        /// <param name="logger"></param>
        /// <param name="errorCaption"></param>
        /// <param name="errorBody"></param>
        public static void TryCatchProtected(RaptorWebException_TryCatchProtectedFunc command, IRaptorLogger logger, string errorCaption, string errorBody = "An unknown internal error occurred. Check server logs for more info.")
        {
            try
            {
                command();
            } catch (RaptorWebException wex)
            {
                throw wex;
            } catch (Exception ex)
            {
                logger.Log(RaptorLogLevel.ERROR, "RaptorWebException", "Wrapped web command threw an unknown exception, displayed RaptorWebException to user: " + ex.Message + ex.StackTrace);
                throw new RaptorWebException(errorCaption, errorBody);
            }
        }
        public delegate void RaptorWebException_TryCatchProtectedFunc();
    }
}
