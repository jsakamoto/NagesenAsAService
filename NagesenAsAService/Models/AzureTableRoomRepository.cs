using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Table;

namespace NagesenAsAService.Models
{
    public class AzureTableRoomRepository : IRoomRepository
    {
        private CloudTable Rooms { get; set; }

        public AzureTableRoomRepository()
        {
            this.Rooms = ConnectAzureTableStorage();
        }

        private static CloudTable ConnectAzureTableStorage()
        {
            var connStr = ConfigurationManager.AppSettings["StorageConnectionString"];
            var storageAccount = CloudStorageAccount.Parse(connStr);
            var tableClient = storageAccount.CreateCloudTableClient();
            var table = tableClient.GetTableReference("NaaSRooms");
            table.CreateIfNotExists();
            return table;
        }

        public bool RoomExists(int roomNumber)
        {
            var room = this.FindRoomAsync(roomNumber).Result;
            return room != null;
        }

        public Task AddRoomAsync(Room room)
        {
            return this.Rooms.ExecuteAsync(TableOperation.Insert(room));
        }

        public async Task<Room> FindRoomAsync(int roomNumber)
        {
            var partitionKey = Room.RoomNumberToPartitionKey(roomNumber);
            var rowKey = Room.RoomNumberToRowKey(roomNumber);
            var result = await this.Rooms.ExecuteAsync(TableOperation.Retrieve<Room>(partitionKey, rowKey));
            return result.Result as Room;
        }

        public Task UpdateRoomAsync(Room room)
        {
            return this.Rooms.ExecuteAsync(TableOperation.Replace(room));
        }

        public async Task SweepRoomsAsync(DateTime limit)
        {
            var rangeQuery = new TableQuery<Room>()
                .Where(TableQuery.GenerateFilterConditionForDate("Timestamp", QueryComparisons.LessThan, limit));

            var roomsToSwep = this.Rooms.ExecuteQuery(rangeQuery);
            foreach (var room in roomsToSwep)
            {
                await this.Rooms.ExecuteAsync(TableOperation.Delete(room));
            }
        }
    }
}