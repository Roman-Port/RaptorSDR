using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.DataProviders;
using RaptorSDR.Server.Common.PluginComponents;
using RomanPort.LibSDR.Components;
using RomanPort.LibSDR.Components.IO;
using RomanPort.LibSDR.Components.IO.WAV;
using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text;

namespace RomanPort.SourceFile
{
    public class PluginIqFileSource : IPluginSource
    {
        public PluginIqFileSource(SourceFilePlugin plugin)
        {
            this.plugin = plugin;

            //Register icon
            using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream("RomanPort.SourceFile.icon.png"))
                icon = plugin.Control.RegisterIcon(s);

            //Create data providers
            dpFileLocation = new RaptorPrimitiveDataProvider<string>(this, "FileLocation")
                .BindOnChanging((string path, IRaptorSession session) =>
                {
                    //If the radio is curerntly running, stop
                    if (opened)
                        throw new RaptorWebException("Can't change IQ file", "Stop the radio before changing files.");

                    //Get file request
                    var info = session.ResolveWebFile(path);

                    //Ensure that the user can access this
                    info.EnsureCanRead();

                    //Make sure it exists
                    if (!info.Exists)
                        throw new RaptorWebException("IQ file invalid", "The path you specified is invalid. The file doesn't exist.");

                    //Apply
                    filename = info.AbsoluteFilename;
                });
        }

        public string DisplayName => "IQ File Source";
        public RaptorNamespace Id => plugin.Id.Then("Source");
        public IRaptorControl Control => plugin.Control;
        public IRaptorWebPackage Icon => icon;

        private RaptorPrimitiveDataProvider<string> dpFileLocation;

        private SourceFilePlugin plugin;
        private IRaptorWebPackage icon;

        private bool opened;
        private long centerFreq;
        private int bufferSize;
        private string filename;
        private FileStream stream;
        private WavFileReader reader;
        private SampleThrottle throttle;

        public void Init(int bufferSize)
        {
            this.bufferSize = bufferSize;
        }

        public void Start()
        {
            //Make sure a file is set at all
            if (filename == null)
                throw new RaptorWebException("Can't open IQ file", "There is no selected IQ file. Choose one before starting the radio.");

            //Attempt to open the file
            try
            {
                stream = new FileStream(filename, FileMode.Open, FileAccess.Read);
            } catch
            {
                throw new RaptorWebException("IQ file invalid", "The path you specified is invalid. The file cannot be opened.");
            }

            //Open WAV file reader on this file
            try
            {
                reader = new WavFileReader(stream, bufferSize);
            } catch
            {
                throw new RaptorWebException("IQ file invalid", "The specified IQ file is not a valid WAV file. It cannot be read.");
            }

            //Update
            throttle = new SampleThrottle(reader.SampleRate);
            opened = true;
            OnSampleRateChanged?.Invoke(this);
        }

        public unsafe int Read(Complex* bufferPtr, int count)
        {
            //Make sure file is opened
            if (!opened)
                throw new Exception("File is not yet opened!");

            //Throttle
            throttle.SamplesProcessed(count);
            throttle.Throttle();

            //Read
            return reader.Read(bufferPtr, count);
        }

        public void Stop()
        {
            //Close file
            if(stream != null)
            {
                stream.Close();
                stream.Dispose();
                stream = null;
            }

            //Update
            opened = false;
        }

        public float OutputSampleRate => reader == null ? 0 : reader.SampleRate;
        public long CenterFreq { get => centerFreq; set => throw new RaptorWebException("Can't change frequency", "IQ files are locked to their recorded frequency."); }

        public event IPluginSource_SampleRateChanged OnSampleRateChanged;
    }
}
