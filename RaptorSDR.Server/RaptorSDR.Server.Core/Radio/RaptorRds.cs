using RaptorSDR.Server.Common;
using RaptorSDR.Server.Common.DataProviders;
using RomanPort.LibSDR.Components.Digital.RDS.Client;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Core.Radio
{
    public class RaptorRds : IRaptorContext
    {
        public RaptorRds(IRaptorContext parent, string id)
        {
            //Configure
            this.parent = parent;
            this.id = id;

            //Create client
            client = new RdsClient();

            //Create data providers
            dpRdsPi = new RaptorPrimitiveDataProvider<ushort>(this, "PiCode")
                .SetWebReadOnly(true);
            dpRdsPi.Value = client.PiCode.Value;
            client.PiCode.OnPiCodeChanged += (RdsClient c, ushort pi) => dpRdsPi.Value = pi;

            dpRdsPsBuffer = new RaptorPrimitiveDataProvider<string>(this, "PsBuffer")
                .SetWebReadOnly(true);
            dpRdsPsBuffer.Value = new string(client.ProgramService.PartialBuffer);
            client.ProgramService.OnPartialTextReceived += (RdsClient c, char[] data, int index) => dpRdsPsBuffer.Value = new string(data);

            dpRdsPsComplete = new RaptorPrimitiveDataProvider<string>(this, "PsComplete")
                .SetWebReadOnly(true);
            dpRdsPsComplete.Value = client.ProgramService.CompleteText;
            client.ProgramService.OnFullTextReceived += (RdsClient c, string data) => dpRdsPsComplete.Value = data;

            dpRdsRtBuffer = new RaptorPrimitiveDataProvider<string>(this, "RtBuffer")
                .SetWebReadOnly(true);
            dpRdsRtBuffer.Value = new string(client.RadioText.PartialBuffer);
            client.RadioText.OnPartialTextReceived += (RdsClient c, char[] data, int index) => dpRdsRtBuffer.Value = new string(data);

            dpRdsRtComplete = new RaptorPrimitiveDataProvider<string>(this, "RtComplete")
                .SetWebReadOnly(true);
            dpRdsRtComplete.Value = client.RadioText.CompleteText;
            client.RadioText.OnFullTextReceived += (RdsClient c, string data) => dpRdsRtComplete.Value = data;
        }

        private IRaptorContext parent;
        private string id;
        private RdsClient client;

        public RaptorNamespace Id => parent.Id.Then(id);
        public IRaptorControl Control => parent.Control;

        private RaptorPrimitiveDataProvider<ushort> dpRdsPi;
        private RaptorPrimitiveDataProvider<string> dpRdsPsBuffer;
        private RaptorPrimitiveDataProvider<string> dpRdsPsComplete;
        private RaptorPrimitiveDataProvider<string> dpRdsRtBuffer;
        private RaptorPrimitiveDataProvider<string> dpRdsRtComplete;

        public void SendRdsFrame(ulong frame)
        {
            client.ProcessFrame(frame);
        }
    }
}
