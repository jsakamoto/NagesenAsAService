using System;

namespace NagesenAsAService.Models
{
    public class RoomContextSummary : RoomSettings
    {
        public int roomNumber { get; private set; }

        public Guid sessionID { get; set; }

        public RoomContextSummary()
        {
        }

        public RoomContextSummary(Room room) : base(
            room.Title,
            room.TwitterHashtag,
            room.AllowDisCoin)
        {
            this.roomNumber = room.RoomNumber;
            this.sessionID = room.SessionID;
        }
    }
}
