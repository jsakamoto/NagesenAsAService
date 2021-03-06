using System.Threading.Tasks;

namespace NagesenAsAService.Services.UrlShorter
{
    public class NoopUrlShorter : IUrlShorter
    {
        public Task WarmUpAsync()
        {
            // NOP
            return Task.CompletedTask;
        }

        public Task<string> ShortenUrlAsync(string url)
        {
            return Task.FromResult(url);
        }
    }
}
