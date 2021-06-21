namespace NagesenAsAService.Models
{
    public class RoomSettings
    {
        public string Title { get; set; }

        public string TwitterHashtag { get; set; }

        public bool AllowDisCoin { get; set; }

        public string UnitOfLikeCoin { get; set; }

        public string UnitOfDisCoin { get; set; }

        public RoomSettings()
        {
        }

        public RoomSettings(string title, string twitterHashtag, bool allowDisCoin, string unitOfLineCoin, string unitOfDisCoin)
        {
            Title = title;
            TwitterHashtag = twitterHashtag;
            AllowDisCoin = allowDisCoin;
            UnitOfLikeCoin = unitOfLineCoin;
            UnitOfDisCoin = unitOfDisCoin;
        }
    }
}
