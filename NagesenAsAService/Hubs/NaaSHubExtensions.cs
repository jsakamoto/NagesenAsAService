using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using NagesenAsAService.Models;

namespace NagesenAsAService.Hubs
{
    public static class NaaSHubExtensions
    {
        private static readonly Random _Random = new Random(DateTime.UtcNow.Millisecond);

        public static async Task ThrowCoinAsync(this IHubContext<NaaSHub, INaaSHubEvents> naasHubContext, IRoomRepository repository, int roomNumber, CoinType typeOfCoin)
        {
            await naasHubContext.Clients.ThrowCoinAsync(repository, roomNumber, typeOfCoin);
        }

        public static async Task ThrowCoinAsync(this IHubClients<INaaSHubEvents> clients, IRoomRepository repository, int roomNumber, CoinType typeOfCoin)
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
            var args = new ThrowCoinEventArgs
            (
                throwPoint,
                typeOfCoin,
                countOfCoin.CountOfNageSen,
                countOfCoin.CountOfAoriSen
            );
            await clients.Group(roomNumber.ToString()).Throw(args);
        }
    }
}
