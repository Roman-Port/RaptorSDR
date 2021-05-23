using RaptorSDR.Server.Common;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Core.Serialization
{
    static class SerializeUtil
    {
        private const byte HEADER_MAGIC_UPPER = (byte)'R';
        private const byte HEADER_MAGIC_LOWER = (byte)'G';
        private const byte HEADER_VERSION = 1;

        private const int MAX_VALUES = byte.MaxValue;

        public static int GetSerializedLength(this RaptorGroup group)
        {
            int len = 4;
            foreach (var v in group)
            {
                len += Encoding.ASCII.GetByteCount(v.Key) + 1;
                len += SerializePropertyLength(v.Value) + 1;
            }
            return len;
        }

        public static byte[] Serialize(this RaptorGroup group)
        {
            byte[] payload = new byte[group.GetSerializedLength()];
            int offset = 0;
            group.SerializePayload(payload, ref offset);
            if (payload.Length != offset)
                throw new Exception($"Length calculation failed somewhere! Expected {payload.Length} bytes written, got {offset}! This is a bug, please report it.");
            return payload;
        }

        public static void Deserialize(this RaptorGroup group, byte[] payload)
        {
            int offset = 0;
            group.DeserializePayload(payload, ref offset);
            if (payload.Length != offset)
                throw new Exception($"Deserialization missed something! Expected {payload.Length} bytes read, got {offset}! This is a bug, please report it.");
        }

        public static void SerializePayload(this RaptorGroup group, byte[] payload, ref int offset)
        {
            //Validate
            if (group.Count > MAX_VALUES)
                throw new Exception($"Too many values in group! At max, groups can have {MAX_VALUES} values.");

            //Write header
            payload[offset++] = HEADER_MAGIC_UPPER;
            payload[offset++] = HEADER_MAGIC_LOWER;
            payload[offset++] = HEADER_VERSION;
            payload[offset++] = (byte)group.Count;

            //Write each value
            foreach (var v in group)
            {
                //Write key and null terminator
                offset += Encoding.ASCII.GetBytes(v.Key, 0, v.Key.Length, payload, offset);
                payload[offset++] = 0x00;

                //Write type
                if (v.Value == null)
                    payload[offset++] = (byte)RaptorGroupPropertyType.NULL;
                else
                    payload[offset++] = (byte)SerializeUtil.GetPropertyType(v.Value.GetType());

                //Write payload
                SerializeUtil.SerializePropertyPayload(payload, ref offset, v.Value);
            }
        }

        public static void DeserializePayload(this RaptorGroup group, byte[] payload, ref int offset)
        {
            //Read header
            if (payload[offset++] != HEADER_MAGIC_UPPER || payload[offset++] != HEADER_MAGIC_LOWER)
                throw new Exception($"Invalid group headers found. Either this is not a group, or reading previously in the file is bad. Offset={offset}");

            //Validate version
            byte version = payload[offset++];
            if (version != HEADER_VERSION)
                throw new Exception($"Unsupported version {version}! Only version {HEADER_VERSION} is supported.");

            //Get the count
            int count = payload[offset++];

            //Loop through count
            for (int i = 0; i < count; i++)
            {
                //Find null terminator to get length
                int keyLen = 0;
                while (payload[offset + keyLen] != 0x00)
                    keyLen++;

                //Read key
                string key = Encoding.ASCII.GetString(payload, offset, keyLen);
                offset += keyLen + 1;

                //Read type
                RaptorGroupPropertyType type = (RaptorGroupPropertyType)payload[offset++];

                //Read payload
                object value = DeserializeUtil.DeserializeProperty(payload, ref offset, type);

                //Add
                group.Add(key, value);
            }
        }

        public static RaptorGroupPropertyType GetPropertyType(Type type)
        {
            //Arrays
            if (type == typeof(byte[]) || type == typeof(sbyte[]))
                return RaptorGroupPropertyType.BYTE;
            if (type == typeof(short[]) || type == typeof(ushort[]))
                return RaptorGroupPropertyType.STRING;
            if (type == typeof(int[]) || type == typeof(uint[]))
                return RaptorGroupPropertyType.INT;
            if (type == typeof(long[]) || type == typeof(ulong[]))
                return RaptorGroupPropertyType.LONG;
            if (type == typeof(string[]))
                return RaptorGroupPropertyType.STRING;
            if (type == typeof(RaptorGroup[]))
                return RaptorGroupPropertyType.GROUP;

            //Single
            if (type == typeof(byte) || type == typeof(sbyte))
                return RaptorGroupPropertyType.BYTE;
            if (type == typeof(short) || type == typeof(ushort))
                return RaptorGroupPropertyType.STRING;
            if (type == typeof(int) || type == typeof(uint))
                return RaptorGroupPropertyType.INT;
            if (type == typeof(long) || type == typeof(ulong))
                return RaptorGroupPropertyType.LONG;
            if (type == typeof(string))
                return RaptorGroupPropertyType.STRING;
            if (type == typeof(RaptorGroup))
                return RaptorGroupPropertyType.GROUP;

            //Bad
            return RaptorGroupPropertyType.INVALID;
        }

        public static int SerializePropertyLength(object prop)
        {
            //If null, set to null
            if (prop == null)
                return 0;
            
            //Get the type
            Type type = prop.GetType();

            //Switch on property
            switch (GetPropertyType(type))
            {
                case RaptorGroupPropertyType.INVALID: throw new Exception($"Property is not a supported type!");

                case RaptorGroupPropertyType.BYTE: return sizeof(byte);
                case RaptorGroupPropertyType.SHORT: return sizeof(short);
                case RaptorGroupPropertyType.INT: return sizeof(int);
                case RaptorGroupPropertyType.LONG: return sizeof(long);
                case RaptorGroupPropertyType.STRING: return Encoding.UTF8.GetByteCount((string)prop) + 4;
                case RaptorGroupPropertyType.GROUP: return ((RaptorGroup)prop).GetSerializedLength();

                case RaptorGroupPropertyType.ARRAY_BYTE: return (sizeof(byte) * ((byte[])prop).Length) + 4;
                case RaptorGroupPropertyType.ARRAY_SHORT: return (sizeof(short) * ((short[])prop).Length) + 4;
                case RaptorGroupPropertyType.ARRAY_INT: return (sizeof(int) * ((int[])prop).Length) + 4;
                case RaptorGroupPropertyType.ARRAY_LONG: return (sizeof(long) * ((long[])prop).Length) + 4;
                case RaptorGroupPropertyType.ARRAY_STRING: return HelperCalculateDynamicArrayLength((string[])prop, (string v) => Encoding.UTF8.GetByteCount(v) + 4);
                case RaptorGroupPropertyType.ARRAY_GROUP: return HelperCalculateDynamicArrayLength((RaptorGroup[])prop, (RaptorGroup v) => v.GetSerializedLength());

                default: throw new NotImplementedException();
            }
        }

        private static int HelperCalculateDynamicArrayLength<T>(T[] arr, Func<T, int> calc)
        {
            int len = 4;
            foreach (var a in arr)
                len += calc(a);
            return len;
        }

        private static unsafe void HelperConvertUnmanagedType<T>(byte[] buffer, ref int offset, T data) where T : unmanaged
        {
            byte* ptr = (byte*)&data;
            for (int i = 0; i < sizeof(T); i++)
                buffer[offset++] = ptr[i];
        }

        private static unsafe void HelperConvertUnmanagedArrayType<T>(byte[] buffer, ref int offset, T[] data) where T : unmanaged
        {
            HelperConvertUnmanagedType(buffer, ref offset, (int)data.Length);
            int size = sizeof(T);
            T temp;
            byte* ptr = (byte*)&temp;
            for (int i = 0; i<data.Length; i++)
            {
                temp = data[i];
                for (int b = 0; b < size; b++)
                    buffer[offset++] = ptr[b];
            }
        }

        public static void SerializePropertyPayload(byte[] buffer, ref int offset, object prop)
        {
            //If null, do nothing
            if (prop == null)
                return;
            
            //Get the type
            Type type = prop.GetType();
            var groupType = GetPropertyType(type);

            //Switch on property
            switch (groupType)
            {
                case RaptorGroupPropertyType.INVALID: throw new Exception($"Property is not a supported type!");

                case RaptorGroupPropertyType.BYTE:
                    buffer[offset++] = (byte)prop;
                    break;
                case RaptorGroupPropertyType.SHORT:
                    HelperConvertUnmanagedType(buffer, ref offset, (short)prop);
                    break;
                case RaptorGroupPropertyType.INT:
                    HelperConvertUnmanagedType(buffer, ref offset, (int)prop);
                    break;
                case RaptorGroupPropertyType.LONG:
                    HelperConvertUnmanagedType(buffer, ref offset, (long)prop);
                    break;
                case RaptorGroupPropertyType.STRING:
                    {
                        int strLen = Encoding.UTF8.GetBytes((string)prop, 0, ((string)prop).Length, buffer, offset + 4);
                        HelperConvertUnmanagedType(buffer, ref offset, strLen);
                        offset += strLen;
                    }
                    break;
                case RaptorGroupPropertyType.GROUP:
                    ((RaptorGroup)prop).SerializePayload(buffer, ref offset);
                    break;

                case RaptorGroupPropertyType.ARRAY_BYTE:
                    HelperConvertUnmanagedArrayType(buffer, ref offset, (byte[])prop);
                    break;
                case RaptorGroupPropertyType.ARRAY_SHORT:
                    HelperConvertUnmanagedArrayType(buffer, ref offset, (short[])prop);
                    break;
                case RaptorGroupPropertyType.ARRAY_INT:
                    HelperConvertUnmanagedArrayType(buffer, ref offset, (int[])prop);
                    break;
                case RaptorGroupPropertyType.ARRAY_LONG:
                    HelperConvertUnmanagedArrayType(buffer, ref offset, (long[])prop);
                    break;
                case RaptorGroupPropertyType.ARRAY_STRING:
                    {
                        string[] bufStr = (string[])prop;
                        HelperConvertUnmanagedType(buffer, ref offset, (int)bufStr.Length);
                        foreach (var s in bufStr)
                        {
                            int strLen = Encoding.UTF8.GetBytes(s, 0, s.Length, buffer, offset + 4);
                            HelperConvertUnmanagedType(buffer, ref offset, strLen);
                            offset += strLen;
                        }
                    }
                    break;
                case RaptorGroupPropertyType.ARRAY_GROUP:
                    {
                        RaptorGroup[] bufGroup = (RaptorGroup[])prop;
                        HelperConvertUnmanagedType(buffer, ref offset, (int)bufGroup.Length);
                        foreach (var s in bufGroup)
                        {
                            s.SerializePayload(buffer, ref offset);
                        }
                    }
                    break;

                default: throw new NotImplementedException();
            }
        }
    }
}
