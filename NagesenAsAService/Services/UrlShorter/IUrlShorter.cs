using System.Threading.Tasks;

namespace NagesenAsAService.Services.UrlShorter
{
    public interface IUrlShorter
    {
        Task<string> ShortenUrlAsync(string url);
    }
}
