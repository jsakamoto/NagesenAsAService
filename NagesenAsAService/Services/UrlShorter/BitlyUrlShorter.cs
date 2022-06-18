using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace NagesenAsAService.Services.UrlShorter
{
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
            public string Link { get; set; }
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
                return result.Link;
            }
            catch (Exception e)
            {
                this.Logger.LogError(e, e.Message);
                return url;
            }
        }
    }
}
