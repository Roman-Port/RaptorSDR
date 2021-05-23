using RaptorSDR.Server.Common;
using RaptorSDR.Server.Core;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Threading;

namespace RaptorSDR.Server
{
    public class RaptorSettings : IRaptorSettings
    {
        public string InstallPath => @"C:\Users\Roman\source\repos\RaptorSDR\UserData\";

        public IPEndPoint Listening => new IPEndPoint(IPAddress.Any, 35341);

        public void Log(RaptorLogLevel level, string topic, string message)
        {
            //Set color
            switch (level)
            {
                case RaptorLogLevel.DEBUG: Console.ForegroundColor = ConsoleColor.DarkGray; break;
                case RaptorLogLevel.LOG: Console.ForegroundColor = ConsoleColor.White; break;
                case RaptorLogLevel.WARN: Console.ForegroundColor = ConsoleColor.Yellow; break;
                case RaptorLogLevel.ERROR: Console.ForegroundColor = ConsoleColor.Red; break;
                case RaptorLogLevel.FATAL: Console.ForegroundColor = ConsoleColor.Magenta; break;
            }

            //Log
            Console.WriteLine($"{Thread.CurrentThread.ManagedThreadId.ToString().PadLeft(3, '0')} [{level.ToString().PadLeft(5, ' ')}] [{topic}] {message}");

            //Rset
            Console.ForegroundColor = ConsoleColor.White;
        }
    }
}
