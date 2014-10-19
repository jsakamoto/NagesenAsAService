using System;
using System.Configuration;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Web;

namespace NagesenAsAService
{
    public class LogToFileListener : TraceListener
    {
        private string _LogFolder;

        public LogToFileListener()
        {
        }

        public LogToFileListener(string initializeData)
        {
            _LogFolder = initializeData;
        }

        public override void WriteLine(string message)
        {
            //NOP
        }

        public override void Write(string message)
        {
            //NOP
        }

        public override void TraceEvent(TraceEventCache eventCache, string source, TraceEventType eventType, int id, string format, params object[] args)
        {
            var message = string.Format(format, args);
            TraceEvent(eventCache, source, eventType, id, message);
        }

        public override void TraceEvent(TraceEventCache eventCache, string source, TraceEventType eventType, int id, string message)
        {
            if (this.Filter != null)
            {
                var shouldTrace = this.Filter.ShouldTrace(eventCache, source, eventType, id, message, null, null, null);
                if (!shouldTrace) return;
            }

            try { LogToFile(message); }
            catch { }
        }

        private void LogToFile(string message)
        {
            var context = HttpContext.Current;
            var server = context != null ? context.Server : null;
            var dir = server != null ? server.MapPath(_LogFolder) : null;
            if (dir == null) return;
            if (Directory.Exists(dir) == false) Directory.CreateDirectory(dir);

            var timeZoneId = ConfigurationManager.AppSettings["site:timezone"] ?? "UTC";
            var timeZoneInfo = default(TimeZoneInfo);
            try { timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId); }
            catch { timeZoneInfo = TimeZoneInfo.Utc; }
            var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZoneInfo);
            var nowStr = string.Format("{0:yyyy-MM-dd HH.mm.ss} UTC{1}{2:hhmm}",
                now,
                timeZoneInfo.BaseUtcOffset.Hours < 0 ? "-" : "+",
                timeZoneInfo.BaseUtcOffset);
            var fnameBase = nowStr + " {0:D3}.txt";
            var logFilePath = Enumerable.Range(1, int.MaxValue)
                .Select(n => Path.Combine(dir, string.Format(fnameBase, n)))
                .First(path => File.Exists(path) == false);

            File.WriteAllLines(logFilePath, new[] { 
                nowStr,
                message
            });
        }
    }
}