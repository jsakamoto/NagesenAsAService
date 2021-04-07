using System;
using System.Threading.Tasks;
using NagesenAsAService.Models;

namespace NagesenAsAService.Services.RoomRepository
{
    public interface IRoomRepository
    {
        bool RoomExists(int roomNumber);
        Task AddRoomAsync(Room room);
        Task<Room> FindRoomAsync(int roomNumber);
        Task<Room> FindRoomIncludesArchivedAsync(int roomNumber, Guid sessionId);
        Task<Room> UpdateRoomAsync(int roomNumber, Func<Room, bool> action);
        Task ArchiveRoomAsync(int roomNumber);
        Task SweepRoomsAsync(DateTime limit);
        Task SaveScreenShotAsync(int roomNumber, byte[] image);
        Task<Picture> GetScreenShotAsync(Guid sessionId);
    }
}