#nullable enable
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NagesenAsAService.Extensions;
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

        private IConfiguration Configuration { get; }

        private IWebHostEnvironment WebHostEnvironment { get; }

        private IHttpClientFactory HttpClientFactory { get; }

        private IRoomRepository Repository { get; }

        private IUrlShorter UrlShorter { get; }

        private ILogger<RoomsApiController> Logger { get; }

        public RoomsApiController(
            IConfiguration configuration,
            IWebHostEnvironment webHostEnvironment,
            IHttpClientFactory httpClientFactory,
            IRoomRepository repository,
            IUrlShorter urlShorter,
            ILogger<RoomsApiController> logger)
        {
            this.Configuration = configuration;
            this.WebHostEnvironment = webHostEnvironment;
            this.HttpClientFactory = httpClientFactory;
            this.Repository = repository;
            this.UrlShorter = urlShorter;
            this.Logger = logger;
        }

        public class CreateNewRoomRequest { public string? reCAPTCHAResponse { get; set; } }

        [HttpPost("/api/rooms/new"), AutoValidateAntiforgeryToken]
        public async Task<IActionResult> CreateNewRoomAsync([FromBody] CreateNewRoomRequest request)
        {
            var isValid = await VerifyreCAPTCHAResponse(request);
            if (isValid == false) return BadRequest("The reCAPTCHA validation was failed.");

            var newRoomNumber = _Random
                .ToEnumerable(r => r.Next(1000, 10000))
                .First(n => this.Repository.RoomExists(n) == false);

            var urlOfThisRoom = this.Url.AppUrl() + $"/Room/{newRoomNumber}";
            var shortUrlOfThisRoom = await this.UrlShorter.ShortenUrlAsync(urlOfThisRoom);
            await this.Repository.AddRoomAsync(new Room
            {
                RoomNumber = newRoomNumber,
                OwnerUserID = this.User?.Identity?.Name ?? "",
                Title = "",
                Url = urlOfThisRoom,
                ShortUrl = shortUrlOfThisRoom
            });
            return Ok(newRoomNumber);
        }

        private async Task<bool> VerifyreCAPTCHAResponse(CreateNewRoomRequest request)
        {
            var reCAPTCHASecret = this.Configuration.GetValue(key: "reCAPTCHA:SecretKey", defaultValue: "");
            if (!reCAPTCHASecret.IsNullOrEmpty() && !request.reCAPTCHAResponse.IsNullOrEmpty())
            {
                var url = "https://www.google.com/recaptcha/api/siteverify";
                var content = new FormUrlEncodedContent(new Dictionary<string, string?>
                {
                    {"secret", reCAPTCHASecret},
                    {"response", request.reCAPTCHAResponse}
                }!);

                var httpClient = this.HttpClientFactory.CreateClient();
                var response = await httpClient.PostAsync(url, content);
                response.EnsureSuccessStatusCode();

                var verificationResponse = await response.Content.ReadAsAsync<reCAPTCHAVerificationResponse>();
                if (verificationResponse == null || verificationResponse.Success == false)
                {
                    this.Logger.LogWarning("The reCAPTCHA validation was faile: " + JsonSerializer.Serialize(verificationResponse));
                    return false;
                }
            }
            return true;
        }

        [HttpPost("/api/rooms/{roomNumber}/enter")]
        public async Task<IActionResult> EnterRoomAsync(int roomNumber)
        {
            var room = await this.Repository.FindRoomAsync(roomNumber);
            if (room == null) return NotFound();
            return Ok(new RoomContext(room, room.Authorize(this.User)));
        }

        public class PostScreenShotRequest { public string? ImageDataUrl { get; set; } }

        [HttpPost("/api/rooms/{roomNumber}/screenshot"), AutoValidateAntiforgeryToken]
        public async Task<IActionResult> PostScreenShotAsync(int roomNumber, [FromBody] PostScreenShotRequest request)
        {
            var room = await this.Repository.FindRoomAsync(roomNumber);
            if (room == null) return NotFound();
            if (room.Authorize(this.User) == false) return StatusCode((int)HttpStatusCode.Forbidden);

            var imageDataUrl = request.ImageDataUrl;
            if (string.IsNullOrEmpty(imageDataUrl)) return BadRequest();

            var image = Convert.FromBase64String(imageDataUrl.Split(',').Last());
            await this.Repository.SaveScreenShotAsync(roomNumber, image);

            return NoContent();
        }

        [AcceptVerbs("GET", "HEAD"), Route("/api/rooms/{roomNumber}/screenshot")]
        public async Task<IActionResult> GetScreenShotAsync([FromQuery] Guid? session, [FromQuery] bool forOgpImage)
        {
            if (!session.HasValue) return ExpiredRoomImageResult();

            var picture = await this.Repository.GetScreenShotAsync(session.Value);
            if (picture == null) return ExpiredRoomImageResult();

            return new CacheableContentResult(
                    contentType: "image/jpeg",
                    lastModified: picture.LastModified,
                    getContent: () => GetImageBytes(picture, forOgpImage));
        }

        internal static byte[] GetImageBytes(Picture picture, bool forOgpImage)
        {
            var pictureImageBytes = picture.GetImageBytes();
            if (forOgpImage == false) return pictureImageBytes;

            using var originalImageStream = new MemoryStream(pictureImageBytes);
            using var originalImage = Image.FromStream(originalImageStream);

            var margin = (int)(originalImage.Height * 0.027);

            using var resizedImage = new Bitmap(
                width: (originalImage.Height + margin * 2) * 2,
                height: (originalImage.Height + margin * 2));

            using var g = Graphics.FromImage(resizedImage);
            g.FillRectangle(Brushes.LightGray, x: 0, y: 0, resizedImage.Width, resizedImage.Height);
            g.DrawImageUnscaled(originalImage,
                x: (resizedImage.Width - originalImage.Width) / 2,
                y: (resizedImage.Height - originalImage.Height) / 2);

            using var resizedImageStream = new MemoryStream();
            resizedImage.Save(resizedImageStream, ImageFormat.Jpeg);

            return resizedImageStream.ToArray();
        }

        private IActionResult ExpiredRoomImageResult()
        {
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