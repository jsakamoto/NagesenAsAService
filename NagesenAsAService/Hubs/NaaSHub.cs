using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using NagesenAsAService.Models;
using NagesenAsAService.Services.RoomRepository;

namespace NagesenAsAService.Hubs
{
    public class NaaSHub : Hub<INaaSHubEvents>
    {
        private readonly Random _Random = new Random(DateTime.UtcNow.Millisecond);

        private IRoomRepository Repository { get; set; }

        public NaaSHub(IRoomRepository repository)
        {
            this.Repository = repository;
        }

        public async Task<RoomContext> EnterRoomAsBoxAsync(int roomNumber)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomNumber.ToString());
            var room = await this.Repository.FindRoomAsync(roomNumber);

            return new RoomContext(room, Authorize(room));
        }

        public async Task<RoomContextSummary> EnterRoomAsControllerAsync(int roomNumber)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomNumber.ToString() + "/controller");
            var room = await this.Repository.FindRoomAsync(roomNumber);

            return new RoomContextSummary(room);
        }

        public async Task UpdateRoomSettingsAsync(int roomNumber, RoomSettings settings)
        {
            var hasChanged = false;
            await this.Repository.UpdateRoomAsync(roomNumber, room =>
            {
                if (Authorize(room) == false) return false;

                hasChanged =
                    (room.Title != settings.Title) ||
                    (room.TwitterHashtag != settings.TwitterHashtag) ||
                    (room.AllowDisCoin != settings.AllowDisCoin);

                room.Title = settings.Title;
                room.TwitterHashtag = settings.TwitterHashtag;
                room.AllowDisCoin = settings.AllowDisCoin;
                return true;
            });

            if (hasChanged)
            {
                var room = await this.Repository.FindRoomAsync(roomNumber);
                await Clients.Groups(roomNumber.ToString(), roomNumber.ToString() + "/controller")
                    .UpdatedRoomSettings(new RoomContextSummary(room));
            }
        }

        private bool Authorize(Room room)
        {
            if (room == null) return false;
            var isOwner = room.OwnerUserID == this.Context.User.Identity.Name;
            if (isOwner == false) return false;
            return true;
        }

        public async Task ThrowCoinAsync(int roomNumber, CoinType typeOfCoin)
        {
            var room = await this.Repository.UpdateRoomAsync(roomNumber, r =>
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
            await Clients.Group(roomNumber.ToString()).Throw(args);
        }

        public async Task ResetScoreAsync(int roomNumber)
        {
            var hasReseted = false;
            var room = await this.Repository.UpdateRoomAsync(roomNumber, r =>
            {
                if (Authorize(r) == false) return false;
                r.Reset();
                hasReseted = true;
                return true;
            });

            if (hasReseted)
            {
                await Clients.Groups(roomNumber.ToString(), roomNumber.ToString() + "/controller")
                    .ResetedScore(room.SessionID);
            }
        }
    }
}