using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using NagesenAsAService.Services.UrlShorter;
using NUnit.Framework;

namespace NagesenAsAService.Test;

public class BitlyUrlShorterTests
{
    [Test]
    public async Task ShortenUrlAsync_Test()
    {
        var services = new ServiceCollection().AddHttpClient().BuildServiceProvider();
        var configuration = new ConfigurationBuilder().AddUserSecrets<BitlyUrlShorterTests>().Build();

        var accessToken = configuration.GetValue<string>("Bitly:AccessToken", defaultValue: "");
        if (string.IsNullOrEmpty(accessToken)) Assert.Ignore("Please configure \"Bitly:AccessToken\" in your user secrets.");

        var urlShooter = new BitlyUrlShorter(configuration, services.GetRequiredService<IHttpClientFactory>(), NullLogger<BitlyUrlShorter>.Instance);
        var shortenUrl = await urlShooter.ShortenUrlAsync("https://naas.azurewebsites.net/");
        shortenUrl.Is("https://bit.ly/30TRiJt");
    }
}