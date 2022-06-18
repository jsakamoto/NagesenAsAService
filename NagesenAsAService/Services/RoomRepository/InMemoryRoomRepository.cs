using System.Text.Json;
using NagesenAsAService.Models;

namespace NagesenAsAService.Services.RoomRepository;

public class InMemoryRoomRepository : IRoomRepository
{
    private class RoomContainer
    {
        public List<Room> Rooms { get; } = new List<Room>();

        public List<Room> ArchivedRooms { get; } = new List<Room>();
    }

    private RoomContainer Container { get; set; } = new();

    private Dictionary<Guid, Picture> Pictures { get; } = new Dictionary<Guid, Picture>();

    private string RoomsStoragePath { get; }

    public InMemoryRoomRepository(IWebHostEnvironment webHostEnv)
    {
        var saveDir = Path.Combine(webHostEnv.ContentRootPath, "App_Data");
        if (!Directory.Exists(saveDir)) Directory.CreateDirectory(saveDir);

        this.RoomsStoragePath = Path.Combine(saveDir, "rooms.json");
        if (File.Exists(this.RoomsStoragePath))
        {
            var roomsContainerJsonStr = File.ReadAllText(this.RoomsStoragePath);
            this.Container = JsonSerializer.Deserialize<RoomContainer>(roomsContainerJsonStr) ?? new();
        }
    }

    public Task AddRoomAsync(Room room)
    {
        lock (this.Container) this.Container.Rooms.Add(room);
        this.SaveRooms();
        return Task.CompletedTask;
    }

    private void SaveRooms()
    {
        var roomsContainerJsonStr = default(string);
        lock (this.Container) roomsContainerJsonStr = JsonSerializer.Serialize(this.Container);
        lock (this) File.WriteAllText(this.RoomsStoragePath, roomsContainerJsonStr);
    }

    public Task<Room?> FindRoomAsync(int roomNumber)
    {
        lock (this.Container)
        {
            var room = this.Container.Rooms.FirstOrDefault(room => room.RoomNumber == roomNumber);
            return Task.FromResult(room);
        }
    }

    public Task<Picture?> GetScreenShotAsync(Guid sessionId)
    {
        lock (this.Pictures)
        {
            this.Pictures.TryGetValue(sessionId, out var picture);
            return Task.FromResult(picture);
        }
    }

    public bool RoomExists(int roomNumber)
    {
        lock (this.Container)
        {
            return this.Container.Rooms.Any(room => room.RoomNumber == roomNumber);
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
        lock (this.Container)
        {
            var roomsToSweep = this.Container.Rooms.Where(room => room.CreatedAt < limit).ToArray();
            foreach (var roomToSweep in roomsToSweep) this.Container.Rooms.Remove(roomToSweep);
        }
        this.SaveRooms();
        return Task.CompletedTask;
    }

    public Task<Room?> UpdateRoomAsync(int roomNumber, Func<Room, bool> action)
    {
        var room = default(Room);
        lock (this.Container)
        {
            room = this.Container.Rooms.FirstOrDefault(r => r.RoomNumber == roomNumber);
            if (room != null) action(room);
        }
        this.SaveRooms();
        return Task.FromResult(room);
    }

    public Task<Room?> FindRoomIncludesArchivedAsync(int roomNumber, Guid sessionId)
    {
        var room = this.Container.Rooms.FirstOrDefault(r => r.RoomNumber == roomNumber && r.SessionID == sessionId);
        if (room != null) return Task.FromResult<Room?>(room);

        room = this.Container.ArchivedRooms.FirstOrDefault(r => r.RoomNumber == roomNumber && r.SessionID == sessionId);
        return Task.FromResult(room);
    }

    public async Task ArchiveRoomAsync(int roomNumber)
    {
        var room = await this.FindRoomAsync(roomNumber);
        if (room == null) return;
        lock (this.Container)
        {
            if (this.Container.ArchivedRooms.Any(r => r.SessionID == room.SessionID)) return;
            var archivedRoom = JsonSerializer.Deserialize<Room>(JsonSerializer.Serialize(room));
            if (archivedRoom == null) return;
            this.Container.ArchivedRooms.Add(archivedRoom);
        }
    }
}
