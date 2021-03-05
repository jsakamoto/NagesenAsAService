using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using NagesenAsAService.Models;

namespace NagesenAsAService.Hubs
{
    public class NaaSHub : Hub<INaaSHubEvents>
    {
        private IRoomRepository Repository { get; set; }

        public NaaSHub(IRoomRepository repository)
        {
            this.Repository = repository;
        }

        public async Task<RoomContext> EnterRoom(int roomNumber)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomNumber.ToString());
            var room = await this.Repository.FindRoomAsync(roomNumber);

            return new RoomContext(room);
        }

        public async Task UpdateSettings(int roomNumber, RoomSettings settings)// string title, string twitterHashtag, bool allowDisCoin)
        {
            await this.Repository.UpdateRoomAsync(roomNumber, room =>
            {
                if (room == null) return false;
                var isOwner = room.OwnerUserID == this.Context.User.Identity.Name;
                if (isOwner == false) return false;

                room.Title = settings.Title;
                room.TwitterHashtag = settings.TwitterHashtag;
                room.AllowDisCoin = settings.AllowDisCoin;
                return true;
            });

            await Clients.Group(roomNumber.ToString()).UpdatedSettings(settings);
        }

        public Task Throw(int roomNumber, CoinType typeOfCoin)
        {
            return this.Clients.Throw(this.Repository, roomNumber, typeOfCoin);
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