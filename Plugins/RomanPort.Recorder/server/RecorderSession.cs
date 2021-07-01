using RomanPort.LibSDR.Components;
using RomanPort.LibSDR.Components.IO;
using RomanPort.LibSDR.Components.IO.WAV;
using RomanPort.Recorder.Buffers;
using RomanPort.Recorder.Config;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;

namespace RomanPort.Recorder
{
    public delegate void RecorderSession_StatusChanged(RecorderSession session, RecorderStatus status);
    
    public unsafe class RecorderSession
    {
        public RecorderSession(RecorderSettings settings, int bufferSize, int channels)
        {
            this.settings = settings;
            this.bufferSize = bufferSize;
            this.channels = channels;

            //Create buffer (it'll grow over time if needed)
            processingBuffer = new RecorderGrowingBuffer<float>(bufferSize);

            //Start worker threads
            worker = new Thread(WorkerThread);
            worker.IsBackground = true;
            worker.Name = $"RecorderSession \"{settings.name}\"";
            worker.Start();
        }

        private readonly RecorderSettings settings;
        private readonly int bufferSize;
        private readonly int channels;
        private readonly RecorderGrowingBuffer<float> processingBuffer;
        private readonly Thread worker;

        private RecorderStatus status = RecorderStatus.IDLE;
        private long samplesRecorded = 0;

        private volatile bool isRecording;
        private volatile int sampleRate;
        private volatile string outputFile; //if this is null, it'll be deleted. make sure it is set before changing isRecording

        public event RecorderSession_StatusChanged OnStatusChanged;

        public int SampleRate { get => sampleRate; }
        public RecorderStatus Status { get => status; }
        public long SamplesWaiting { get => processingBuffer.Used; }
        public long SamplesWritten { get => samplesRecorded; }
        public long BytesWritten { get => SamplesWritten * sizeof(float); }
        public long SecondsWritten { get => SamplesWritten / channels / SampleRate; }
        public SampleFormat OutputSampleFormat
        {
            get
            {
                switch(settings.bitsPerSample)
                {
                    case 8: return SampleFormat.Byte;
                    case 16: return SampleFormat.Short16;
                    case 32: return SampleFormat.Float32;
                    default: throw new Exception("Unknown bits per sample. Must be 8, 16, or 32.");
                }
            }
        }

        public void WriteSamples(float* ptr, int count)
        {
            lock (processingBuffer)
                processingBuffer.Write(ptr, count);
        }

        public void ChangeSampleRate(int sampleRate)
        {
            this.sampleRate = sampleRate;
        }

        public void StartRecording()
        {
            isRecording = true;
        }

        public void EndRecording(string filename)
        {
            outputFile = filename;
            isRecording = false;
        }

        public void CancelRecording()
        {
            outputFile = null;
            isRecording = false;
        }

        private void UpdateState(RecorderStatus state)
        {
            status = state;
            OnStatusChanged?.Invoke(this, state);
        }

        private void WorkerThread()
        {
            //Create state
            int read;
            bool isRecording = false;
            long sampleRate = this.sampleRate;
            string outputFile;

            //Create working buffer for thread
            UnsafeBuffer threadBuffer = UnsafeBuffer.Create(bufferSize, out float* threadBufferPtr);

            //Create the rewind buffer
            RecorderCircularBuffer<float> rewindBuffer = new RecorderCircularBuffer<float>(settings.rewindBufferSeconds * sampleRate * channels);

            //Allocate the file handle that'll be used for writing
            FileStream file = null;
            WavFileWriter fileWriter = null;
            string fileName = null;

            //Enter loop
            while(true)
            {
                //Look for changes
                bool sampleRateStale = this.sampleRate != sampleRate;

                //Get state (so this is more thread safe)
                isRecording = this.isRecording;
                sampleRate = this.sampleRate;
                outputFile = this.outputFile;

                //If we're recording but have no target file, assume we're starting a new recording
                if(isRecording && file == null)
                {
                    //Set status
                    UpdateState(RecorderStatus.RECORDING);
                    samplesRecorded = 0;
                    
                    //Find a temporary filename to use
                    int tempId = 0;
                    do
                        fileName = $"TEMP_DATA_{tempId++}";
                    while (File.Exists(fileName));

                    //Open file
                    file = new FileStream(fileName, FileMode.Create);

                    //Open writer
                    fileWriter = new WavFileWriter(file, (int)sampleRate, (short)channels, OutputSampleFormat, bufferSize);

                    //Dump the contents of the rewind buffer into this
                    samplesRecorded += rewindBuffer.Used;
                    while (rewindBuffer.Used > 0)
                        fileWriter.Write(threadBufferPtr, (int)rewindBuffer.Read(threadBufferPtr, bufferSize));
                }

                //Likewise, if we're not recording but have a target file, assume we're ending a recording
                if(!isRecording && file != null)
                {
                    //Set status
                    UpdateState(RecorderStatus.STOPPING);

                    //Empty remaining samples
                    long remaining = processingBuffer.Used;
                    while(remaining > 0)
                    {
                        //Read
                        lock (processingBuffer)
                            read = (int)processingBuffer.Read(threadBufferPtr, Math.Min(remaining, bufferSize));

                        //Write
                        fileWriter.Write(threadBufferPtr, read);

                        //Update
                        samplesRecorded += read;
                        remaining -= read;
                    }

                    //Write headers, close file, do general cleanup
                    fileWriter.FinalizeFile();
                    file.Close();
                    file.Dispose();

                    //Perform action
                    if(outputFile != null)
                    {
                        //Check if the overwriting file exists
                        if (File.Exists(outputFile))
                            File.Delete(outputFile);

                        //Move file to new destination
                        File.Move(fileName, outputFile);
                    } else
                    {
                        //Cancel and delete output file
                        File.Delete(fileName);
                    }

                    //Set status
                    UpdateState(RecorderStatus.IDLE);
                }

                //Also, check if the sample rate is stale. If it is, we'll need to recreate the rewind buffer to it's new size
                if(sampleRateStale)
                {
                    rewindBuffer.Dispose();
                    rewindBuffer = new RecorderCircularBuffer<float>(settings.rewindBufferSeconds * sampleRate * channels);
                }

                //Wait for samples
                processingBuffer.Wait(100);

                //Read
                lock (processingBuffer)
                    read = (int)processingBuffer.Read(threadBufferPtr, bufferSize);

                //Depending on state, deal with it
                if (isRecording)
                {
                    fileWriter.Write(threadBufferPtr, read);
                    samplesRecorded += read;
                } else
                {
                    rewindBuffer.Write(threadBufferPtr, read);
                }
            }
        }
    }
}
