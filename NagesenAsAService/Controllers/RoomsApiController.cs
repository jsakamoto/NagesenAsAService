﻿using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NagesenAsAService.Extensions;
using NagesenAsAService.Hubs;
using NagesenAsAService.Models;
using NagesenAsAService.Services.RoomRepository;
using NagesenAsAService.Services.UrlShorter;
using QRCoder;
using Toolbelt.Web;

namespace NagesenAsAService.Controllers
{
    [ApiController]
    public class RoomsApiController : ControllerBase
    {
        private static readonly Random _Random = new(DateTime.UtcNow.Millisecond);

        private IWebHostEnvironment WebHostEnvironment { get; }

        private IRoomRepository Repository { get; }

        private IHubContext<NaaSHub, INaaSHubEvents> NaasHubContext { get; }

        private IUrlShorter UrlShorter { get; }

        public RoomsApiController(
            IWebHostEnvironment webHostEnvironment,
            IRoomRepository repository,
            IHubContext<NaaSHub, INaaSHubEvents> naasHubContext,
            IUrlShorter urlShorter)
        {
            this.WebHostEnvironment = webHostEnvironment;
            this.Repository = repository;
            this.NaasHubContext = naasHubContext;
            UrlShorter = urlShorter;
        }

        [HttpPost("/api/rooms/new")]
        public async Task<IActionResult> CreateNewRoom()
        {
            var newRoomNumber = _Random
                .ToEnumerable(r => r.Next(1000, 10000))
                .First(n => this.Repository.RoomExists(n) == false);

            var urlOfThisRoom = this.Url.AppUrl() + $"/Room/{newRoomNumber}";
            var shortUrlOfThisRoom = await this.UrlShorter.ShortenUrlAsync(urlOfThisRoom);
            await this.Repository.AddRoomAsync(new Room
            {
                RoomNumber = newRoomNumber,
                OwnerUserID = this.User.Identity.Name,
                Title = "",
                Url = urlOfThisRoom,
                ShortUrl = shortUrlOfThisRoom
            });
            return Ok(newRoomNumber);
        }

        public class PostScreenShotRequest { public string ImageDataUrl { get; set; } }

        [HttpPost("/api/rooms/{roomNumber}/screenshot")]
        public async Task<IActionResult> PostScreenShotAsync(int roomNumber, [FromBody] PostScreenShotRequest request)
        {
            var userID = this.User.Identity.Name;
            var room = await this.Repository.FindRoomAsync(roomNumber);
            if (room == null) return NotFound();
            var isOwner = room.OwnerUserID == userID;
            if (isOwner == false) return StatusCode((int)HttpStatusCode.Forbidden);

            var image = Convert.FromBase64String(request.ImageDataUrl.Split(',').Last());
            await this.Repository.SaveScreenShotAsync(roomNumber, image);

            return NoContent();
        }

        [AcceptVerbs("GET", "HEAD"), Route("/api/rooms/{roomNumber}/screenshot")]
        public async Task<IActionResult> GetScreenShotAsync(int roomNumber, [FromQuery] Guid? session)
        {
            if (session.HasValue)
            {
                var picture = await this.Repository.GetScreenShotAsync(session.Value);
                if (picture != null)
                {
                    return new CacheableContentResult(
                            contentType: "image/jpeg",
                            lastModified: picture.LastModified,
                            getContent: picture.GetImageBytes);
                }
            }

            var path = Path.Combine(this.WebHostEnvironment.WebRootPath, "images", "UnavailableRoomNumber.jpg");
            return new CacheableContentResult(
                contentType: "image/jpeg",
                lastModified: System.IO.File.GetLastWriteTimeUtc(path),
                getContent: () => System.IO.File.ReadAllBytes(path));
        }

        [HttpGet("/api/rooms/{roomNumber}/twittershare")]
        public async Task<IActionResult> TwitterShareAsync(int roomNumber, string text, string url)
        {
            var room = await this.Repository.FindRoomAsync(roomNumber);
            var twitterHashtag = (room?.TwitterHashtag ?? "").TrimStart('#');
            var twitterSharUrl = "https://twitter.com/share?";
            twitterSharUrl += "text=" + HttpUtility.UrlEncode(text);
            twitterSharUrl += "&url=" + HttpUtility.UrlEncode(url);
            if (twitterHashtag != "")
            {
                twitterSharUrl += "&hashtags=" + HttpUtility.UrlEncode(twitterHashtag);
            }

            return Redirect(twitterSharUrl);
        }

        [HttpGet("/api/rooms/{roomNumber}/qrcode")]
        public async Task<ActionResult> GetQRCodeOfRoomAsync(int roomNumber)
        {
            var room = await this.Repository.FindRoomAsync(roomNumber);
            if (room == null) return NotFound();

            return new CacheableContentResult(
                contentType: "image/png",
                lastModified: room.CreatedAt,
                getContent: () =>
                {
                    var qrGenerator = new QRCodeGenerator();
                    var qrCodeData = qrGenerator.CreateQrCode(room.ShortUrl, QRCodeGenerator.ECCLevel.M);
                    var qrCode = new BitmapByteQRCode(qrCodeData);
                    var qrCodeImage = qrCode.GetGraphic(12);
                    return qrCodeImage;
                });
        }

        [HttpDelete("/api/rooms/expired")]
        public async Task<IActionResult> WarmUp()
        {
            var limit = DateTime.UtcNow.AddDays(-7);
            await this.Repository.SweepRoomsAsync(limit);
            return NoContent();
        }
    }
}