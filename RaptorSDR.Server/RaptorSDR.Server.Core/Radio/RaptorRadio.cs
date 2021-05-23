using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.DataProviders;
using RaptorSDR.Server.Common.PluginComponents;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Text;
using System.Threading;

namespace RaptorSDR.Server.Core.Radio
{
    public unsafe class RaptorRadio : RaptorWorkerCommandProcessor, IRaptorContext, IRaptorRadio
    {
        public RaptorRadio(RaptorControl control)
        {
            //Configure
            this.control = control;

            //Make data providers
            dpEnabled = new RaptorPrimitiveDataProvider<bool>(this, "Power")
                .BindOnChangedWorkerEvent(this, (bool power) =>
                {
                    //If the radio is already in the requested state, ignore
                    if (power == radioRunning)
                        return;

                    //Switch depending on the specified
                    if(power)
                    {
                        //Starting radio. Make sure that we have a source set
                        if (radioSource == null)
                            throw new RaptorWebException("No radio source set", "Pick a source before starting the radio.");

                        //Send start command to radio
                        RaptorWebException.TryCatchProtected(() => radioSource.Start(), Control, "Failed to start radio");

                        //Transfer some args
                        dpCenterFreq.Value = radioSource.CenterFreq;

                        //Update state
                        radioRunning = true;
                        WorkerConfigure();
                    } else
                    {
                        //Stopping radio. Send stop command to the source
                        RaptorWebException.TryCatchProtected(() => radioSource.Stop(), Control, "Failed to stop radio");

                        //Update state
                        radioRunning = false;
                    }
                });
            dpCenterFreq = new RaptorPrimitiveDataProvider<long>(this, "CenterFreq");
            dpSource = new RaptorSelectionDataProvider<IPluginSource>(this, "Source", control.PluginSources)
                .BindOnChangedWorkerEvent(this, (IPluginSource source) =>
                {
                    //If the radio is active, abort
                    if (radioRunning)
                        throw new RaptorWebException("Can't change source", "Stop the radio before changing the source.");

                    //Update
                    radioSource = source;
                });
        }

        //Public stuff
        public RaptorNamespace Id => control.Id.Then("Radio");
        public IRaptorControl Control => control;

        //Misc
        private RaptorControl control;

        //Data providers
        private RaptorPrimitiveDataProvider<bool> dpEnabled;
        private RaptorPrimitiveDataProvider<long> dpCenterFreq;
        private RaptorPrimitiveDataProvider<IPluginSource> dpSource;

        //Thread safe vars only to be modified by the worker thread
        private bool radioRunning = false;
        private IPluginSource radioSource;

        /// <summary>
        /// Reconfigures all settings
        /// </summary>
        private void WorkerConfigure()
        {

        }

        /// <summary>
        /// Continuously runs in the backgroud
        /// </summary>
        private void WorkerThread()
        {
            while(true)
            {
                //Process outstanding messages
                WorkerProcessCommands();

                //If the radio isn't running, sleep
                if (!radioRunning)
                {
                    Thread.Sleep(100);
                    continue;
                }

                Console.WriteLine("GOING");
                Thread.Sleep(100);
            }
        }
    }
}
