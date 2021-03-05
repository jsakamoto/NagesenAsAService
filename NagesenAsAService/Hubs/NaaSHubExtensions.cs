using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using NagesenAsAService.Models;

namespace NagesenAsAService.Hubs
{
    public static class NaaSHubExtensions
    {
        private static Random _Random = new Random(DateTime.UtcNow.Millisecond);

        public static async Task Throw(this IHubContext<NaaSHub, INaaSHubEvents> naasHubContext, IRoomRepository repository, int roomNumber, CoinType typeOfCoin)
        {
            await naasHubContext.Clients.Throw(repository, roomNumber, typeOfCoin);
        }

        public static async Task Throw(this IHubClients<INaaSHubEvents> clients, IRoomRepository repository, int roomNumber, CoinType typeOfCoin)
        {
            var room = await repository.UpdateRoomAsync(roomNumber, r =>
            {
                if (typeOfCoin == CoinType.Like)
                {
                    r.CountOfNageSen += 10;
                }
                else
                {
                    r.CountOfAoriSen += 10;
                }
                return true;
            });

            var countOfCoin = new { room.CountOfNageSen, room.CountOfAoriSen };

            var throwPoint = default(double);
            lock (_Random) throwPoint = _Random.NextDouble();
            var data = new
            {
                throwPoint,
                typeOfCoin,
                countOfLike = countOfCoin.CountOfNageSen,
                countOfDis = countOfCoin.CountOfAoriSen
            };
            await clients.Group(roomNumber.ToString()).Throw(data);
        }
    }
}
