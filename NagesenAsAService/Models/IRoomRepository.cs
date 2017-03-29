using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

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
    }
}