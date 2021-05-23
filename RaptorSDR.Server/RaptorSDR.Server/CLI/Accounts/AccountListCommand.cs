using RaptorSDR.Server.Common.Auth;
using RaptorSDR.Server.Core.Web.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.CLI.Accounts
{
    public class AccountListCommand : ICliCommand
    {
        public string Command => "list";

        public string Help => "Lists accounts currently loaded.";

        public string Syntax => "";

        public void Handle(CliArgs args)
        {
            //Get auth manager
            var auth = (RaptorAuthManager)Program.control.Auth;

            //Build table
            CliTableBuilder table = new CliTableBuilder("Username", "Created", "Admin", "System Scope", "System Permissions");
            foreach(var u in auth.EnumerateAccounts())
            {
                DateTime created = u.created.ToLocalTime();
                table.AddRow(u.username, created.ToShortDateString() + " " + created.ToShortTimeString(), u.is_admin ? "Yes" : "No", u.scope_system.ToString(), GetSystemPermissions(u.scope_system));
            }

            //Print
            table.Print();
        }

        private string GetSystemPermissions(ulong scope)
        {
            string output = "";
            for(int i = 0; i<64; i++)
            {
                if(((scope >> i) & 1) == 1)
                {
                    output += ((RaptorScope)i).ToString() + " ";
                }
            }
            return output.Trim(' ');
        }
    }
}
