using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;

namespace RomanPort.Recorder.Tests
{
    public class TestContext
    {
        public TestContext()
        {
            stopwatch = new Stopwatch();
        }

        private Stopwatch stopwatch;
        private string message;
        
        public void Start()
        {
            stopwatch.Start();
        }

        public void End(string message)
        {
            stopwatch.Stop();
            this.message = message;
        }

        public bool EndIfFail(string message, bool status)
        {
            if (!status)
                End(message);
            return status;
        }

        public string Message { get => message; }
        public long TotalMilliseconds { get => stopwatch.ElapsedMilliseconds; }
    }
}
