using RaptorSDR.Server.Common;
using System;
using System.Collections.Generic;
using System.Text;

namespace RaptorSDR.Server.Core.Serialization
{
    static class DeserializeUtil
    {
        private static unsafe T HelperDeserializeUnmanagedType<T>(byte[] buffer, ref int offset) where T : unmanaged
        {
            T value;
            byte* valuePtr = (byte*)&value;
            for (int i = 0; i < sizeof(T); i++)
                valuePtr[i] = buffer[offset++];
            return value;
        }

        private static unsafe T[] HelperDeserializeUnmanagedArrayType<T>(byte[] buffer, ref int offset) where T : unmanaged
        {
            int count = HelperDeserializeUnmanagedType<int>(buffer, ref offset);
            int len = count * sizeof(T);
            T[] value = new T[count];
            fixed(T* valuePtr = value)
            {
                byte* valuePtrByte = (byte*)valuePtr;
                for (int i = 0; i < len; i++)
                    valuePtrByte[i] = buffer[offset++];
            }
            return value;
        }

        public static object DeserializeProperty(byte[] buffer, ref int offset, RaptorGroupPropertyType type)
        {
            switch (type)
            {
                case RaptorGroupPropertyType.INVALID:
                    throw new Exception("Encountered invalid type!");

                case RaptorGroupPropertyType.BYTE:
                    return buffer[offset++];
                case RaptorGroupPropertyType.SHORT:
                    return HelperDeserializeUnmanagedType<short>(buffer, ref offset);
                case RaptorGroupPropertyType.INT:
                    return HelperDeserializeUnmanagedType<int>(buffer, ref offset);
                case RaptorGroupPropertyType.LONG:
                    return HelperDeserializeUnmanagedType<long>(buffer, ref offset);
                case RaptorGroupPropertyType.STRING:
                    {
                        int strLen = HelperDeserializeUnmanagedType<int>(buffer, ref offset);
                        offset += strLen;
                        return Encoding.UTF8.GetString(buffer, offset - strLen, strLen);
                    }
                case RaptorGroupPropertyType.GROUP:
                    {
                        var group = new RaptorGroup();
                        group.DeserializePayload(buffer, ref offset);
                        return group;
                    }

                case RaptorGroupPropertyType.ARRAY_BYTE:
                    return HelperDeserializeUnmanagedArrayType<byte>(buffer, ref offset);
                case RaptorGroupPropertyType.ARRAY_SHORT:
                    return HelperDeserializeUnmanagedArrayType<short>(buffer, ref offset);
                case RaptorGroupPropertyType.ARRAY_INT:
                    return HelperDeserializeUnmanagedArrayType<int>(buffer, ref offset);
                case RaptorGroupPropertyType.ARRAY_LONG:
                    return HelperDeserializeUnmanagedArrayType<long>(buffer, ref offset);
                case RaptorGroupPropertyType.ARRAY_STRING:
                    {
                        int count = HelperDeserializeUnmanagedType<int>(buffer, ref offset);
                        string[] value = new string[count];
                        for (int i = 0; i < count; i++)
                        {
                            int strLen = HelperDeserializeUnmanagedType<int>(buffer, ref offset);
                            offset += strLen;
                            value[i] = Encoding.UTF8.GetString(buffer, offset - strLen, strLen);
                        }
                        return value;
                    }
                case RaptorGroupPropertyType.ARRAY_GROUP:
                    {
                        int count = HelperDeserializeUnmanagedType<int>(buffer, ref offset);
                        RaptorGroup[] value = new RaptorGroup[count];
                        for(int i = 0; i<count; i++)
                        {
                            value[i] = new RaptorGroup();
                            value[i].DeserializePayload(buffer, ref offset);
                        }
                        return value;
                    }

                default: throw new NotImplementedException();
            }
        }
    }
}
