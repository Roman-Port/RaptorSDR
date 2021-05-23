using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.CLI
{
    public class CliArgs
    {
        public CliArgs(string args)
        {
            this.args = args.Split(' ');
        }

        private string[] args;
        private int index;

        public bool TryPop(out string value)
        {
            if(index == args.Length)
            {
                value = null;
                return false;
            } else
            {
                value = args[index++];
                return true;
            }
        }
    }
}
