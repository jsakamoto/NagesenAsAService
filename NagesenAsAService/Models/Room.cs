#nullable enable
using System;
using System.ComponentModel.DataAnnotations;
using System.Security.Principal;
using Microsoft.Azure.Cosmos.Table;

namespace NagesenAsAService.Models
{
    public class Room : TableEntity
    {
        public int RoomNumber { get; set; }

        public string Url { get; set; }

        public string ShortUrl { get; set; }

        public string OwnerUserID { get; set; }

        public Guid SessionID { get; set; }

        public string Title { get; set; }

        [DisplayFormat(ConvertEmptyStringToNull = false)]
        public string TwitterHashtag { get; set; }

        public bool AllowDisCoin { get; set; }

        public string UnitOfLikeCoin { get; set; } = "Yen";

        public string UnitOfDisCoin { get; set; } = "Dis";

        public int CountOfNageSen { get; set; }

        public int CountOfAoriSen { get; set; }

        public DateTime UpdateScreenSnapshotAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public Room()
        {
            this.CreatedAt = DateTime.UtcNow;
            this.Url = "";
            this.Title = "";
            this.ShortUrl = "";
            this.OwnerUserID = "";
            this.TwitterHashtag = "";
            this.Reset();
        }

        public static (string PartitionKey, string RowKey) GetKeys(int roomNumber)
        {
            return ((roomNumber / 100).ToString(), roomNumber.ToString("D4"));
        }

        public static (string PartitionKey, string RowKey) GetKeysForArchived(int roomNumber, Guid sessionId)
        {
            return (roomNumber.ToString("D4"), sessionId.ToString("N"));
        }

        public bool Authorize(IPrincipal? user)
        {
            return this.OwnerUserID == (user?.Identity?.Name ?? default(string));
        }

        public void Reset()
        {
            this.SessionID = Guid.NewGuid();
            this.UpdateScreenSnapshotAt = DateTime.MaxValue;
            this.CountOfNageSen = 0;
            this.CountOfAoriSen = 0;
        }
    }
}