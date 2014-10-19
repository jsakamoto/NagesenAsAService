using System;
using System.Configuration;
using System.Diagnostics;
using System.Net;
using System.Net.Mail;
using Newtonsoft.Json;

namespace NagesenAsAService
{
    public class SendMailListener : TraceListener
    {
        public override void WriteLine(string message)
        {
            //NOP
        }

        public override void Write(string message)
        {
            //NOP
        }

        public override void TraceEvent(TraceEventCache eventCache, string source, TraceEventType eventType, int id, string message)
        {
            if (this.Filter != null)
            {
                var shouldTrace = this.Filter.ShouldTrace(eventCache, source, eventType, id, message, null, null, null);
                if (!shouldTrace) return;
            }

            try { SendNotifyMail(); }
            catch { }
        }

        private void SendNotifyMail()
        {
            var smtpConfigJson = ConfigurationManager.AppSettings["smtp:config"];
            if (string.IsNullOrWhiteSpace(smtpConfigJson)) return;
            using (var smtpClient = CreateSmtpClient(smtpConfigJson))
            {
                var from = ConfigurationManager.AppSettings["errormail.from"];
                var to = ConfigurationManager.AppSettings["errormail.to"];
                var subject = ConfigurationManager.AppSettings["errormail.subject"];
                var mailMsg = new MailMessage(from, to)
                {
                    Subject = subject
                };

                smtpClient.Send(mailMsg);
            }
        }

        private SmtpClient CreateSmtpClient(string smtpConfigJson)
        {
            var smtpClient = JsonConvert.DeserializeObject<SmtpClient>(smtpConfigJson);
            var credential = JsonConvert.DeserializeObject<NetworkCredential>(smtpConfigJson);
            smtpClient.Credentials = credential;
            return smtpClient;
        }
    }
}