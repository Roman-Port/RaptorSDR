using RaptorSDR.Server.CLI;
using RaptorSDR.Server.CLI.Accounts;
using RaptorSDR.Server.Common;
using RaptorSDR.Server.Core;
using System;
using System.Net;
using System.Threading;

namespace RaptorSDR.Server
{
    class Program
    {
        static void Main(string[] args)
        {
            //Start
            control = new RaptorControl(new RaptorSettings());
            control.Init();

            //Enter CLI mode
            Console.WriteLine("Entering CLI mode...");
            while(true)
            {
                //Read
                Console.ForegroundColor = ConsoleColor.White;
                Console.Write(">");
                CliArgs p = new CliArgs(Console.ReadLine());

                //Go
                Console.ForegroundColor = ConsoleColor.Cyan;
                cli.Handle(p);
                Console.ForegroundColor = ConsoleColor.White;
            }
        }

        public static RaptorControl control;
        private static CliCommandSwitcher cli = new CliCommandSwitcher("CLI", "")
            .RegisterCommand(new CliCommandSwitcher("accounts", "Manages user accounts.")
                .RegisterCommand(new AccountListCommand())
                .RegisterCommand(new UserCreateCommand())
                .RegisterCommand(new UserDeleteCommand())
                .RegisterCommand(new CliCommandSwitcher("grant", "Grants a user account access.")
                    .RegisterCommand(new UserAdminCommand(true))
                    .RegisterCommand(new UserSysCommand(true))
                )
                .RegisterCommand(new CliCommandSwitcher("deny", "Denies a user account access.")
                    .RegisterCommand(new UserAdminCommand(false))
                    .RegisterCommand(new UserSysCommand(false))
                )
            );
    }
}
