using System;

namespace NagesenAsAService.Models
{
    public class Picture
    {
        public DateTime LastModified { get; }

        private Func<byte[]> ImageBytesGetter { get; }

        public Picture(DateTime lastModified, Func<byte[]> getImageBytes)
        {
            this.LastModified = lastModified;
            this.ImageBytesGetter = getImageBytes;
        }

        public byte[] GetImageBytes()
        {
            return this.ImageBytesGetter();
        }
    }
}