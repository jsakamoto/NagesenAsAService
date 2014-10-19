using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace NagesenAsAService
{
    public static class CollectionExtension
    {
        public static IEnumerable<T> ToEnumerable<T>(this Random random, Func<Random, T> generator)
        {
            for (; ; )
            {
                yield return generator(random);
            }
        }

        public static IEnumerable<string> Except(this IEnumerable<string> first, params string[] seconds)
        {
            return Enumerable.Except(first, seconds);
        }
    }
}