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
                if (room == null) return false;
                var isOwner = room.OwnerUserID == this.Context.User.Identity.Name;
                if (isOwner == false) return false;

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

        public Task ThrowCoin(int roomNumber, CoinType typeOfCoin)
        {
            return this.Clients.ThrowCoinAsync(this.Repository, roomNumber, typeOfCoin);
        }

        public async Task ResetRoom(int roomNumber)
        {
            var room = await this.Repository.UpdateRoomAsync(roomNumber, r =>
            {
                r.Reset();
                return true;
            });

            await Clients.Group(roomNumber.ToString()).ResetedRoom(room.SessionID);
        }
    }
}