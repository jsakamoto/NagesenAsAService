using System;
using System.IO;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Microsoft.Azure.Cosmos.Table;
using Microsoft.Extensions.Configuration;
using NagesenAsAService.Models;

namespace NagesenAsAService.Services.RoomRepository
{
    public class AzureTableRoomRepository : IRoomRepository
    {
        private CloudTable Rooms { get; }

        private CloudTable ArchivedRooms { get; }

        private BlobContainerClient ScreenShots { get; }

        private Random RandomNumberGenerator { get; } = new Random();

        public AzureTableRoomRepository(IConfiguration configuration)
        {
            var connStr = configuration.GetConnectionString("NaaSStorage");
            var storageAccount = CloudStorageAccount.Parse(connStr);
            var tableClient = storageAccount.CreateCloudTableClient();

            this.Rooms = tableClient.GetTableReference("NaaSRooms");
            this.Rooms.CreateIfNotExists();

            this.ArchivedRooms = tableClient.GetTableReference("NaaSRoomsArchived");
            this.ArchivedRooms.CreateIfNotExists();

            var blobServiceClient = new BlobServiceClient(connStr);
            this.ScreenShots = blobServiceClient.GetBlobContainerClient("naasscreenshots");
            this.ScreenShots.CreateIfNotExists();
        }

        public bool RoomExists(int roomNumber)
        {
            var (partitionKey, rowKey) = Room.GetKeys(roomNumber);
            var result = this.Rooms.Execute(TableOperation.Retrieve<Room>(partitionKey, rowKey));
            return result.Result != null;
        }

        public Task AddRoomAsync(Room room)
        {
            var (partitionKey, rowKey) = Room.GetKeys(room.RoomNumber);
            room.PartitionKey = partitionKey;
            room.RowKey = rowKey;
            return this.Rooms.ExecuteAsync(TableOperation.Insert(room));
        }

        public async Task<Room> FindRoomAsync(int roomNumber)
        {
            var (partitionKey, rowKey) = Room.GetKeys(roomNumber);
            var result = await this.Rooms.ExecuteAsync(TableOperation.Retrieve<Room>(partitionKey, rowKey));
            return result.Result as Room;
        }

        public async Task<Room> FindRoomIncludesArchivedAsync(int roomNumber, Guid sessionId)
        {
            var activeRoom = await this.FindRoomAsync(roomNumber);
            if (activeRoom != null && activeRoom.SessionID == sessionId) return activeRoom;

            var (partitionKey, rowKey) = Room.GetKeysForArchived(roomNumber, sessionId);
            var result = this.ArchivedRooms.Execute(TableOperation.Retrieve<Room>(partitionKey, rowKey));
            if (result.Result != null) return result.Result as Room;

            return null;
        }

        public async Task<Room> UpdateRoomAsync(int roomNumber, Func<Room, bool> action)
        {
            var room = await this.FindRoomAsync(roomNumber);
            for (; ; )
            {
                var allowUpdate = action(room);
                try
                {
                    if (allowUpdate)
                    {
                        await this.UpdateRoomAsync(room);
                    }
                    return room;
                }
                catch (StorageException e) when (e.RequestInformation?.HttpStatusCode == 412)
                {
                    // NOP - random wait & continue to next retry loop...
                }
                var rate = this.RandomNumberGenerator.Next(10, 50);
                await Task.Delay(20 * rate);
                room = await this.FindRoomAsync(roomNumber);
            }
        }

        public Task UpdateRoomAsync(Room room)
        {
            return this.Rooms.ExecuteAsync(TableOperation.Replace(room));
        }

        public async Task ArchiveRoomAsync(int roomNumber)
        {
            var room = await this.FindRoomAsync(roomNumber);
            if (room == null) return;

            var (partitionKey, rowKey) = Room.GetKeysForArchived(room.RoomNumber, room.SessionID);
            room.PartitionKey = partitionKey;
            room.RowKey = rowKey;
            await this.ArchivedRooms.ExecuteAsync(TableOperation.InsertOrReplace(room));
        }

        public async Task SweepRoomsAsync(DateTime limit)
        {
            var rangeQuery = new TableQuery<Room>()
                .Where(TableQuery.GenerateFilterConditionForDate("Timestamp", QueryComparisons.LessThan, limit));

            var roomsToSwep = this.Rooms.ExecuteQuery(rangeQuery);
            foreach (var room in roomsToSwep)
            {
                await ArchiveRoomAsync(room.RoomNumber);
                await this.Rooms.ExecuteAsync(TableOperation.Delete(room));
            }
        }

        public async Task SaveScreenShotAsync(int roomNumber, byte[] image)
        {
            var room = await this.UpdateRoomAsync(roomNumber, r =>
            {
                r.UpdateScreenSnapshotAt = DateTime.UtcNow;
                return true;
            });

            var blockBlob = this.ScreenShots.GetBlobClient(room.SessionID.ToString("N"));
            using var memoryStream = new MemoryStream(image);
            await blockBlob.UploadAsync(memoryStream, overwrite: true);
        }

        public async Task<Picture> GetScreenShotAsync(Guid sessionId)
        {
            var blockBlob = this.ScreenShots.GetBlobClient(sessionId.ToString("N"));

            try
            {
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
            catch (StorageException e) when (e.RequestInformation.HttpStatusCode == 404)
            {
                return null;
            }
        }
    }
}