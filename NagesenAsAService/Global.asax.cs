using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Http;
using System.Web.Optimization;
using System.Web.Routing;
using NagesenAsAService.Migrations;
using NagesenAsAService.Models;

namespace NagesenAsAService
{
    public class Global : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            GlobalConfiguration.Configure(WebApiConfig.Register);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
            Database.SetInitializer(new MigrateDatabaseToLatestVersion<AppDbContext, Configuration>());
        }

        protected void Application_Error(object sender, EventArgs e)
        {
            UnhandledExceptionLogger.Write(Server.GetLastError());
        }
    }
}
