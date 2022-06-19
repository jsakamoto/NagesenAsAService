using Azure;
using Azure.Data.Tables;
using Azure.Storage.Blobs;
using NagesenAsAService.Models;

namespace NagesenAsAService.Services.RoomRepository;

public class AzureTableRoomRepository : IRoomRepository
{
    private TableClient Rooms { get; }

    private TableClient ArchivedRooms { get; }

    private BlobContainerClient ScreenShots { get; }

    private Random RandomNumberGenerator { get; } = new Random();

    public AzureTableRoomRepository(IConfiguration configuration)
    {
        var connStr = configuration.GetConnectionString("NaaSStorage");

        var serviceClient = new TableServiceClient(connStr);
        this.Rooms = serviceClient.GetTableClient("NaaSRooms");
        this.Rooms.CreateIfNotExists();
        this.ArchivedRooms = serviceClient.GetTableClient("NaaSRoomsArchived");
        this.ArchivedRooms.CreateIfNotExists();

        var blobServiceClient = new BlobServiceClient(connStr);
        this.ScreenShots = blobServiceClient.GetBlobContainerClient("naasscreenshots");
        this.ScreenShots.CreateIfNotExists();
    }

    public bool RoomExists(int roomNumber)
    {
        var (partitionKey, rowKey) = Room.GetKeys(roomNumber);
        try
        {
            var room = (Room)this.Rooms.GetEntity<Room>(partitionKey, rowKey);
            return room != null;
        }
        catch (RequestFailedException e) when (e.Status == 404) { return false; }
    }

    public Task AddRoomAsync(Room room)
    {
        return this.Rooms.AddEntityAsync(room);
    }

    public async Task<Room?> FindRoomAsync(int roomNumber)
    {
        var (partitionKey, rowKey) = Room.GetKeys(roomNumber);
        try { return await this.Rooms.GetEntityAsync<Room>(partitionKey, rowKey); }
        catch (RequestFailedException e) when (e.Status == 404) { return null; }
    }

    public async Task<Room?> FindRoomIncludesArchivedAsync(int roomNumber, Guid sessionId)
    {
        var activeRoom = await this.FindRoomAsync(roomNumber);
        if (activeRoom != null && activeRoom.SessionID == sessionId) return activeRoom;

        var (partitionKey, rowKey) = Room.GetKeysForArchived(roomNumber, sessionId);
        try { return await this.ArchivedRooms.GetEntityAsync<Room>(partitionKey, rowKey); }
        catch (RequestFailedException e) when (e.Status == 404) { return null; }
    }

    public async Task<Room?> UpdateRoomAsync(int roomNumber, Func<Room, bool> action)
    {
        for (; ; )
        {
            var room = await this.FindRoomAsync(roomNumber);
            if (room == null) return null;

            var allowUpdate = action(room);
            try
            {
                if (allowUpdate)
                {
                    await this.Rooms.UpdateEntityAsync(room, room.ETag, TableUpdateMode.Replace);
                }
                return room;
            }
            catch (RequestFailedException e) when (e.Status == 412)
            {
                // NOP - random wait & continue to next retry loop...
            }
            var rate = this.RandomNumberGenerator.Next(10, 50);
            await Task.Delay(10 * rate);
        }
    }

    public async Task ArchiveRoomAsync(int roomNumber)
    {
        var room = await this.FindRoomAsync(roomNumber);
        if (room == null) return;

        var (partitionKey, rowKey) = Room.GetKeysForArchived(room.RoomNumber, room.SessionID);
        room.PartitionKey = partitionKey;
        room.RowKey = rowKey;
        await this.ArchivedRooms.AddEntityAsync(room);
    }

    public async Task SweepRoomsAsync(DateTime limit)
    {
        var roomsToSwep = this.Rooms.Query<Room>(room => room.Timestamp < limit).ToArray();
        foreach (var room in roomsToSwep)
        {
            await this.ArchiveRoomAsync(room.RoomNumber);
            await this.Rooms.DeleteEntityAsync(room.PartitionKey, room.RowKey);
        }
    }

    public async Task SaveScreenShotAsync(int roomNumber, byte[] image)
    {
        var room = await this.UpdateRoomAsync(roomNumber, r =>
        {
            r.UpdateScreenSnapshotAt = DateTime.UtcNow;
            return true;
        });
        if (room == null) return;

        var blockBlob = this.ScreenShots.GetBlobClient(room.SessionID.ToString("N"));
        using var memoryStream = new MemoryStream(image);
        await blockBlob.UploadAsync(memoryStream, overwrite: true);
    }

    public async Task<Picture?> GetScreenShotAsync(Guid sessionId)
    {
        try
        {
            var blockBlob = this.ScreenShots.GetBlobClient(sessionId.ToString("N"));
            var response = await blockBlob.GetPropertiesAsync();
            var properties = response.Value;

            return new Picture(
                properties.LastModified.DateTime,
                () =>
                {
                    using var memoryStream = new MemoryStream(capacity: (int)properties.ContentLength);
                    blockBlob.DownloadTo(memoryStream);
                    return memoryStream.ToArray();
                });
        }
        catch (RequestFailedException e) when (e.Status == 404)
        {
            return null;
        }
    }
}