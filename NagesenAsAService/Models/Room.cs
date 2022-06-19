using System.ComponentModel.DataAnnotations;
using System.Security.Principal;
using Azure;
using Azure.Data.Tables;

namespace NagesenAsAService.Models;

public class Room : ITableEntity
{
    public int RoomNumber { get; set; }

    public string Url { get; set; } = "";

    public string ShortUrl { get; set; } = "";

    public string OwnerUserID { get; set; } = "";

    public Guid SessionID { get; set; }

    public string Title { get; set; } = "";

    [DisplayFormat(ConvertEmptyStringToNull = false)]
    public string TwitterHashtag { get; set; } = "";

    public bool AllowDisCoin { get; set; }

    public string UnitOfLikeCoin { get; set; } = "Yen";

    public string UnitOfDisCoin { get; set; } = "Dis";

    public int CountOfNageSen { get; set; }

    public int CountOfAoriSen { get; set; }

    public DateTime UpdateScreenSnapshotAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string PartitionKey { get; set; } = "";

    public string RowKey { get; set; } = "";

    public DateTimeOffset? Timestamp { get; set; }

    public ETag ETag { get; set; }

    public Room()
    {
        this.Reset();
    }

    public Room(int roomNumber, string? ownerUserID, string url, string shortUrl)
    {
        this.RoomNumber = roomNumber;
        this.OwnerUserID = ownerUserID ?? "";
        this.Url = url;
        this.ShortUrl = shortUrl;
        (this.PartitionKey, this.RowKey) = GetKeys(roomNumber);

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
        this.UpdateScreenSnapshotAt = DateTime.MaxValue.ToUniversalTime();
        this.CountOfNageSen = 0;
        this.CountOfAoriSen = 0;
    }
}