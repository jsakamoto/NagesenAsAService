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

        private async Task<IActionResult> RoomViewAsync(string roomNumber, string viewName)
        {
            if (int.TryParse(roomNumber, out var roomNumberValue))
            {
                var room = await this.RoomRepository.FindRoomAsync(roomNumberValue);
                if (room != null) return View(viewName, model: room);
            }

            ViewBag.RoomNumber = roomNumber;
            return View(viewName: "RoomNotFound");
        }
    }
}
