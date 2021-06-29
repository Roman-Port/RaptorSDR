using RaptorSDR.Server.Core.Web.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.CLI.Accounts
{
    public class UserDeleteCommand : BaseUserCommand
    {
        public override string Command => "delete";

        public override string Help => "Deletes a user account. There is no confirmation.";

        public override string Syntax => "<username>";

        public override void HandleUser(CliArgs args, RaptorAuthenticatedUserAccount account)
        {
            //Make sure account isn't managed
            if(account.username == "guest")
            {
                Console.WriteLine("Cannot remove managed account.");
                return;
            }
            
            //Remove
            Auth.DeleteAccount(account.username);

            //Tell the user
            Console.WriteLine($"Account \"{account.username}\" deleted.");
            Console.WriteLine("NOTE: This change doesn't take effect until the user reconnects. This account may still have access until the server is rebooted.");
        }
    }
}
