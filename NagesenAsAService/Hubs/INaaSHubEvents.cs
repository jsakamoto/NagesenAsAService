using System;
using System.Threading.Tasks;
using NagesenAsAService.Models;

namespace NagesenAsAService.Hubs
{
    public interface INaaSHubEvents
    {
        Task UpdatedSettings(RoomSettings settings);

        Task ResetedRoom(Guid sessionId);

        Task Throw(ThrowCoinEventArgs args);
    }
}
