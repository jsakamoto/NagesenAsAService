using System;
using Newtonsoft.Json;

namespace NagesenAsAService.Models
{
    public class reCAPTCHAVerificationResponse
    {
        public bool Success { get; set; }

        public double Score { get; set; }

        // timestamp of the challenge load (ISO format yyyy-MM-dd'T'HH:mm:ssZZ)
        [JsonProperty("challenge_ts")]
        public DateTimeOffset ChallengeTimestamp { get; set; }

        // the hostname of the site where the reCAPTCHA was solved
        public string Hostname { get; set; }

        public string Action { get; set; }

        [JsonProperty("error-codes")]
        public string[] ErrorCodes { get; set; } = new string[0];
    }
}
