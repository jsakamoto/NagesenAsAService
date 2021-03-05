using System;

namespace NagesenAsAService.Models
{
    public class RoomContext
    {
        public int roomNumber { get; private set; }

        public Guid sessionID { get; set; }

        public string title { get; set; }

        public string twitterHashtag { get; set; }

        public bool allowDisCoin { get; set; }

        public int countOfLike { get; set; }

        public int countOfDis { get; set; }

        public RoomContext()
        {
        }

        public RoomContext(Room room)
        {
            this.roomNumber = room.RoomNumber;
            this.sessionID = room.SessionID;
            this.title = room.Title;
            this.twitterHashtag = room.TwitterHashtag;
            this.allowDisCoin = room.AllowDisCoin;
            this.countOfLike = room.CountOfNageSen;
            this.countOfDis = room.CountOfAoriSen;
        }
    }
}