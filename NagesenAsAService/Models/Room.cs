using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace NagesenAsAService.Models
{
    public class Room
    {
        public int RoomID { get; set; }

        [Index("IX_RoomNumber", IsUnique = true)]
        public int RoomNumber { get; set; }

        public string Url { get; set; }

        public string ShortUrl { get; set; }

        public string OwnerUserID { get; set; }

        public string Title { get; set; }

        [DisplayFormat(ConvertEmptyStringToNull = false)]
        public string TwitterHashtag { get; set; }

        public bool AllowDisCoin { get; set; }

        public int CountOfNageSen { get; set; }

        public int CountOfAoriSen { get; set; }

        public DateTime CreatedAt { get; set; }

        [Timestamp]
        public byte[] RowVersion { get; set; }

        public Room()
        {
            this.TwitterHashtag = "";
            this.CreatedAt = DateTime.UtcNow;
        }
    }
}