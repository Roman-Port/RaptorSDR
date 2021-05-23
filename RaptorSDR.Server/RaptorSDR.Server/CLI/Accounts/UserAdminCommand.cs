using RaptorSDR.Server.Core.Web.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.CLI.Accounts
{
    public class UserAdminCommand : BaseUserCommand
    {
        public UserAdminCommand(bool grant)
        {
            this.grant = grant;
        }

        private bool grant;

        public override string Command => "admin";

        public override string Help => "Changes admin access.";

        public override string Syntax => "<username>";

        public override void HandleUser(CliArgs args, RaptorAuthenticatedUserAccount account)
        {
            account.is_admin = grant;
            Auth.Save();
            Console.WriteLine($"{(grant ? "Granted" : "Denied")} \"{account.username}\" admin access.");
        }
    }
}
