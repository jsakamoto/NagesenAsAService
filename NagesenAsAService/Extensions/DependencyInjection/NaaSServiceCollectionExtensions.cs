using NagesenAsAService.Services.RoomRepository;
using NagesenAsAService.Services.UrlShorter;

namespace NagesenAsAService.Extensions.DependencyInjection;

public static class NaaSServiceCollectionExtensions
{
    public static IServiceCollection AddNaaSRoomRepository(this IServiceCollection services, IConfiguration configuration)
    {
        var typeOfRoomRepository = Type.GetType(configuration["NaaS:Services:RoomRepository"] ?? "NagesenAsAService.Services.RoomRepository.AzureTableRoomRepository");
        if (typeOfRoomRepository == null) throw new Exception("Invalid type of room repository was specified in NaaS:Services:RoomRepository configuraion.");
        services.AddSingleton(typeof(IRoomRepository), typeOfRoomRepository);
        return services;
    }

    public static IServiceCollection AddNaaSUrlShorter(this IServiceCollection services, IConfiguration configuration)
    {
        var typeOfUrlShorter = Type.GetType(configuration["NaaS:Services:UrlShorter"] ?? "NagesenAsAService.Services.UrlShorter.BitlyUrlShorter");
        if (typeOfUrlShorter == null) throw new Exception("Invalid type of url shorter was specified in NagesenAsAService.Services.UrlShorter.BitlyUrlShorter configuraion.");
        services.AddSingleton(typeof(IUrlShorter), typeOfUrlShorter);
        return services;
    }
}
