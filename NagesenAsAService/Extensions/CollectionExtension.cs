namespace NagesenAsAService.Extensions;

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