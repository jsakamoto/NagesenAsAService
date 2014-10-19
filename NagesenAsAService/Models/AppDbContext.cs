using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace NagesenAsAService.Models
{
    public class AppDbContext : DbContext
    {
        public DbSet<Room> Rooms { get; set; }

        public AppDbContext()
        {
#if DEBUG
            this.Database.Log = log => System.Diagnostics.Debug.WriteLine(log);
#endif
        }
    }
}