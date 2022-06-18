using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using NagesenAsAService.Models;
using NagesenAsAService.Services.RoomRepository;

namespace NagesenAsAService.Controllers;

public class PagesController : Controller
{
    private IRoomRepository RoomRepository { get; }

    private IAntiforgery Antiforgery { get; }

    public PagesController(IRoomRepository roomRepository, IAntiforgery antiforgery)
    {
        this.RoomRepository = roomRepository;
        this.Antiforgery = antiforgery;
    }
    private void InjectAntiForgeryToken()
    {
        var tokens = this.Antiforgery.GetAndStoreTokens(this.HttpContext);
        if (tokens.RequestToken == null) throw new InvalidOperationException($"Antiforgery.GetAndStoreTokens() returns a null request token.");

        this.Response.Cookies.Append(
            key: "X-ANTIFORGERY-TOKEN",
            value: tokens.RequestToken,
            options: new CookieOptions { SameSite = SameSiteMode.Strict, HttpOnly = false });
    }

    [HttpGet("/")]
    public IActionResult GetIndexPage()
    {
        this.InjectAntiForgeryToken();
        return this.View(viewName: "Index");
    }

    [HttpGet("/room/{roomNumber}/box")]
    public async Task<IActionResult> GetNagesenBoxPageAsync(string roomNumber)
    {
        this.InjectAntiForgeryToken();
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
        return await this.RoomViewAsync(
            roomNumber,
            "ScreenShot",
            roomNumberValue => this.RoomRepository.FindRoomIncludesArchivedAsync(roomNumberValue, session));
    }

    private async Task<IActionResult> RoomViewAsync(string roomNumber, string viewName)
    {
        return await this.RoomViewAsync(roomNumber, viewName, roomNumberValue => this.RoomRepository.FindRoomAsync(roomNumberValue));
    }

    private async Task<IActionResult> RoomViewAsync(string roomNumber, string viewName, Func<int, Task<Room?>> findRoomAsync)
    {
        if (int.TryParse(roomNumber, out var roomNumberValue))
        {
            var room = await findRoomAsync(roomNumberValue);
            if (room != null) return this.View(viewName, model: room);
        }

        this.ViewBag.RoomNumber = roomNumber;
        return this.View(viewName: "RoomNotFound");
    }
}
