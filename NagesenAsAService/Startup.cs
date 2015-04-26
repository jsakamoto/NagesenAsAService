using System;
using System.Linq;
using Microsoft.Owin;
using Microsoft.Owin.Security.Cookies;
using Owin;

[assembly: OwinStartup(typeof(NagesenAsAService.Startup))]

namespace NagesenAsAService
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            app.UseCookieAuthentication(new CookieAuthenticationOptions
            {
                AuthenticationType = "TrackingAuth",
                ExpireTimeSpan = TimeSpan.FromDays(300)
            });

            app.Use<TrackingAuthMiddleware>();

            // For more information on how to configure your application, visit http://go.microsoft.com/fwlink/?LinkID=316888
            app.MapSignalR();
        }
    }
}
