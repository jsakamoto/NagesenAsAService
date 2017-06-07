using System;
using System.Threading.Tasks;

namespace NagesenAsAService.Models
{
    public interface IRoomRepository
    {
        bool RoomExists(int roomNumber);
        Task AddRoomAsync(Room room);
        Task<Room> FindRoomAsync(int roomNumber);
        Task UpdateRoomAsync(Room room);
        Task<Room> UpdateRoomAsync(int roomNumber, Action<Room> action);
        Task SweepRoomsAsync(DateTime limit);
        Task SaveScreenShotAsync(int roomNumber, byte[] image);
        Task<Picture> GetScreenShotAsync(Guid sessionId);
    }
}