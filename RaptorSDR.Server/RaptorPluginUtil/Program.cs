using RaptorPluginUtil.Operations.Build;
using RaptorPluginUtil.Operations.FrontendCreate;
using RaptorPluginUtil.Operations.Init;
using System;

namespace RaptorPluginUtil
{
    class Program
    {
        public const ushort VERSION_MAJOR = 0;
        public const ushort VERSION_MINOR = 5;

        public const uint VERSION_CODE = ((uint)VERSION_MAJOR << 16) | VERSION_MINOR;
        
        static int Main(string[] args)
        {
            //Parse args
            RaptorParams rArgs = new RaptorParams(args);

            //Decide where to go
            rArgs.TryPop(out string command);
            switch (command)
            {
                case "init": return InitOperation.Handle(rArgs);
                case "build": return BuildOperation.Handle(rArgs);
                case "frontend_create": return FrontendCreateOperation.Handle(rArgs);
            }

            //If we haven't done anything, print info and exit
            Console.WriteLine($"RaptorSDR Plugin CLI v{VERSION_MAJOR}.{VERSION_MINOR}");
            Console.WriteLine("");
            Console.WriteLine("init {developer name} {plugin name}");
            Console.WriteLine("    Creates a new project");
            Console.WriteLine("build");
            Console.WriteLine("    Builds the current project");
            Console.WriteLine("frontend_create {name}");
            Console.WriteLine("    Creates a new JS frontend");
            return -1;
        }
    }
}
