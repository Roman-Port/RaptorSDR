using System;
using System.Collections.Generic;
using System.Text;

namespace RomanPort.Recorder.Tests
{
    public unsafe static class TestUtils
    {
        public static void Next(this Random rand, int* ptr, int count)
        {
            for (int i = 0; i < count; i++)
                ptr[i] = rand.Next();
        }

        public static bool Compare<T>(T* a, T* b, int count) where T : unmanaged
        {
            bool ok = true;
            for (int i = 0; i < count; i++)
                ok = ok && a[i].Equals(b[i]);
            return ok;
        }
    }
}
