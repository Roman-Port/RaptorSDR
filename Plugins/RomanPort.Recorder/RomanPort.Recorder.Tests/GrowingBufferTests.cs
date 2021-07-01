using RomanPort.LibSDR.Components;
using RomanPort.Recorder.Buffers;
using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.Recorder.Tests
{
    static unsafe class GrowingBufferTests
    {
        public static void Test()
        {
            Program.RunTest("Initial Size", TestInitialSize);
            Program.RunTest("Growing Size", TestGrowingSize);
        }

        const int RANDOM_SEED = 1330530628;

        private static bool TestInitialSize(TestContext ctx)
        {
            //Create buffer
            int bufferSize = 65536;
            int bufferOperationSize = bufferSize / 3;
            RecorderGrowingBuffer<int> testBuffer = new RecorderGrowingBuffer<int>(bufferSize);

            //Create random generators that we'll use to test patterns
            Random randA = new Random(RANDOM_SEED);
            Random randB = new Random(RANDOM_SEED);

            //Create operation buffers
            UnsafeBuffer opBufferA = UnsafeBuffer.Create(bufferOperationSize, out int* opPtrA);
            UnsafeBuffer opBufferB = UnsafeBuffer.Create(bufferOperationSize, out int* opPtrB);

            //Run
            ctx.Start();
            for(int i = 0; i<500; i++)
            {
                //Write
                randA.Next(opPtrA, bufferOperationSize);
                testBuffer.Write(opPtrA, bufferOperationSize);

                //Write
                randA.Next(opPtrA, bufferOperationSize);
                testBuffer.Write(opPtrA, bufferOperationSize);

                //Read
                randB.Next(opPtrB, bufferOperationSize);
                if (testBuffer.Read(opPtrA, bufferOperationSize) != bufferOperationSize)
                    return ctx.EndIfFail("Read 1 did not read expected number of bytes.", false);
                if (!TestUtils.Compare(opPtrA, opPtrB, bufferOperationSize))
                    return ctx.EndIfFail("Read 1 did not match expected value!", false);

                //Read
                randB.Next(opPtrB, bufferOperationSize);
                if (testBuffer.Read(opPtrA, bufferOperationSize) != bufferOperationSize)
                    return ctx.EndIfFail("Read 2 did not read expected number of bytes.", false);
                if (!TestUtils.Compare(opPtrA, opPtrB, bufferOperationSize))
                    return ctx.EndIfFail("Read 2 did not match expected value!", false);

                //Try to read again. We should get nothing
                if (testBuffer.Read(opPtrA, bufferOperationSize) != 0)
                    return ctx.EndIfFail("Read that was supposed to return 0 bytes instead returned more!", false);
            }

            ctx.End("OK");
            return true;
        }

        private static bool TestGrowingSize(TestContext ctx)
        {
            //Create buffer
            int bufferSize = 65536;
            int bufferOperationSize = bufferSize / 3;
            RecorderGrowingBuffer<int> testBuffer = new RecorderGrowingBuffer<int>(bufferSize);

            //Create random generators that we'll use to test patterns
            Random randA = new Random(RANDOM_SEED);
            Random randB = new Random(RANDOM_SEED);

            //Create operation buffers
            UnsafeBuffer opBufferA = UnsafeBuffer.Create(bufferOperationSize, out int* opPtrA);
            UnsafeBuffer opBufferB = UnsafeBuffer.Create(bufferOperationSize, out int* opPtrB);

            //Write a bunch
            ctx.Start();
            int neededReads = 5000;
            for (int i = 0; i < 5000; i++)
            {
                //Write
                randA.Next(opPtrA, bufferOperationSize);
                testBuffer.Write(opPtrA, bufferOperationSize);

                //Occasinally read back some
                if(i % 10 == 0)
                {
                    randB.Next(opPtrB, bufferOperationSize);
                    if (testBuffer.Read(opPtrA, bufferOperationSize) != bufferOperationSize)
                        return ctx.EndIfFail("Read during write did not read expected number of bytes.", false);
                    if (!TestUtils.Compare(opPtrA, opPtrB, bufferOperationSize))
                        return ctx.EndIfFail("Read during write did not match expected value!", false);
                    neededReads--;
                }
            }

            //Read back everything
            while(neededReads > 0)
            {
                randB.Next(opPtrB, bufferOperationSize);
                if (testBuffer.Read(opPtrA, bufferOperationSize) != bufferOperationSize)
                    return ctx.EndIfFail("Read post-write did not read expected number of bytes.", false);
                if (!TestUtils.Compare(opPtrA, opPtrB, bufferOperationSize))
                    return ctx.EndIfFail("Read post-write did not match expected value!", false);
                neededReads--;
            }

            //Try to read again. We should get nothing
            if (testBuffer.Read(opPtrA, bufferOperationSize) != 0)
                return ctx.EndIfFail("Read that was supposed to return 0 bytes instead returned more!", false);

            ctx.End("OK");
            return true;
        }
    }
}
