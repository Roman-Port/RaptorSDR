using HtmlAgilityPack;
using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;

namespace RdsPiChartGenerator
{
    class Program
    {
        static void Main(string[] args)
        {
            int count = 0;
            using(FileStream fs = new FileStream("PICODE_NORTH_AMERICA.bin", FileMode.Create))
            {
                ProcessPage(fs, "https://picodes.nrscstandards.org/fs_pi_codes_allocated.html", ref count);
                ProcessPage(fs, "https://picodes.nrscstandards.org/pi_codes_allocated.html", ref count);
            }
            Console.WriteLine("Processed " + count);
        }

        static readonly string[] STATE_MAP = new string[] {"AL", "AK", "AS", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FM", "FL", "GA", "GU", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MH", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "MP", "OH", "OK", "OR", "PW", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VI", "VA", "WA", "WV", "WI", "WY"};

        static void ProcessPage(Stream output, string url, ref int count)
        {
            //Download document
            var web = new HtmlWeb();
            var doc = web.Load(url);

            //Get table
            var table = doc.DocumentNode.Descendants("tbody").FirstOrDefault();

            //Begin writing out lines
            byte[] buffer = new byte[4096];
            foreach(var r in table.ChildNodes)
            {
                //Validate
                if (r.Name != "tr")
                    continue;

                //Get non-text nodes
                var nodes = r.ChildNodes.Where(n => n.NodeType != HtmlNodeType.Text).ToList();

                //Gather info
                string callsign = HttpUtility.HtmlDecode(nodes[0].InnerText);
                string pi = HttpUtility.HtmlDecode(nodes[1].InnerText);
                string fac = HttpUtility.HtmlDecode(nodes[3].InnerText);
                string city = HttpUtility.HtmlDecode(nodes[4].InnerText);
                string state = HttpUtility.HtmlDecode(nodes[5].InnerText);
                string loc = HttpUtility.HtmlDecode(nodes[6].InnerText);

                //Parse info
                int facilityId = int.Parse(fac);
                ushort piCode = Convert.ToUInt16(pi, 16);
                int stateIndex = Array.IndexOf(STATE_MAP, state);
                if (stateIndex == -1)
                    throw new Exception("Unknown state: " + state);

                //Do extra parsing on the location
                float lon = ConvertLoc(loc.Split('\n')[1]);
                float lat = ConvertLoc(loc.Split('\n')[2]);

                //Begin writing to buffer
                int offset = 1;
                EncodeNumber(buffer, piCode, 2, ref offset);
                EncodeString(buffer, callsign, ref offset);
                EncodeString(buffer, city, ref offset);
                buffer[offset++] = (byte)stateIndex;
                EncodeNumber(buffer, facilityId, 3, ref offset);
                EncodeNumber(buffer, lon, sizeof(float), ref offset);
                EncodeNumber(buffer, lat, sizeof(float), ref offset);

                //Write length
                if (offset > byte.MaxValue)
                    throw new Exception("Too much data in single entry!");
                buffer[0] = (byte)offset;

                //Write buffer to file
                output.Write(buffer, 0, offset);

                //Update count
                count++;
            }
        }

        static float ConvertLoc(string input)
        {
            string[] segments = input.Split(' ');
            float degrees = float.Parse(segments[segments.Length - 4].Trim('°'));
            float minutes = float.Parse(segments[segments.Length - 3].Trim('\''));
            float seconds = float.Parse(segments[segments.Length - 2].Trim('"'));
            float d = degrees + (minutes / 60) + (seconds / 3600);
            if (segments[segments.Length - 1] == "W" || segments[segments.Length - 1] == "S")
                d = -d;
            return d;
        }

        static void EncodeString(byte[] buffer, string text, ref int offset)
        {
            int len = Encoding.ASCII.GetBytes(text, 0, Math.Min(text.Length, byte.MaxValue), buffer, offset + 1);
            buffer[offset++] = (byte)len;
            offset += len;
        }

        static unsafe void EncodeNumber<T>(byte[] buffer, T value, int size, ref int offset) where T: unmanaged
        {
            byte* ptr = (byte*)&value;
            for (int i = 0; i < size; i++)
                buffer[offset++] = (byte)((i >= sizeof(T)) ? 0x00 : ptr[i]);
        }
    }
}
