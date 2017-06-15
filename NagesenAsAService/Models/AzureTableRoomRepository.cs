using System;
using System.Configuration;
using System.IO;
using System.Threading.Tasks;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using Microsoft.WindowsAzure.Storage.Table;

namespace NagesenAsAService.Models
{
    public class AzureTableRoomRepository : IRoomRepository
    {
        private Lazy<CloudTable> Rooms { get; }

        private Lazy<CloudBlobContainer> ScreenShots { get; }

        private Random RandomNumberGenerator { get; } = new Random();

        public AzureTableRoomRepository()
        {
            var connStr = ConfigurationManager.AppSettings["StorageConnectionString"];
            var storageAccount = CloudStorageAccount.Parse(connStr);

            this.Rooms = new Lazy<CloudTable>(() =>
            {
                var tableClient = storageAccount.CreateCloudTableClient();
                var rooms = tableClient.GetTableReference("NaaSRooms");
                rooms.CreateIfNotExists();
                return rooms;
            });

            this.ScreenShots = new Lazy<CloudBlobContainer>(() =>
            {
                var blobClient = storageAccount.CreateCloudBlobClient();
                var screenShots = blobClient.GetContainerReference("naasscreenshots");
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
            for (;;)
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

            var blockBlob = this.ScreenShots.Value.GetBlockBlobReference(room.SessionID.ToString("N"));
            await blockBlob.UploadFromByteArrayAsync(image, 0, image.Length);
        }

        public async Task<Picture> GetScreenShotAsync(Guid sessionId)
        {
            var blockBlob = this.ScreenShots.Value.GetBlockBlobReference(sessionId.ToString("N"));

            try { await blockBlob.FetchAttributesAsync(); }
            catch (StorageException e) when (e.RequestInformation.HttpStatusCode == 404)
            {
                return null;
            }

            return new Picture(
                blockBlob.Properties.LastModified.Value.DateTime,
                () =>
                {
                    var imageBytes = new byte[blockBlob.Properties.Length];
                    blockBlob.DownloadToByteArray(imageBytes, 0);
                    return imageBytes;
                });
        }
    }
}