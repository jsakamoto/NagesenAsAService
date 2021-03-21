using System;
using System.Threading.Tasks;
using NagesenAsAService.Models;

namespace NagesenAsAService.Hubs
{
    public interface INaaSHubEvents
    {
        Task UpdatedRoomSettings(RoomContextSummary settings);

        Task ResetedScore(Guid sessionId);

        Task Throw(ThrowCoinEventArgs args);
    }
}
