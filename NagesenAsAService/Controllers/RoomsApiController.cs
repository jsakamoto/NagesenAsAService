using System;
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

        // TODO: Index.cshtml Razor Page に移植
        //// GET: Default
        //public ActionResult Index()
        //{
        //    return View();
        //}

        [HttpPost("/api/rooms/new")]
        public async Task<IActionResult> CreateNewRoom()
        {
            var newRoomNumber = _Random
                .ToEnumerable(r => r.Next(1000, 10000))
                .First(n => this.Repository.RoomExists(n) == false);

            var urlOfThisRoom = this.Url.AppUrl() + $"/Room/{newRoomNumber}";
            var shortUrlOfThisRoom = await this.UrlShorter.ShortenUrlAsync(urlOfThisRoom);
            await this.Repository.AddRoomAsync(new Room(newRoomNumber)
            {
                OwnerUserID = this.User.Identity.Name,
                Title = "",
                Url = urlOfThisRoom,
                ShortUrl = shortUrlOfThisRoom
            });
            return Ok(newRoomNumber);
        }

        // TODO: Box.cshtml (改め Room.cshtml?) Razor Page へ移植
        //public async Task<ActionResult> Box(int id)
        //{
        //    var room = await this.Repository.FindRoomAsync(id);
        //    if (room == null)
        //    {
        //        return View("UnavailableRoomNumber");
        //    }
        //    return View(room);
        //}

        [HttpGet("/api/rooms/{roomNumber}/settings")]
        public async Task<IActionResult> GetRoomSettingsAsync(int roomNumber)
        {
            var room = await this.Repository.FindRoomAsync(roomNumber);
            return Ok(new RoomSettings
            (
                room.Title,
                room.TwitterHashtag,
                room.AllowDisCoin
            ));
        }

        // TODO: Controller.cshtml Razor Page へ移植
        //public async Task<ActionResult> Controller(int id)
        //{
        //    var room = await this.Repository.FindRoomAsync(id);
        //    if (room == null)
        //    {
        //        return View("UnavailableRoomNumber");
        //    }
        //    return View(room);
        //}

        [HttpGet("/api/rooms/{roomNumber}/context")]// TODO: キャッシュ制御, OutputCache(Duration = 0, NoStore = true)]
        public async Task<IActionResult> PeekRoomContextAsync(int roomNumber)
        {
            var room = await this.Repository.FindRoomAsync(roomNumber);
            if (room == null) return NotFound();
            return Ok(new
            {
                sessionID = room.SessionID,
                title = room.Title,
                allowDisCoin = room.AllowDisCoin
            });
        }

        [HttpPost("/api/rooms/{roomNumber}/coin")]
        public async Task<IActionResult> ThrowCoinAsync(int roomNumber, CoinType typeOfCoin)
        {
            await this.NaasHubContext.ThrowCoinAsync(this.Repository, roomNumber, typeOfCoin);
            return NoContent();
        }

        [HttpGet("/api/rooms/{roomNumber}/twitterhashtag")]// TODO: キャッシュ制御, OutputCache(Duration = 0, NoStore = true)]
        public async Task<IActionResult> GetTwitterHashtagAsync(int roomNumber)
        {
            var room = await this.Repository.FindRoomAsync(roomNumber);
            return Ok(new { twitterHashtag = room.TwitterHashtag });
        }

        [HttpPost("/api/rooms/{roomNumber}/screenshot")]
        public async Task<IActionResult> PostScreenShotAsync(int roomNumber, string imageDataUrl)
        {
            var userID = this.User.Identity.Name;
            var room = await this.Repository.FindRoomAsync(roomNumber);
            if (room == null) return NotFound();
            var isOwner = room.OwnerUserID == userID;
            if (isOwner == false) return StatusCode((int)HttpStatusCode.Forbidden);

            var image = Convert.FromBase64String(imageDataUrl.Split(',').Last());
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
            var twitterHashtag = room?.TwitterHashtag ?? "";
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