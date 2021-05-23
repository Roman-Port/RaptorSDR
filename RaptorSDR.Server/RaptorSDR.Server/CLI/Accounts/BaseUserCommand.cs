using RaptorSDR.Server.Core.Web.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.CLI.Accounts
{
    public abstract class BaseUserCommand : ICliCommand
    {
        public abstract string Command { get; }
        public abstract string Help { get; }
        public abstract string Syntax { get; }
        protected RaptorAuthManager Auth { get => (RaptorAuthManager)Program.control.Auth; }

        public void Handle(CliArgs args)
        {
            //Get the user account name
            if (!args.TryPop(out string username))
            {
                Console.WriteLine("Invalid usage: Specify username.");
                return;
            }

            //Get the user account
            if(!Auth.GetUserByUsername(username, out RaptorAuthenticatedUserAccount account))
            {
                Console.WriteLine($"Error: User \"{username}\" couldn't be found.");
                return;
            }

            //Pass through control
            HandleUser(args, account);
        }

        public abstract void HandleUser(CliArgs args, RaptorAuthenticatedUserAccount account);
    }
}
