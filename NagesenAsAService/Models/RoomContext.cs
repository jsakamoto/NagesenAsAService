namespace NagesenAsAService.Models
{
    public class RoomContext : RoomContextSummary
    {
        public int countOfLike { get; set; }

        public int countOfDis { get; set; }

        public RoomContext()
        {
        }

        public RoomContext(Room room) : base(room)
        {
            this.countOfLike = room.CountOfNageSen;
            this.countOfDis = room.CountOfAoriSen;
        }
    }
}