namespace NagesenAsAService.Models
{
    public class RoomSettings
    {
        public string Title { get; set; }

        public string TwitterHashtag { get; set; }

        public bool AllowDisCoin { get; set; }

        public RoomSettings()
        {
        }

        public RoomSettings(string title, string twitterHashtag, bool allowDisCoin)
        {
            Title = title;
            TwitterHashtag = twitterHashtag;
            AllowDisCoin = allowDisCoin;
        }
    }
}
