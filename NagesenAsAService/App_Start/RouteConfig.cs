using System;
using System.Web.Mvc;
using System.Web.Routing;

namespace NagesenAsAService
{
    public class RouteConfig
    {
        internal static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute(
                name: "Room",
                url: "Room/{id}/{action}/{session}",
                defaults: new { controller = "Default", action = "Controller", session = UrlParameter.Optional }
            );

            routes.MapRoute(
                name: "Default",
                url: "{action}/{id}",
                defaults: new { controller = "Default", action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}