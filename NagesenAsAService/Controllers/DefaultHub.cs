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

        public object EnterRoom(int roomNumber)
        {
            Groups.Add(Context.ConnectionId, roomNumber.ToString());
            var db = new AppDbContext();
            var room = db.Rooms.First(r => r.RoomNumber == roomNumber);

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
            var db = new AppDbContext();
            if (typeOfCoin == CoinType.Like)
                await db.Database.ExecuteSqlCommandAsync(
                    "UPDATE Rooms SET CountOfNageSen = CountOfNageSen + 10 FROM Rooms WHERE RoomNumber = @p0", roomNumber);
            else
                await db.Database.ExecuteSqlCommandAsync(
                    "UPDATE Rooms SET CountOfAoriSen = CountOfAoriSen + 10 FROM Rooms WHERE RoomNumber = @p0", roomNumber);

            var countOfCoin = db.Rooms
                .Where(room => room.RoomNumber == roomNumber)
                .Select(room => new {room.CountOfNageSen, room.CountOfAoriSen })
                .First();

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