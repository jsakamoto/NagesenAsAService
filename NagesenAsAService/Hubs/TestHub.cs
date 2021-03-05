using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace NagesenAsAService.Hubs
{
    public class TestHub : Hub<ITestHubEvents>
    {
        public Task SendText(string text)
        {
            return this.Clients.All.ReceiveText(text);
        }
    }
}
