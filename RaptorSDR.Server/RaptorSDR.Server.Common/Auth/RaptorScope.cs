using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Common.Auth
{
    public enum RaptorScope
    {
        CONNECT                 = 0,    //Connect to RPC and read settings 
        CONTROL_BASIC           = 1,    //Control basic settings (tuning, modulation, bandwidth)
        CONTROL_POWER           = 2,    //Turn on/off the radio

        FILE_READ_MANAGED       = 10,   //READ from MANAGED files only
        FILE_READ_ANYWHERE      = 11,   //READ from ANYWHERE on disk
        FILE_WRITE_MANAGED      = 12,   //WRITE to MANAGED files only, implies FILE_READ_MANAGED
        FILE_WRITE_ANYWHERE     = 13,   //WRITE to ANYWHERE on disk, implies FILE_READ_ANYWHERE
        FILE_DELETE_MANAGED     = 14,   //DELETE from MANAGED files only, implies FILE_WRITE_MANAGED
        FILE_DELETE_ANYWHERE    = 15,   //DELETE from ANYWHERE on disk, implies FILE_WRITE_MANAGED
    }
}
