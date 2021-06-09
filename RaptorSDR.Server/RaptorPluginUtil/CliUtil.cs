using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;

namespace RaptorPluginUtil
{
    public class CliUtil
    {
        public static int RunDotnetCommand(string args)
        {
            return RunCommand("dotnet", args, "/server");
        }

        public static int RunSlnCreate(string name)
        {
            return RunCommand("dotnet", $"new sln -n \"{name}\"", "/");
        }

        public static int RunSlnAddProject(string slnFilename, string projectPath)
        {
            return RunCommand("dotnet", $"sln \"{slnFilename}\" add \"{projectPath}\"", "/");
        }

        public static int RunCommand(string filename, string args, string workingDirExtra)
        {
            Process p = Process.Start(new ProcessStartInfo
            {
                FileName = filename,
                Arguments = args,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden,
                UseShellExecute = true,
                WorkingDirectory = Directory.GetCurrentDirectory() + workingDirExtra
            });
            p.WaitForExit();
            return p.ExitCode;
        }
    }
}
