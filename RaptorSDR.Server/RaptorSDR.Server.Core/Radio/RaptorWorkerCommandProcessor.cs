using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.DataProviders;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Text;
using System.Threading;

namespace RaptorSDR.Server.Core.Radio
{
    public static class RaptorWorkerCommandProcessorHelpers
    {
        /// <summary>
        /// Wraps a thread event into a DataProvider, allowing you to perform thread safe commands
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="dataProvider"></param>
        /// <param name="action"></param>
        public static RaptorPrimitiveDataProvider<T> BindOnChangedWorkerEvent<T>(this RaptorPrimitiveDataProvider<T> dataProvider, RaptorWorkerCommandProcessor ctx, RaptorDataProvider_OnChangedEventArgs<T> action)
        {
            RaptorWorkerCommandProcessor.BindOnChangedWorkerEvent(dataProvider, ctx, action);
            return dataProvider;
        }
    }

    public class RaptorWorkerCommandProcessor
    {
        //Holds commands
        private ConcurrentQueue<RaptorThreadCommand> commands = new ConcurrentQueue<RaptorThreadCommand>();

        /// <summary>
        /// Queues a command to run on the worker command. This is always FIFO.
        /// </summary>
        /// <param name="action"></param>
        /// <returns></returns>
        protected RaptorThreadCommand QueueWorkerCommand(RaptorThreadCommand_Action action)
        {
            RaptorThreadCommand cmd = new RaptorThreadCommand(action);
            commands.Enqueue(cmd);
            return cmd;
        }

        /// <summary>
        /// Called by the worker thread, this will process all outstanding requests
        /// </summary>
        protected void WorkerProcessCommands()
        {
            while (commands.TryDequeue(out RaptorThreadCommand cmd))
                cmd.WorkerExecute();
        }

        protected delegate void RaptorThreadCommand_Action();
        protected class RaptorThreadCommand
        {
            public RaptorThreadCommand(RaptorThreadCommand_Action command)
            {
                this.command = command;
                waiter = new ManualResetEvent(false);
            }

            private RaptorThreadCommand_Action command;
            private ManualResetEvent waiter;

            internal void WorkerExecute()
            {
                command();
                waiter.Set();
            }

            public void Wait()
            {
                waiter.WaitOne();
            }
        }

        /// <summary>
        /// Helper function for data providers
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="dataProvider"></param>
        /// <param name="ctx"></param>
        /// <param name="action"></param>
        public static void BindOnChangedWorkerEvent<T>(RaptorPrimitiveDataProvider<T> dataProvider, RaptorWorkerCommandProcessor ctx, RaptorDataProvider_OnChangedEventArgs<T> action)
        {
            dataProvider.BindOnChanging((T value, IRaptorSession session) =>
            {
                ctx.QueueWorkerCommand(() =>
                {
                    action(value, session);
                });
            });
        }
    }
}
