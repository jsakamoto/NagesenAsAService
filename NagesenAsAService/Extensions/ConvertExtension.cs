using System;
using System.Collections.Generic;
using System.Linq;

namespace NagesenAsAService.Extensions
{
    public static class ConvertExtension
    {
        public static string ToBase64String(this IEnumerable<byte> bytes)
        {
            return Convert.ToBase64String(bytes.ToArray());
        }

        public static string ToBase64String(this Guid guid)
        {
            return guid.ToByteArray().ToBase64String();
        }
    }
}