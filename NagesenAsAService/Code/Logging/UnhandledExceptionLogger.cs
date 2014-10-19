using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Web;

namespace NagesenAsAService
{
    public static class UnhandledExceptionLogger
    {
        public static void Write(Exception e)
        {
            var logText = new StringBuilder();
            logText.AppendLine("#exception");
            logText.AppendLine(e.ToString());

            var context = HttpContext.Current;
            var request = context != null ? context.Request : null;
            if (request != null)
            {
                try
                {
                    logText
                        .AppendLine("#request")
                        .AppendLine(request.HttpMethod + " " + request.RawUrl)
                        .AppendLine(request.ServerVariables["ALL_RAW"]);
                }
                catch { }

                try
                {
                    logText.AppendLine("#server-variables");
                    foreach (var key in request.ServerVariables.AllKeys.Except("ALL_HTTP", "ALL_RAW"))
                    {
                        logText.AppendLine(key + "=" + request.ServerVariables[key]);
                    }
                }
                catch { }
            }

            try
            {
                Trace.TraceError(logText.ToString());
                Trace.Flush();
            }
            catch { }
        }
    }
}