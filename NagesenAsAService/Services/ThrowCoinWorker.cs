using Microsoft.AspNetCore.SignalR;
using NagesenAsAService.Hubs;
using NagesenAsAService.Models;
using NagesenAsAService.Services.RoomRepository;

namespace NagesenAsAService.Services;

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

    public bool CanDispose => this._ThrowCoinTask == null && this._PrevThrowCoinTask == null;

    public ThrowCoinWorker(IServiceProvider serviceProvider, int roomNumber)
    {
        this._Hub = serviceProvider.GetRequiredService<IHubContext<NaaSHub, INaaSHubEvents>>();
        this._RoomNumber = roomNumber;
    }

    private double GetNextRandomDouble()
    {
        lock (this._Random) return this._Random.NextDouble();
    }

    public void ThrowCoin(IRoomRepository repository, CoinType typeOfCoin)
    {
        lock (this._Syncer)
        {
            this._Repository = repository;

            switch (typeOfCoin)
            {
                case CoinType.Like: this._CountOfLike += 10; break;
                case CoinType.Dis: this._CountOfDis += 10; break;
                default: break;
            }

            if (this._ThrowCoinTask != null) return;

            this._ThrowCoinTask = this.DebouncedThrowCoinAsync();
        }
    }

    private async Task DebouncedThrowCoinAsync()
    {
        await Task.Delay(200);
        var prevTask = Interlocked.Exchange(ref this._PrevThrowCoinTask, null);
        if (prevTask != null) await prevTask;

        var countOfLike = 0;
        var countOfDis = 0;
        var repository = default(IRoomRepository);
        lock (this._Syncer)
        {
            countOfLike = Interlocked.Exchange(ref this._CountOfLike, 0);
            countOfDis = Interlocked.Exchange(ref this._CountOfDis, 0);
            repository = Interlocked.Exchange(ref this._Repository, null);
            this._PrevThrowCoinTask = this._ThrowCoinTask;
            this._ThrowCoinTask = null;
        }

        if (repository != null)
        {
            var room = await repository.UpdateRoomAsync(this._RoomNumber, r =>
            {
                r.CountOfNageSen += countOfLike;
                r.CountOfAoriSen += countOfDis;
                return true;
            });

            if (countOfLike > 0 && room != null) { await this.InvokeThrowCoinEvent(CoinType.Like, room); }
            if (countOfDis > 0 && room != null) { await this.InvokeThrowCoinEvent(CoinType.Dis, room); }
        }
    }

    private async Task InvokeThrowCoinEvent(CoinType typeOfCoin, Room room)
    {
        var throwPoint = this.GetNextRandomDouble();
        var args = new ThrowCoinEventArgs
        (
            throwPoint,
            typeOfCoin,
            room.CountOfNageSen,
            room.CountOfAoriSen
        );
        await this._Hub.Clients.Group(this._RoomNumber.ToString()).Throw(args);
    }
}
