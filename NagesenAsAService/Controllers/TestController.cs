using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NagesenAsAService.Hubs;

namespace NagesenAsAService.Controllers
{
    [ApiController]
    public class TestController : ControllerBase
    {
        private IHubContext<TestHub, ITestHubEvents> HubContext { get; }

        public TestController(IHubContext<TestHub, ITestHubEvents> hubContext)
        {
            HubContext = hubContext;
        }

        [HttpPost("/api/dummytext")]
        public Task PostDummyTextAsync()
        {
            return this.HubContext.Clients.All.ReceiveText(Guid.NewGuid().ToString());
        }
    }
}
