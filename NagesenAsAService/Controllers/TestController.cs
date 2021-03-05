using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NagesenAsAService.Hubs;
using NagesenAsAService.Models;

namespace NagesenAsAService.Controllers
{
    [ApiController]
    public class TestController : ControllerBase
    {
        private IRoomRepository RoomRepository { get; }

        private IHubContext<TestHub, ITestHubEvents> HubContext { get; }

        public TestController(
            IRoomRepository roomRepository,
            IHubContext<TestHub, ITestHubEvents> hubContext)
        {
            RoomRepository = roomRepository;
            HubContext = hubContext;
        }

        [HttpPost("/api/dummytext")]
        public Task PostDummyTextAsync()
        {
            return this.HubContext.Clients.All.ReceiveText(Guid.NewGuid().ToString());
        }

        [HttpGet("/api/rooms/{roomNumber}")]
        public async Task<IActionResult> GetRoomAsync(int roomNumber)
        {
            var room = await this.RoomRepository.FindRoomAsync(roomNumber);
            if (room == null) return NotFound();
            return Ok(room);
        }

        [HttpPost("/api/rooms")]
        public async Task<IActionResult> PostRoomAsync()
        {
            await this.RoomRepository.AddRoomAsync(new Room(roomNumber: 1234));
            return Ok();
        }
    }
}
