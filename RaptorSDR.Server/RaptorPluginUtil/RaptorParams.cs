using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorPluginUtil
{
    public class RaptorParams
    {
        public RaptorParams(string[] args)
        {
            this.args = args;
        }

        private string[] args;
        private int index;

        public bool IsEmpty { get => index >= args.Length; }

        public bool TryPop(out string value)
        {
            if(IsEmpty)
            {
                value = null;
                return false;
            }
            else
            {
                value = Pop();
                return true;
            }
        }

        public string Pop()
        {
            return args[index++];
        }
    }
}
