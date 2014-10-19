using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace NagesenAsAService
{
    public static class StringExtension
    {
        public static bool IsNullOrEmpty(this string value)
        {
            return String.IsNullOrEmpty(value);
        }

        public static string ToBase64(this string value, Encoding encoding = null)
        {
            encoding = encoding ?? Encoding.UTF8;
            return Convert.ToBase64String(encoding.GetBytes(value));
        }

        public static string FormatBy(this string format, params object[] args)
        {
            return global::System.String.Format(format, args);
        }

        public static T FromJson<T>(this string value)
        {
            if (value.IsNullOrEmpty()) return default(T);
            return JsonConvert.DeserializeObject<T>(value);
        }
    }
}