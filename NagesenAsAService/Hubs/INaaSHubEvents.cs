using System;
using System.Threading.Tasks;

namespace NagesenAsAService.Hubs
{
    public interface INaaSHubEvents
    {
        Task UpdatedSettings(object settings);

        Task ResetedRoom(Guid sessionId);

        Task Throw(object data);
    }
}
