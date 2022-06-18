using System.Text;
using Microsoft.AspNetCore.Mvc;
using Toolbelt.Web;

namespace NagesenAsAService.Controllers;

[ApiController]
public class AssetsApiController : ControllerBase
{
    private IWebHostEnvironment WebHostEnvironment { get; }

    public AssetsApiController(IWebHostEnvironment webHostEnvironment)
    {
        this.WebHostEnvironment = webHostEnvironment;
    }

    [HttpGet("/api/assets/coinsoundbase64/{id}")]
    public IActionResult GetCoinSoundBase64(int id)
    {
        var path = Path.Combine(this.WebHostEnvironment.WebRootPath, "audio", $"se_coin{id}.mp3");
        if (!System.IO.File.Exists(path)) return this.NotFound();

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
}
