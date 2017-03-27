﻿using System;
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

        [HttpPut, ValidateAntiForgeryToken]
        public async Task<ActionResult> Settings(int id, string twitterHashtag, bool allowDisCoin)
        {
            var room = await this.Repository.FindRoomAsync(id);
            if (room == null) return HttpNotFound();
            var isOwner = room.OwnerUserID == this.User.Identity.Name;
            if (isOwner == false) return HttpNotFound();

            room.TwitterHashtag = twitterHashtag;
            room.AllowDisCoin = allowDisCoin;
            await this.Repository.UpdateRoomAsync(room);

            return new HttpStatusCodeResult(HttpStatusCode.OK);
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

        [HttpPut]
        public async Task<ActionResult> Throw(int id, CoinType typeOfCoin)
        {
            var hubContext = GlobalHost.ConnectionManager.GetHubContext<DefaultHub>();
            await DefaultHub.Throw(id, typeOfCoin, hubContext.Clients);

            var room = await this.Repository.FindRoomAsync(id);

            return Json(new
            {
                allowDisCoin = room.AllowDisCoin
            });
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
            // TODO:
            //await this.Repository.Database.ExecuteSqlCommandAsync(
            //    @"UPDATE Rooms SET 
            //    ScreenSnapshot = @p1,
            //    UpdateScreenSnapshotAt = GETDATE()
            //    FROM Rooms WHERE RoomNumber = @p0",
            //    id, image);

            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }

        [AcceptVerbs(HttpVerbs.Get | HttpVerbs.Head)]
        public async Task<ActionResult> ScreenShot(int id)
        {
            var room = await this.Repository.FindRoomAsync(id);
            var updateScreenSnapshotAt = room.UpdateScreenSnapshotAt;

            if (updateScreenSnapshotAt == default(DateTime))
            {
                return new CacheableContentResult("image/jpeg",
                    () =>
                    {
                        if (Request.HttpMethod == "HEAD")
                            return new byte[0];
                        else
                            return System.IO.File.ReadAllBytes(Server.MapPath("~/Content/images/UnavailableRoomNumber.jpg"));
                    },
                    cacheability: HttpCacheability.Public,
                    etag: id.ToString()
                );
            }
            else
            {
                return new CacheableContentResult("image/jpeg",
                    () =>
                    {
                        if (Request.HttpMethod == "HEAD")
                            return new byte[0];
                        else
                        {
                            // TODO:
                            //return this.Repository.FindRoom(id)...
                            return null;
                            throw new NotImplementedException();
                        }
                    },
                    lastModified: updateScreenSnapshotAt,
                    cacheability: HttpCacheability.Public,
                    etag: id.ToString()
                );
            }
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

        public async Task<ActionResult> WarmUp()
        {
            var bitly = Bitly.Default;

            var limit = DateTime.UtcNow.AddDays(-7);
            await this.Repository.SweepRoomsAsync(limit);
            //var roomsToSweep = Repository.Rooms.Where(room => room.CreatedAt < limit).ToList();
            //Repository.Rooms.RemoveRange(roomsToSweep);

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