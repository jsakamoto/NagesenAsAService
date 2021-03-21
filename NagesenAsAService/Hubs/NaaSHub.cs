using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using NagesenAsAService.Models;
using NagesenAsAService.Services.RoomRepository;

namespace NagesenAsAService.Hubs
{
    public class NaaSHub : Hub<INaaSHubEvents>
    {
        private IRoomRepository Repository { get; set; }

        public NaaSHub(IRoomRepository repository)
        {
            this.Repository = repository;
        }

        public async Task<RoomContext> EnterRoomAsBoxAsync(int roomNumber)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomNumber.ToString());
            var room = await this.Repository.FindRoomAsync(roomNumber);

            return new RoomContext(room);
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

        public Task ThrowCoin(int roomNumber, CoinType typeOfCoin)
        {
            return this.Clients.ThrowCoinAsync(this.Repository, roomNumber, typeOfCoin);
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