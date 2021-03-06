using System;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NagesenAsAService.Services.RoomRepository;
using NagesenAsAService.Services.UrlShorter;

namespace NagesenAsAService.Extensions.DependencyInjection
{
    public static class NaaSServiceCollectionExtensions
    {
        public static IServiceCollection AddNaaSRoomRepository(this IServiceCollection services, IConfiguration configuration)
        {
            var typeOfRoomRepository = Type.GetType(configuration["NaaS:Services:RoomRepository"] ?? "NagesenAsAService.Services.RoomRepository.AzureTableRoomRepository");
            services.AddSingleton(typeof(IRoomRepository), typeOfRoomRepository);
            return services;
        }

        public static IServiceCollection AddNaaSUrlShorter(this IServiceCollection services, IConfiguration configuration)
        {
            var typeOfUrlShorter = Type.GetType(configuration["NaaS:Services:UrlShorter"] ?? "NagesenAsAService.Services.UrlShorter.BitlyUrlShorter");
            services.AddSingleton(typeof(IUrlShorter), typeOfUrlShorter);
            return services;
        }
    }
}
