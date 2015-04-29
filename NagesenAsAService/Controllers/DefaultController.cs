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
                .ToEnumerable(r => r.Next(100, 10000))
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
            var isOwner = room.OwnerUserID == this.User.Identity.Name;
            if (isOwner == false) return HttpNotFound();

            return View(room);
        }

        [HttpPost, ValidateAntiForgeryToken]
        public async Task<ActionResult> Settings(int id, string twitterHashtag)
        {
            var room = this.Db.Rooms
                .Single(_ => _.RoomNumber == id);
            var isOwner = room.OwnerUserID == this.User.Identity.Name;
            if (isOwner == false) return HttpNotFound();

            room.TwitterHashtag = twitterHashtag;

            await this.Db.SaveChangesAsync();

            return RedirectToRoute("Room", new { id, action = "Box" });
        }

        public ActionResult Controller(int id)
        {
            var room = this.Db.Rooms
                .Single(_ => _.RoomNumber == id);
            return View(room);
        }

        [HttpPut]
        public ActionResult Throw(int id, int typeOfCoin)
        {
            var hubContext = GlobalHost.ConnectionManager.GetHubContext<DefaultHub>();
            DefaultHub.Throw(id, typeOfCoin, hubContext.Clients);

            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }

        [HttpGet, OutputCache(Duration = 0, NoStore = true)]
        public ActionResult TwitterHashtag(int id)
        {
            var room = this.Db.Rooms
                .Single(_ => _.RoomNumber == id);
            return Json(new { twitterHashtag = room.TwitterHashtag }, JsonRequestBehavior.AllowGet);
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