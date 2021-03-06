using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using NagesenAsAService.Models;

namespace NagesenAsAService.Services.RoomRepository
{
    public class InMemoryRoomRepository : IRoomRepository
    {
        private List<Room> Rooms { get; } = new List<Room>();

        private Dictionary<Guid, Picture> Pictures { get; } = new Dictionary<Guid, Picture>();

        public InMemoryRoomRepository()
        {
        }

        public Task AddRoomAsync(Room room)
        {
            lock (this.Rooms) this.Rooms.Add(room);
            return Task.CompletedTask;
        }

        public Task<Room> FindRoomAsync(int roomNumber)
        {
            lock (this.Rooms)
            {
                var room = this.Rooms.FirstOrDefault(room => room.RoomNumber == roomNumber);
                return Task.FromResult(room);
            }
        }

        public Task<Picture> GetScreenShotAsync(Guid sessionId)
        {
            lock (this.Pictures)
            {
                this.Pictures.TryGetValue(sessionId, out var picture);
                return Task.FromResult(picture);
            }
        }

        public bool RoomExists(int roomNumber)
        {
            lock (this.Rooms)
            {
                return this.Rooms.Any(room => room.RoomNumber == roomNumber);
            }
        }

        public async Task SaveScreenShotAsync(int roomNumber, byte[] image)
        {
            var room = await this.FindRoomAsync(roomNumber);
            if (room == null) return;
            var picture = new Picture(DateTime.UtcNow, () => image);
            lock (this.Pictures)
            {
                this.Pictures[room.SessionID] = picture;
            }
        }

        public Task SweepRoomsAsync(DateTime limit)
        {
            // NOP
            return Task.CompletedTask;
        }

        public Task<Room> UpdateRoomAsync(int roomNumber, Func<Room, bool> action)
        {
            lock (this.Rooms)
            {
                var room = this.Rooms.FirstOrDefault(r => r.RoomNumber == roomNumber);
                if (room == null) return Task.FromResult(room);

                action(room);
                return Task.FromResult(room);
            }
        }
    }
}
