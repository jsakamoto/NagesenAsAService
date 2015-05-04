using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.SignalR;
using NagesenAsAService.Models;
using Newtonsoft.Json.Linq;
using Toolbelt.Web;

namespace NagesenAsAService.Controllers
{
    public class DefaultController : Controller
    {
        private static TraceSource _CDNPerformanceLogger = new TraceSource("CDNPerformanceLog", SourceLevels.Verbose);

        public static Random _Random = new Random(DateTime.UtcNow.Millisecond);

        public AppDbContext Db { get; set; }

        public DefaultController()
        {
            this.Db = new AppDbContext();
        }

        // GET: Default
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult CreateNewRoom()
        {
            var newRoomNumber = _Random
                .ToEnumerable(r => r.Next(1000, 10000))
                .First(n => this.Db.Rooms.Any(room => room.RoomNumber == n) == false);

            var urlOfThisRoom = Url.AppUrl() + Url.RouteUrl("Room", new { id = newRoomNumber, action = UrlParameter.Optional });
            var bitly = Bitly.Default;
            var shortUrlOfThisRoom = bitly.Status == Bitly.StatusType.Available ?
#if DEBUG
 bitly.ShortenUrl("http://nagesen.azurewebsites.net/Room/" + newRoomNumber.ToString()) : "http://j.mp/1bD9vPr";
#else
            bitly.ShortenUrl(urlOfThisRoom) : "";
#endif

            this.Db.Rooms.Add(new Room
            {
                RoomNumber = newRoomNumber,
                OwnerUserID = this.User.Identity.Name,
                Title = "Room Number: " + newRoomNumber.ToString(),
                Url = urlOfThisRoom,
                ShortUrl = shortUrlOfThisRoom
            });
            this.Db.SaveChanges();

            var boxUrl = Url.RouteUrl("Room", new { action = "Box", id = newRoomNumber });
            return Redirect(boxUrl);
        }

        public ActionResult Box(int id)
        {
            var room = this.Db.Rooms
                .Single(_ => _.RoomNumber == id);
            return View(room);
        }

        [HttpGet]
        public ActionResult Settings(int id)
        {
            var room = this.Db.Rooms
                .Single(_ => _.RoomNumber == id);

            return Json(new
            {
                twitterHashtag = room.TwitterHashtag,
                allowDisCoin = room.AllowDisCoin
            }, JsonRequestBehavior.AllowGet);
        }

        [HttpPut, ValidateAntiForgeryToken]
        public async Task<ActionResult> Settings(int id, string twitterHashtag, bool allowDisCoin)
        {
            var isOwner = this.Db.Rooms
                .Where(r => r.RoomNumber == id)
                .Where(r => r.OwnerUserID == this.User.Identity.Name)
                .Any();
            if (isOwner == false) return HttpNotFound();

            await this.Db.Database.ExecuteSqlCommandAsync(@"
                UPDATE Rooms SET TwitterHashtag = @p1, AllowDisCoin = @p2
                WHERE RoomNumber = @p0",
                id, twitterHashtag, allowDisCoin);

            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }

        public ActionResult Controller(int id)
        {
            var room = this.Db.Rooms
                .Single(_ => _.RoomNumber == id);
            return View(room);
        }

        [HttpPut]
        public async Task<ActionResult> Throw(int id, CoinType typeOfCoin)
        {
            var hubContext = GlobalHost.ConnectionManager.GetHubContext<DefaultHub>();
            await DefaultHub.Throw(id, typeOfCoin, hubContext.Clients);

            var room = this.Db.Rooms
                .Single(_ => _.RoomNumber == id);

            return Json(new
            {
                allowDisCoin = room.AllowDisCoin
            });
        }

        [HttpGet, OutputCache(Duration = 0, NoStore = true)]
        public ActionResult TwitterHashtag(int id)
        {
            var room = this.Db.Rooms
                .Single(_ => _.RoomNumber == id);
            return Json(new { twitterHashtag = room.TwitterHashtag }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public async Task<ActionResult> ScreenShot(int id, string imageDataUrl)
        {
            var userID = this.User.Identity.Name;
            var isOwner = this.Db.Rooms
                .Where(_ => _.RoomNumber == id)
                .Where(_ => _.OwnerUserID == userID)
                .Any();
            if (isOwner == false) return new HttpStatusCodeResult(HttpStatusCode.Forbidden);

            var image = Convert.FromBase64String(imageDataUrl.Split(',').Last());
            await this.Db.Database.ExecuteSqlCommandAsync(
                @"UPDATE Rooms SET 
                ScreenSnapshot = @p1,
                UpdateScreenSnapshotAt = GETDATE()
                FROM Rooms WHERE RoomNumber = @p0",
                id, image);

            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }

        [HttpGet]
        public ActionResult ScreenShot(int id)
        {
            var updateScreenSnapshotAt = this.Db.Rooms
                .Where(room => room.RoomNumber == id)
                .Select(room => room.UpdateScreenSnapshotAt)
                .Single();

            return new CacheableContentResult("image/jpeg",
                () =>
                {
                    return this.Db.Rooms
                        .Where(room => room.RoomNumber == id)
                        .Select(room => room.ScreenSnapshot)
                        .Single();
                },
                lastModified: updateScreenSnapshotAt,
                cacheability: HttpCacheability.Public,
                etag: id.ToString()
            );
        }

        [HttpGet]
        public ActionResult TwitterShare(int id, string text, string url)
        {
            var twitterHashtag = this.Db.Rooms
                .Where(room => room.RoomNumber == id)
                .Select(room => room.TwitterHashtag)
                .First() ?? "";

            var twitterSharUrl = "https://twitter.com/share?";
            twitterSharUrl += "text=" + HttpUtility.UrlEncode(text);
            twitterSharUrl += "&url=" + HttpUtility.UrlEncode(url);
            if (twitterHashtag != "")
            {
                twitterSharUrl += "&hashtags=" + HttpUtility.UrlEncode(twitterHashtag);
            }

            return Redirect(twitterSharUrl);
        }

        public ActionResult WarmUp()
        {
            var bitly = Bitly.Default;

            var limit = DateTime.UtcNow.AddDays(-7);
            var roomsToSweep = Db.Rooms.Where(room => room.CreatedAt < limit).ToList();
            Db.Rooms.RemoveRange(roomsToSweep);
            Db.SaveChanges();

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