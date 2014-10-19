using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Text;
using System.Web;
using System.Web.Mvc;
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

            var urlOfThisRoom = Url.AppUrl() + Url.Action("Room", new { id = newRoomNumber });
            var bitly = Bitly.Default;
            var shortUrlOfThisRoom = bitly.Status == Bitly.StatusType.Available ?
#if DEBUG
            bitly.ShortenUrl("http://nagesen.azurewebsites.net/Room/" + newRoomNumber.ToString()) : "";
#else
            bitly.ShortenUrl(urlOfThisRoom) : "";
#endif

            this.Db.Rooms.Add(new Room
            {
                RoomNumber = newRoomNumber,
                Title = "Room Number: " + newRoomNumber.ToString(),
                Url = urlOfThisRoom,
                ShortUrl = shortUrlOfThisRoom
            });
            this.Db.SaveChanges();

            return RedirectToAction("Room", new { id = newRoomNumber });
        }

        public ActionResult Room(int id)
        {
            var room = this.Db.Rooms
                .Single(_ => _.RoomNumber == id);
            return View(room);
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