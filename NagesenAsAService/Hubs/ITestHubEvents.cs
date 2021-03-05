using System.Threading.Tasks;

namespace NagesenAsAService.Hubs
{
    public interface ITestHubEvents
    {
        Task ReceiveText(string text);
    }
}
