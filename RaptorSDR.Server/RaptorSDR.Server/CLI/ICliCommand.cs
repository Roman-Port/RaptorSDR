using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.CLI
{
    public interface ICliCommand
    {
        string Command { get; }
        string Help { get; }
        string Syntax { get; }
        void Handle(CliArgs args);
    }
}
