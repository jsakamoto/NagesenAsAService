using System;
using System.Threading.Tasks;

namespace NagesenAsAService.Models
{
    public interface IRoomRepository
    {
        bool RoomExists(int roomNumber);
        Task AddRoomAsync(Room room);
        Task<Room> FindRoomAsync(int roomNumber);
        Task<Room> UpdateRoomAsync(int roomNumber, Func<Room, bool> action);
        Task SweepRoomsAsync(DateTime limit);
        Task SaveScreenShotAsync(int roomNumber, byte[] image);
        Task<Picture> GetScreenShotAsync(Guid sessionId);
    }
}