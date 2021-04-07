﻿using System;
using System.ComponentModel.DataAnnotations;
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

        public int CountOfNageSen { get; set; }

        public int CountOfAoriSen { get; set; }

        public DateTime UpdateScreenSnapshotAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public Room()
        {
            this.CreatedAt = DateTime.UtcNow;
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

        public void Reset()
        {
            this.SessionID = Guid.NewGuid();
            this.UpdateScreenSnapshotAt = DateTime.MaxValue;
            this.CountOfNageSen = 0;
            this.CountOfAoriSen = 0;
        }
    }
}