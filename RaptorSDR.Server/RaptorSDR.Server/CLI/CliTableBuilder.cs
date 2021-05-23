using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.CLI
{
    public class CliTableBuilder
    {
        public CliTableBuilder(params string[] headers)
        {
            lengths = new int[headers.Length];
            data = new List<string[]>();
            AddRow(headers);
        }

        private int[] lengths;
        private List<string[]> data;

        public void AddRow(params string[] values)
        {
            //Validate
            if (values.Length != lengths.Length)
                throw new Exception("Every entry must have the same number of columns!");

            //Push to data
            data.Add(values);

            //Calculate max lengths
            for (int i = 0; i < values.Length; i++)
                lengths[i] = Math.Max(lengths[i], values[i].Length);
        }

        public void Print()
        {
            //Print headers in opposite palette
            SwapPalette();
            PrintRow(0);
            SwapPalette();

            //Write the rest of the table
            for (int i = 1; i < data.Count; i++)
                PrintRow(i);
        }

        private void SwapPalette()
        {
            ConsoleColor swap = Console.ForegroundColor;
            Console.ForegroundColor = Console.BackgroundColor;
            Console.BackgroundColor = swap;
        }

        private void PrintRow(int index)
        {
            for(int i = 0; i<lengths.Length; i++)
            {
                //Fetch
                string text = data[index][i];

                //Print padding
                int padding = lengths[i] - text.Length;
                for (int j = 0; j < padding; j++)
                    Console.Write(" ");

                //Print text
                Console.Write(" ");
                Console.Write(text);
                Console.Write(" ");

                //Write character between rows
                if (i != lengths.Length - 1)
                    Console.Write("|");
            }
            Console.Write("\n");
        }
    }
}
