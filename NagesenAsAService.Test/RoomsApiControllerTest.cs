using NagesenAsAService.Controllers;
using NagesenAsAService.Models;
using NUnit.Framework;

namespace NagesenAsAService.Test;

public class RoomsApiControllerTest
{
    [Test]
    public void GetImageBytes_for_OGP_Image_Test()
    {
        var testImagePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Fixtures", "UnavailableRoomNumber.jpg");
        var picture = new Picture(DateTime.Now, () => File.ReadAllBytes(testImagePath));

        var actualBytes = RoomsApiController.GetImageBytes(picture, forOgpImage: true);

        var resizedImagePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Fixtures", "resized.jpg");
        var expectedBytes = File.ReadAllBytes(resizedImagePath);

        actualBytes.Is(expectedBytes);
    }
}
