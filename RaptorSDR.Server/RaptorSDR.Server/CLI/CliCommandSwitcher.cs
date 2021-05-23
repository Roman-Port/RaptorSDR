using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.CLI
{
    public class CliCommandSwitcher : ICliCommand
    {
        public CliCommandSwitcher(string command, string help)
        {
            this.command = command;
            this.help = help;
        }

        private string command;
        private string help;
        private List<ICliCommand> commands = new List<ICliCommand>();

        public string Command => command;

        public string Help => help;

        public string Syntax => "<command>";

        public void Handle(CliArgs args)
        {
            //Make sure we can pop
            if(!args.TryPop(out string command))
            {
                PrintHelp("No command specified");
                return;
            }

            //Search
            foreach(var cmd in commands)
            {
                if(cmd.Command == command)
                {
                    cmd.Handle(args);
                    return;
                }
            }

            //Failed to find
            PrintHelp("Invalid command");
        }

        private void PrintHelp(string problem)
        {
            Console.WriteLine($"{Command} - {problem}; available commands:");
            foreach (var cmd in commands)
                Console.WriteLine($"    {cmd.Command}: {cmd.Help}");
        }

        public CliCommandSwitcher RegisterCommand(ICliCommand command)
        {
            commands.Add(command);
            return this;
        }
    }
}
