using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Helpers;
using NagesenAsAService.Models;
using Microsoft.AspNet.SignalR;

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
                title = room.Title
            };
        }

        public void Throw(int roomNumber, int typeOfZeni)
        {
            var db = new AppDbContext();
            if (typeOfZeni == 0)
                db.Database.ExecuteSqlCommand(
                    "UPDATE Rooms SET CountOfNageSen = CountOfNageSen + 1 FROM Rooms WHERE RoomNumber = @p0", roomNumber);
            else
                db.Database.ExecuteSqlCommand(
                    "UPDATE Rooms SET CountOfAoriSen = CountOfAoriSen + 1 FROM Rooms WHERE RoomNumber = @p0", roomNumber);

            var throwPoint = default(double);
            lock (_Random) throwPoint = _Random.NextDouble();
            var data = new { throwPoint, typeOfZeni };
            Clients.Group(roomNumber.ToString()).Throw(data);
        }
    }
}