using System.Configuration;

namespace NagesenAsAService
{
    [System.Diagnostics.DebuggerNonUserCodeAttribute]
    [System.Runtime.CompilerServices.CompilerGeneratedAttribute]
    public static class AppSettings
    {
        public static class Account
        {
            public static string Bitly
            {
                get { return ConfigurationManager.AppSettings["account.bitly"]; }
            }
        }

        public static class App
        {
            public static string SrcProvider
            {
                get { return ConfigurationManager.AppSettings["App.SrcProvider"]; }
            }

            public static string SrcUrl
            {
                get { return ConfigurationManager.AppSettings["App.SrcUrl"]; }
            }
        }

        public static class Errormail
        {
            public static string From
            {
                get { return ConfigurationManager.AppSettings["errormail.from"]; }
            }

            public static string Subject
            {
                get { return ConfigurationManager.AppSettings["errormail.subject"]; }
            }

            public static string To
            {
                get { return ConfigurationManager.AppSettings["errormail.to"]; }
            }
        }

        public static class Site
        {
            public static string Timezone
            {
                get { return ConfigurationManager.AppSettings["site:timezone"]; }
            }
        }

        public static class Smtp
        {
            public static string Config
            {
                get { return ConfigurationManager.AppSettings["smtp:config"]; }
            }
        }
    }
}

