﻿using System;
using System.Web.Http;
using System.Web.Optimization;
using System.Web.Routing;

namespace NagesenAsAService
{
    public class Global : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            GlobalConfiguration.Configure(WebApiConfig.Register);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
        }

        protected void Application_Error(object sender, EventArgs e)
        {
            UnhandledExceptionLogger.Write(Server.GetLastError());
        }
    }
}
