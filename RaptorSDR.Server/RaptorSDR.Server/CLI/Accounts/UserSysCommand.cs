using RaptorSDR.Server.Common.Auth;
using RaptorSDR.Server.Core.Web.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.CLI.Accounts
{
    public class UserSysCommand : BaseUserCommand
    {
        public UserSysCommand(bool grant)
        {
            this.grant = grant;
        }

        private bool grant;

        public override string Command => "system";

        public override string Help => "Changes system permissions.";

        public override string Syntax => "<username> <permission name> <permission name> <permission name> ...";

        public override void HandleUser(CliArgs args, RaptorAuthenticatedUserAccount account)
        {
            //Read
            List<RaptorScope> scopes = new List<RaptorScope>();
            while(args.TryPop(out string permission))
            {
                //Parse
                if (Enum.TryParse(permission, out RaptorScope scope)) {
                    //Modify
                    if(grant)
                        account.scope_system |= 1UL << (int)scope;
                    else
                        account.scope_system &= ~(1UL << (int)scope);

                    //Register
                    scopes.Add(scope);
                } else
                {
                    //Parse failed
                    Console.WriteLine($"Permission \"{permission}\" not found, did you mean to use a plugin permission?");
                }
            }

            //Save
            Auth.Save();

            //Output
            Console.WriteLine($"{(grant ? "Granted" : "Denied")} \"{account.username}\" the following additional permissions:");
            foreach (var s in scopes)
                Console.WriteLine("    " + s);
        }
    }
}
