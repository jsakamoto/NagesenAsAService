using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Helpers;
using NagesenAsAService.Models;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using System.Threading.Tasks;

namespace NagesenAsAService.Controllers
{
    public class DefaultHub : Hub
    {
        private static Random _Random = new Random(DateTime.UtcNow.Millisecond);

        public async Task<object> EnterRoom(int roomNumber)
        {
            await Groups.Add(Context.ConnectionId, roomNumber.ToString());
            var repository = new AzureTableRoomRepository();
            var room = await repository.FindRoomAsync(roomNumber);

            return new
            {
                allowDisCoin = room.AllowDisCoin,
                countOfLike = room.CountOfNageSen,
                countOfDis = room.CountOfAoriSen
            };
        }

        public void Throw(int roomNumber, CoinType typeOfCoin)
        {
            Throw(roomNumber, typeOfCoin, this.Clients).Wait();
        }

        public static async Task Throw(int roomNumber, CoinType typeOfCoin, IHubConnectionContext<dynamic> clients)
        {
            var repository = new AzureTableRoomRepository();
            var room = await repository.UpdateRoomAsync(roomNumber, (Room r) =>
            {
                if (typeOfCoin == CoinType.Like)
                {
                    r.CountOfNageSen += 10;
                }
                else
                {
                    r.CountOfAoriSen += 10;
                }
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
            clients.Group(roomNumber.ToString()).Throw(data);
        }
    }
}