using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.Auth;
using RaptorSDR.Server.Core.Web.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.CLI.Accounts
{
    public class UserCreateCommand : ICliCommand
    {
        public string Command => "create";

        public string Help => "Creates a blank user account with the specified username and password.";

        public string Syntax => "<username> <password>";

        public void Handle(CliArgs args)
        {
            //Get auth manager
            var auth = (RaptorAuthManager)Program.control.Auth;

            //Read options
            if (!args.TryPop(out string username) || !args.TryPop(out string password))
            {
                Console.WriteLine("Invalid usage.");
                return;
            }

            //Create account
            try
            {
                string token = auth.CreateAccount(username, password);
                Console.WriteLine($"Created account \"{username}\" successfully.");
            } catch (RaptorAuthException error)
            {
                Console.WriteLine("Failed to create account: " + error.Status.ToString());
            }
        }
    }
}
