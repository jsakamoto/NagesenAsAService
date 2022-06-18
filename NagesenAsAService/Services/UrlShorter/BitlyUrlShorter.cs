using System.Net.Http.Headers;

namespace NagesenAsAService.Services.UrlShorter;

public class BitlyUrlShorter : IUrlShorter
{
    private IConfiguration Configuration { get; }

    private IHttpClientFactory HttpClientFactory { get; }

    private ILogger<BitlyUrlShorter> Logger { get; }

    public BitlyUrlShorter(
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<BitlyUrlShorter> logger)
    {
        this.Configuration = configuration;
        this.HttpClientFactory = httpClientFactory;
        this.Logger = logger;
    }

    private class BitlyShortenAPIResponse
    {
        public string? Link { get; set; }
    }

    public async Task<string> ShortenUrlAsync(string url)
    {
        try
        {
            var accessToken = this.Configuration.GetValue<string>("Bitly:AccessToken", defaultValue: "");
            if (string.IsNullOrEmpty(accessToken)) return url;

            var httpClient = this.HttpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            var res = await httpClient.PostAsJsonAsync("https://api-ssl.bitly.com/v4/shorten", new
            {
                Domain = "bit.ly",
                Long_url = url
            });

            res.EnsureSuccessStatusCode();
            var result = await res.Content.ReadFromJsonAsync<BitlyShortenAPIResponse>();
            if (result == null || result.Link == null) throw new Exception("The response from bit.ly is null or does not include 'link'.");

            return result.Link;
        }
        catch (Exception e)
        {
            this.Logger.LogError(e, e.Message);
            return url;
        }
    }
}
