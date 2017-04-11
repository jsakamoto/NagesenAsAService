using System;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.SignalR;
using NagesenAsAService.Models;
using QRCoder;
using Toolbelt.Web;

namespace NagesenAsAService.Controllers
{
    public class DefaultController : Controller
    {
        private static TraceSource _CDNPerformanceLogger = new TraceSource("CDNPerformanceLog", SourceLevels.Verbose);

        public static Random _Random = new Random(DateTime.UtcNow.Millisecond);

        public IRoomRepository Repository { get; set; }

        public DefaultController()
        {
            this.Repository = new AzureTableRoomRepository();
        }

        // GET: Default
        public ActionResult Index()
        {
            return View();
        }

        public async Task<ActionResult> CreateNewRoom()
        {
            var newRoomNumber = _Random
                .ToEnumerable(r => r.Next(1000, 10000))
                .First(n => this.Repository.RoomExists(n) == false);

            var urlOfThisRoom = Url.AppUrl() + Url.RouteUrl("Room", new { id = newRoomNumber, action = UrlParameter.Optional });
            var bitly = Bitly.Default;
            var shortUrlOfThisRoom = bitly.Status == Bitly.StatusType.Available ?
#if DEBUG
            bitly.ShortenUrl("http://nagesen.azurewebsites.net/Room/" + newRoomNumber.ToString()) : "http://j.mp/1bD9vPr";
#else
            bitly.ShortenUrl(urlOfThisRoom) : "";
#endif

            await this.Repository.AddRoomAsync(new Room(newRoomNumber)
            {
                OwnerUserID = this.User.Identity.Name,
                Title = "Room Number: " + newRoomNumber.ToString(),
                Url = urlOfThisRoom,
                ShortUrl = shortUrlOfThisRoom
            });

            var boxUrl = Url.RouteUrl("Room", new { action = "Box", id = newRoomNumber });
            return Redirect(boxUrl);
        }

        public async Task<ActionResult> Box(int id)
        {
            var room = await this.Repository.FindRoomAsync(id);

            if (room == null)
            {
                return View("UnavailableRoomNumber");
            }
            return View(room);
        }

        [HttpGet]
        public async Task<ActionResult> Settings(int id)
        {
            var room = await this.Repository.FindRoomAsync(id);

            return Json(new
            {
                twitterHashtag = room.TwitterHashtag,
                allowDisCoin = room.AllowDisCoin
            }, JsonRequestBehavior.AllowGet);
        }

        public async Task<ActionResult> Controller(int id)
        {
            var room = await this.Repository.FindRoomAsync(id);

            if (room == null)
            {
                return View("UnavailableRoomNumber");
            }
            return View(room);
        }

        [HttpGet, OutputCache(Duration = 0, NoStore = true)]
        public async Task<ActionResult> PeekRoomContext(int id)
        {
            var room = await this.Repository.FindRoomAsync(id);
            return Json(new
            {
                sessionID = room.SessionID,
                allowDisCoin = room.AllowDisCoin
            }, JsonRequestBehavior.AllowGet);
        }

        [HttpPut]
        public async Task<ActionResult> Throw(int id, CoinType typeOfCoin)
        {
            var hubContext = GlobalHost.ConnectionManager.GetHubContext<DefaultHub>();
            await DefaultHub.Throw(id, typeOfCoin, hubContext.Clients);
            return new HttpStatusCodeResult(HttpStatusCode.NoContent);
        }

        [HttpGet, OutputCache(Duration = 0, NoStore = true)]
        public async Task<ActionResult> TwitterHashtag(int id)
        {
            var room = await this.Repository.FindRoomAsync(id);
            return Json(new { twitterHashtag = room.TwitterHashtag }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public async Task<ActionResult> ScreenShot(int id, string imageDataUrl)
        {
            var userID = this.User.Identity.Name;
            var room = await this.Repository.FindRoomAsync(id);
            if (room == null) return new HttpStatusCodeResult(HttpStatusCode.Forbidden);
            var isOwner = room.OwnerUserID == userID;
            if (isOwner == false) return new HttpStatusCodeResult(HttpStatusCode.Forbidden);

            var image = Convert.FromBase64String(imageDataUrl.Split(',').Last());
            await this.Repository.SaveScreenShotAsync(id, image);

            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }

        [HttpGet]
        public ActionResult ScreenShot(int id, Guid? session)
        {
            var imageBytes = default(byte[]);
            if (session.HasValue) imageBytes = this.Repository.GetScreenShot(session.Value);
            if (imageBytes == null) imageBytes = System.IO.File.ReadAllBytes(Server.MapPath("~/Content/images/UnavailableRoomNumber.jpg"));
            return File(imageBytes, "image/jpeg");
        }

        [HttpGet]
        public async Task<ActionResult> TwitterShare(int id, string text, string url)
        {
            var room = await this.Repository.FindRoomAsync(id);
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

        [HttpGet]
        public ActionResult CoinSoundBase64(int id)
        {
            var path = Server.MapPath($"~/Content/audio/se_coin{id}.mp3");
            if (!System.IO.File.Exists(path)) return HttpNotFound();

            return new CacheableContentResult(
                contentType: "text/base64",
                lastModified: System.IO.File.GetLastWriteTimeUtc(path),
                getContent: () =>
                {
                    var soundBytes = System.IO.File.ReadAllBytes(path);
                    var soundBase64 = Convert.ToBase64String(soundBytes);
                    return Encoding.UTF8.GetBytes(soundBase64);
                });
        }

        [HttpGet]
        public async Task<ActionResult> QRCodeOfRoom(int id)
        {
            var room = await this.Repository.FindRoomAsync(id);
            if (room == null) return HttpNotFound();

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

        public async Task<ActionResult> WarmUp()
        {
            var bitly = Bitly.Default;

            var limit = DateTime.UtcNow.AddDays(-7);
            await this.Repository.SweepRoomsAsync(limit);

            return new EmptyResult();
        }

        [HttpPost]
        public ActionResult LogPerformance(bool useCDN, int elapse)
        {
            try
            {
                _CDNPerformanceLogger.TraceEvent(TraceEventType.Verbose, 0, "useCDN\t{0}\telapse\t{1}", useCDN, elapse);
                _CDNPerformanceLogger.Flush();
            }
            catch (Exception e)
            {
                UnhandledExceptionLogger.Write(e);
            }
            return new EmptyResult();
        }
    }
}