using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.Auth;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace RaptorSDR.Server.Core.Web
{
    public class RaptorWebFileInfo : IRaptorWebFileInfo
    {
        public RaptorWebFileInfo(IRaptorSettings settings, IRaptorSession session, string webPath)
        {
            //Configure
            this.settings = settings;
            this.session = session;
            this.webPath = webPath;
        }

        private IRaptorSettings settings;
        private IRaptorSession session;
        private string webPath;

        public static string GetUnsafeAbsolutePathFromWeb(IRaptorSettings settings, string webPath)
        {
            return webPath.Replace("managed:", settings.ManagedPath);
        }

        public FileInfo Info { get => new FileInfo(GetUnsafeAbsolutePathFromWeb(settings, webPath)); }
        public string AbsoluteFilename { get => Info.FullName; }
        public bool IsManaged { get => AbsoluteFilename.StartsWith(settings.ManagedPath); }
        public bool Exists { get => Info.Exists; }
        public bool CanRead
        {
            get
            {
                //Checks if we can read managed. If the file is unmanaged, check that.
                return session.CheckSystemScope(RaptorScope.FILE_READ_MANAGED) &&
                    (IsManaged || session.CheckSystemScope(RaptorScope.FILE_READ_ANYWHERE));
            }
        }
        public bool CanWrite
        {
            get
            {
                //Checks if we can write managed. If the file is unmanaged, check that. If the file already exists and will be overwritten, check deletion the same.
                return session.CheckSystemScope(RaptorScope.FILE_WRITE_MANAGED) &&
                    (IsManaged || session.CheckSystemScope(RaptorScope.FILE_WRITE_ANYWHERE)) &&
                    (!Exists || (
                        session.CheckSystemScope(RaptorScope.FILE_DELETE_MANAGED) &&
                        (IsManaged || session.CheckSystemScope(RaptorScope.FILE_DELETE_ANYWHERE))
                    ));
            }
        }

        public void EnsureCanRead()
        {
            if (!CanRead)
                throw new RaptorWebException("Can't Access File", "This user does not have the permissions needed to read this file.");
        }

        public void EnsureCanWrite()
        {
            if (!CanWrite)
                throw new RaptorWebException("Can't Access File", "This user does not have the permissions needed to write this file.");
        }

        public FileStream OpenRead()
        {
            //Validate
            EnsureCanRead();

            //Open
            return new FileStream(AbsoluteFilename, FileMode.Open, FileAccess.Read);
        }

        public FileStream OpenWrite()
        {
            //Validate
            EnsureCanWrite();

            //Open
            return new FileStream(AbsoluteFilename, FileMode.Create, FileAccess.Write);
        }
    }
}
