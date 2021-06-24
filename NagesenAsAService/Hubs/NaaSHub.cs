#nullable enable
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using NagesenAsAService.Models;
using NagesenAsAService.Services;
using NagesenAsAService.Services.RoomRepository;

namespace NagesenAsAService.Hubs
{
    public class NaaSHub : Hub<INaaSHubEvents>
    {
        private static readonly ConcurrentDictionary<int, ThrowCoinWorker> _ThrowCoinWorkers = new();

        private IServiceProvider ServiceProvider { get; }

        private IRoomRepository Repository { get; set; }

        public NaaSHub(IServiceProvider serviceProvider, IRoomRepository repository)
        {
            this.ServiceProvider = serviceProvider;
            this.Repository = repository;
        }

        public async Task<RoomContext> EnterRoomAsBoxAsync(int roomNumber)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomNumber.ToString());
            var room = await this.Repository.FindRoomAsync(roomNumber);

            return new RoomContext(room, room.Authorize(this.Context.User));
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
                if (room.Authorize(this.Context.User) == false) return false;

                hasChanged =
                    (room.Title != settings.Title) ||
                    (room.TwitterHashtag != settings.TwitterHashtag) ||
                    (room.UnitOfLikeCoin != settings.UnitOfLikeCoin) ||
                    (room.UnitOfDisCoin != settings.UnitOfDisCoin) ||
                    (room.AllowDisCoin != settings.AllowDisCoin);

                room.Title = settings.Title;
                room.TwitterHashtag = settings.TwitterHashtag;
                room.UnitOfLikeCoin = settings.UnitOfLikeCoin;
                room.UnitOfDisCoin = settings.UnitOfDisCoin;
                room.AllowDisCoin = settings.AllowDisCoin;
                return true;
            });

            if (hasChanged)
            {
                var room = await this.Repository.FindRoomAsync(roomNumber);
                var roomContextSummary = new RoomContextSummary(room);

                var notificationTasks = new[]{
                        this.Clients.OthersInGroup(roomNumber.ToString()),
                        this.Clients.Group(roomNumber.ToString() + "/controller")
                    }
                    .Select(client => client.UpdatedRoomSettings(roomContextSummary))
                    .ToArray();
                await Task.WhenAll(notificationTasks);
            }
        }

        public Task ThrowCoinAsync(int roomNumber, CoinType typeOfCoin)
        {
            lock (_ThrowCoinWorkers)
            {
                var keys = _ThrowCoinWorkers.Where(a => a.Value.CanDispose).Select(a => a.Key).ToArray();
                foreach (var key in keys) _ThrowCoinWorkers.Remove(key, out var _);
            }

            var worker = _ThrowCoinWorkers.GetOrAdd(roomNumber, n => new ThrowCoinWorker(ServiceProvider, n));
            worker.ThrowCoin(this.Repository, typeOfCoin);

            return Task.CompletedTask;
        }

        public async Task ResetScoreAsync(int roomNumber)
        {
            var room = await this.Repository.FindRoomAsync(roomNumber);
            if (room == null) return;
            if (room.Authorize(this.Context.User) == false) return;

            await this.Repository.ArchiveRoomAsync(roomNumber);
            await this.Repository.UpdateRoomAsync(roomNumber, r =>
            {
                r.Reset();
                return true;
            });

            await Clients.Groups(roomNumber.ToString(), roomNumber.ToString() + "/controller")
                .ResetedScore(room.SessionID);
        }
    }
}