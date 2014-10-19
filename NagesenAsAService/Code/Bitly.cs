using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Web;
using System.Web.Caching;
using Newtonsoft.Json.Linq;

namespace NagesenAsAService
{
    public class Bitly
    {
        public enum StatusType
        {
            NotInitialized,
            Available,
            NotAvailable
        }

        public StatusType Status { get; set; }

        public string AccessToken { get; protected set; }

        public static Bitly Default
        {
            get
            {
                var cache = HttpContext.Current.Cache;
                var bitly = default(Bitly);
                lock (cache)
                {
                    bitly = cache.Get("Bitly") as Bitly;
                    if (bitly == null)
                    {
                        bitly = new Bitly();
                        cache.Add("Bitly", bitly, null, Cache.NoAbsoluteExpiration, TimeSpan.FromDays(1), CacheItemPriority.Normal, null);
                    }
                }
                bitly.TryToActivate();
                return bitly;
            }
        }

        private StatusType TryToActivate()
        {
            lock (this)
            {
                // Retrieve Bitly account user name and password.
                if (this.Status != Bitly.StatusType.NotInitialized) return this.Status;
                var bitlyAccount = AppSettings.Account.Bitly.FromJson<NetworkCredential>();
                if (bitlyAccount == null)
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

        public string ShortenUrl(string url)
        {
            var status = this.TryToActivate();
            if (status != StatusType.Available) return null;

            var wc = new WebClient { Encoding = Encoding.UTF8 };
            var resultJson = wc.DownloadString(
                "https://api-ssl.bitly.com/v3/shorten?access_token={0}&longUrl={1}"
                .FormatBy(this.AccessToken, HttpUtility.UrlEncode(url)));
            var result = (dynamic)JObject.Parse(resultJson);
            if ((int)result.status_code != 200)
            {
                return null;
            }
            var shortUrl = (string)result.data.url;
            return shortUrl;
        }
    }
}