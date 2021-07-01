using System;

namespace RomanPort.Recorder.Tests
{
    public delegate bool TestDelegate(TestContext ctx);

    class Program
    {
        static void Main(string[] args)
        {
            GrowingBufferTests.Test();

            Console.WriteLine("Finished.");
            Console.ReadLine();
        }

        public static void RunTest(string name, TestDelegate test)
        {
            //Create context
            TestContext ctx = new TestContext();

            //Log
            Console.ForegroundColor = ConsoleColor.White;
            Console.Write($"Testing \"{name}\"...");

            //Run test
            bool success = test(ctx);

            //Log
            if(success)
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.Write($"OK (in {ctx.TotalMilliseconds} ms)");
            } else
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.Write($"FAILED: {ctx.Message}");
            }

            //Log
            Console.ForegroundColor = ConsoleColor.White;
            Console.Write("\n");
        }
    }
}
