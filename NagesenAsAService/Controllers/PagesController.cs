using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using NagesenAsAService.Models;
using NagesenAsAService.Services.RoomRepository;

namespace NagesenAsAService.Controllers
{
    public class PagesController : Controller
    {
        private IRoomRepository RoomRepository { get; }

        public PagesController(IRoomRepository roomRepository)
        {
            RoomRepository = roomRepository;
        }

        [HttpGet("/")]
        public IActionResult GetIndexPage()
        {
            return View(viewName: "Index");
        }

        [HttpGet("/room/{roomNumber}/box")]
        public async Task<IActionResult> GetNagesenBoxPageAsync(string roomNumber)
        {
            return await this.RoomViewAsync(roomNumber, viewName: "NagesenBox");
        }

        [HttpGet("/room/{roomNumber}")]
        public async Task<IActionResult> GetNagesenControllerPageAsync(string roomNumber)
        {
            return await this.RoomViewAsync(roomNumber, viewName: "NagesenController");
        }

        [HttpGet("/room/{roomNumber}/screenshot")]
        public async Task<IActionResult> GetScreenShotPageAsync(string roomNumber, [FromQuery] Guid session)
        {
            return await RoomViewAsync(
                roomNumber,
                "ScreenShot",
                roomNumberValue => this.RoomRepository.FindRoomIncludesArchivedAsync(roomNumberValue, session));
        }

        private async Task<IActionResult> RoomViewAsync(string roomNumber, string viewName)
        {
            return await RoomViewAsync(roomNumber, viewName, roomNumberValue => this.RoomRepository.FindRoomAsync(roomNumberValue));
        }

        private async Task<IActionResult> RoomViewAsync(string roomNumber, string viewName, Func<int, Task<Room>> findRoomAsync)
        {
            if (int.TryParse(roomNumber, out var roomNumberValue))
            {
                var room = await findRoomAsync(roomNumberValue);
                if (room != null) return View(viewName, model: room);
            }

            ViewBag.RoomNumber = roomNumber;
            return View(viewName: "RoomNotFound");
        }
    }
}
