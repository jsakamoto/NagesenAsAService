using System;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NagesenAsAService.Extensions;
using Newtonsoft.Json.Linq;

namespace NagesenAsAService.Services.UrlShorter
{
    public class BitlyUrlShorter : IUrlShorter
    {
        private enum StatusType
        {
            NotInitialized,
            Available,
            NotAvailable
        }

        private StatusType Status { get; set; } = StatusType.NotInitialized;

        private string AccessToken { get; set; } = "";

        private IConfiguration Configuration { get; }

        private ILogger<BitlyUrlShorter> Logger { get; }

        public BitlyUrlShorter(IConfiguration configuration, ILogger<BitlyUrlShorter> logger)
        {
            this.Configuration = configuration;
            this.Logger = logger;
        }

        private StatusType TryToActivate()
        {
            lock (this)
            {
                if (this.Status != StatusType.NotInitialized) return this.Status;

                // Retrieve Bitly account user name and password.
                var bitlyAccount = new NetworkCredential();
                this.Configuration.GetSection("Bitly:Account").Bind(bitlyAccount);
                if (string.IsNullOrEmpty(bitlyAccount.UserName) || string.IsNullOrEmpty(bitlyAccount.Password))
                {
                    this.Status = StatusType.NotAvailable;
                    return this.Status;
                }

                // Exchange Bitly account user name and password to access token.
                var wc = new WebClient { Encoding = Encoding.UTF8 };
                wc.Headers.Add(HttpRequestHeader.Authorization, "Basic " + (bitlyAccount.UserName + ":" + bitlyAccount.Password).ToBase64());
                try
                {
                    var response = wc.UploadString("https://api-ssl.bitly.com/oauth/access_token", method: "POST", data: "");
                    if (response.StartsWith("{"))
                    {
                        this.Status = StatusType.NotAvailable;
                        return this.Status;
                    }
                    this.AccessToken = response;
                }
                catch (Exception)
                {
                    this.Status = StatusType.NotAvailable;
                    return this.Status;
                }

                this.Status = StatusType.Available;
                return this.Status;
            }
        }

        public Task WarmUpAsync()
        {
            var status = this.TryToActivate();
            return Task.CompletedTask;
        }

        public Task<string> ShortenUrlAsync(string url)
        {
            var status = this.TryToActivate();
            if (status != StatusType.Available) return Task.FromResult(url);

            var wc = new WebClient { Encoding = Encoding.UTF8 };
            var resultJson = wc.DownloadString(
                "https://api-ssl.bitly.com/v3/shorten?access_token={0}&longUrl={1}"
                .FormatBy(this.AccessToken, HttpUtility.UrlEncode(url)));
            var result = (dynamic)JObject.Parse(resultJson);
            var statusCode = (int)result.status_code;
            if (statusCode != 200)
            {
                this.Logger.LogWarning($"Bitly server reply non 200 status ({statusCode}). ({resultJson})");
                return Task.FromResult(url);
            }
            var shortUrl = (string)result.data.url;
            return Task.FromResult(shortUrl);
        }
    }
}
