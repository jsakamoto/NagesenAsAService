#nullable enable
using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using NagesenAsAService.Hubs;
using NagesenAsAService.Models;
using NagesenAsAService.Services.RoomRepository;

namespace NagesenAsAService.Services
{
    public class ThrowCoinWorker
    {
        private readonly Random _Random = new(DateTime.UtcNow.Millisecond);

        private readonly object _Syncer = new();

        private readonly IHubContext<NaaSHub, INaaSHubEvents> _Hub;

        private readonly int _RoomNumber = 0;

        private int _CountOfLike = 0;

        private int _CountOfDis = 0;

        private IRoomRepository? _Repository = null;

        private Task? _ThrowCoinTask = null;

        private Task? _PrevThrowCoinTask = null;

        public bool CanDispose => _ThrowCoinTask == null && _PrevThrowCoinTask == null;

        public ThrowCoinWorker(IServiceProvider serviceProvider, int roomNumber)
        {
            _Hub = serviceProvider.GetRequiredService<IHubContext<NaaSHub, INaaSHubEvents>>();
            _RoomNumber = roomNumber;
        }

        private double GetNextRandomDouble()
        {
            lock (_Random) return _Random.NextDouble();
        }

        public void ThrowCoin(IRoomRepository repository, CoinType typeOfCoin)
        {
            lock (_Syncer)
            {
                _Repository = repository;

                switch (typeOfCoin)
                {
                    case CoinType.Like: _CountOfLike += 10; break;
                    case CoinType.Dis: _CountOfDis += 10; break;
                    default: break;
                }

                if (_ThrowCoinTask != null) return;

                _ThrowCoinTask = DebouncedThrowCoinAsync();
            }
        }

        private async Task DebouncedThrowCoinAsync()
        {
            await Task.Delay(200);
            var prevTask = Interlocked.Exchange(ref _PrevThrowCoinTask, null);
            if (prevTask != null) await prevTask;

            var countOfLike = 0;
            var countOfDis = 0;
            var repository = default(IRoomRepository);
            lock (_Syncer)
            {
                countOfLike = Interlocked.Exchange(ref _CountOfLike, 0);
                countOfDis = Interlocked.Exchange(ref _CountOfDis, 0);
                repository = Interlocked.Exchange(ref _Repository, null);
                _PrevThrowCoinTask = _ThrowCoinTask;
                _ThrowCoinTask = null;
            }

            var room = await repository!.UpdateRoomAsync(_RoomNumber, r =>
            {
                r.CountOfNageSen += countOfLike;
                r.CountOfAoriSen += countOfDis;
                return true;
            });

            if (countOfLike > 0) { await InvokeThrowCoinEvent(CoinType.Like, room); }
            if (countOfDis > 0) { await InvokeThrowCoinEvent(CoinType.Dis, room); }
        }

        private async Task InvokeThrowCoinEvent(CoinType typeOfCoin, Room room)
        {
            var throwPoint = GetNextRandomDouble();
            var args = new ThrowCoinEventArgs
            (
                throwPoint,
                typeOfCoin,
                room.CountOfNageSen,
                room.CountOfAoriSen
            );
            await _Hub.Clients.Group(_RoomNumber.ToString()).Throw(args);
        }
    }
}
