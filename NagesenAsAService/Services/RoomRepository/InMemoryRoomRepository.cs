using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using NagesenAsAService.Models;

namespace NagesenAsAService.Services.RoomRepository
{
    public class InMemoryRoomRepository : IRoomRepository
    {
        private List<Room> Rooms { get; } = new List<Room>();

        private Dictionary<Guid, Picture> Pictures { get; } = new Dictionary<Guid, Picture>();

        private string RoomsStoragePath { get; }

        public InMemoryRoomRepository(IWebHostEnvironment webHostEnv)
        {
            var saveDir = Path.Combine(webHostEnv.ContentRootPath, "App_Data");
            if (!Directory.Exists(saveDir)) Directory.CreateDirectory(saveDir);

            this.RoomsStoragePath = Path.Combine(saveDir, "rooms.json");
            if (File.Exists(this.RoomsStoragePath))
            {
                var roomsJsonStr = File.ReadAllText(this.RoomsStoragePath);
                this.Rooms = JsonSerializer.Deserialize<List<Room>>(roomsJsonStr);
            }
        }

        public async Task AddRoomAsync(Room room)
        {
            lock (this.Rooms) this.Rooms.Add(room);
            await this.SaveRoomsAsync();
        }

        private async Task SaveRoomsAsync()
        {
            var roomsJsonStr = default(string);
            lock (this.Rooms) roomsJsonStr = JsonSerializer.Serialize(this.Rooms);
            await File.WriteAllTextAsync(this.RoomsStoragePath, roomsJsonStr);
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

        public async Task SweepRoomsAsync(DateTime limit)
        {
            lock (this.Rooms)
            {
                var roomsToSweep = this.Rooms.Where(room => room.CreatedAt < limit).ToArray();
                foreach (var roomToSweep in roomsToSweep) this.Rooms.Remove(roomToSweep);
            }
            await this.SaveRoomsAsync();
        }

        public async Task<Room> UpdateRoomAsync(int roomNumber, Func<Room, bool> action)
        {
            var room = default(Room);
            lock (this.Rooms)
            {
                room = this.Rooms.FirstOrDefault(r => r.RoomNumber == roomNumber);
                if (room != null) action(room);
            }
            await this.SaveRoomsAsync();
            return room;
        }
    }
}
