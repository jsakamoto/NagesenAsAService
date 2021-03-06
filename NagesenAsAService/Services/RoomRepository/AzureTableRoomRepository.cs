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
        private Lazy<CloudTable> Rooms { get; }

        private Lazy<BlobContainerClient> ScreenShots { get; }

        private Random RandomNumberGenerator { get; } = new Random();

        public AzureTableRoomRepository(IConfiguration configuration)
        {
            var connStr = configuration.GetConnectionString("NaaSStorage");

            this.Rooms = new Lazy<CloudTable>(() =>
            {
                var storageAccount = CloudStorageAccount.Parse(connStr);
                var tableClient = storageAccount.CreateCloudTableClient();
                var rooms = tableClient.GetTableReference("NaaSRooms");
                rooms.CreateIfNotExists();
                return rooms;
            });

            this.ScreenShots = new Lazy<BlobContainerClient>(() =>
            {
                var blobServiceClient = new BlobServiceClient(connStr);
                var screenShots = blobServiceClient.CreateBlobContainer("naasscreenshots").Value;
                screenShots.CreateIfNotExists();
                return screenShots;
            });
        }

        public bool RoomExists(int roomNumber)
        {
            var partitionKey = Room.RoomNumberToPartitionKey(roomNumber);
            var rowKey = Room.RoomNumberToRowKey(roomNumber);
            var result = this.Rooms.Value.Execute(TableOperation.Retrieve<Room>(partitionKey, rowKey));
            return result.Result != null;
        }

        public Task AddRoomAsync(Room room)
        {
            return this.Rooms.Value.ExecuteAsync(TableOperation.Insert(room));
        }

        public async Task<Room> FindRoomAsync(int roomNumber)
        {
            var partitionKey = Room.RoomNumberToPartitionKey(roomNumber);
            var rowKey = Room.RoomNumberToRowKey(roomNumber);
            var result = await this.Rooms.Value.ExecuteAsync(TableOperation.Retrieve<Room>(partitionKey, rowKey));
            return result.Result as Room;
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
            return this.Rooms.Value.ExecuteAsync(TableOperation.Replace(room));
        }

        public async Task SweepRoomsAsync(DateTime limit)
        {
            var rangeQuery = new TableQuery<Room>()
                .Where(TableQuery.GenerateFilterConditionForDate("Timestamp", QueryComparisons.LessThan, limit));

            var roomsToSwep = this.Rooms.Value.ExecuteQuery(rangeQuery);
            foreach (var room in roomsToSwep)
            {
                await this.Rooms.Value.ExecuteAsync(TableOperation.Delete(room));
            }
        }

        public async Task SaveScreenShotAsync(int roomNumber, byte[] image)
        {
            var room = await this.UpdateRoomAsync(roomNumber, r =>
            {
                r.UpdateScreenSnapshotAt = DateTime.UtcNow;
                return true;
            });

            var blockBlob = this.ScreenShots.Value.GetBlobClient(room.SessionID.ToString("N"));
            using var memoryStream = new MemoryStream(image);
            await blockBlob.UploadAsync(memoryStream);
        }

        public async Task<Picture> GetScreenShotAsync(Guid sessionId)
        {
            var blockBlob = this.ScreenShots.Value.GetBlobClient(sessionId.ToString("N"));

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