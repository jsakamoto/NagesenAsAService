﻿using System.Web;
using System.Web.Optimization;

namespace NagesenAsAService
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/js").Include(
                "~/Scripts/jquery-{version}.js",
                "~/Scripts/angular.js",
                "~/Scripts/jquery.signalR-{version}.js"
                ));

            bundles.Add(new ScriptBundle("~/bundles/jquery")
            {
                CdnPath = "//ajax.aspnetcdn.com/ajax/jquery/jquery-1.10.2.min.js",
                CdnFallbackExpression = "window.jQuery"
            }.Include("~/Scripts/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/angularjs")
            {
                CdnPath = "//ajax.googleapis.com/ajax/libs/angularjs/1.2.24/angular.min.js",
                CdnFallbackExpression = "window.angular"
            }.Include("~/Scripts/angular.js"));

            bundles.Add(new ScriptBundle("~/bundles/jquery.signalR")
            {
                CdnPath = "//ajax.aspnetcdn.com/ajax/signalr/jquery.signalr-2.1.0.min.js",
                CdnFallbackExpression = "window.jQuery.connection"
            }.Include("~/Scripts/jquery.signalR-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/box-js").Include(
                "~/Scripts/Box2dWeb-2.1.a.3.js",
                "~/Scripts/html2canvas.js",
                "~/Views/Default/Box.js",
                "~/Views/Default/TweetService.js",
                "~/Views/Default/RoomContextService.js",
                "~/Views/Default/HubClientService.js",
                "~/Views/Default/SettingsMenuController.js",
                "~/Scripts/sharebox.js"
                ));

            bundles.Add(new ScriptBundle("~/bundles/controller-js").Include(
                "~/Views/Default/controller.js",
                "~/Views/Default/TweetService.js",
                "~/Scripts/sharebox.js"
                ));

            bundles.Add(new StyleBundle("~/content/css").Include(
                "~/Content/normalize.css",
                "~/Content/md-iconfont.css",
                "~/Content/site.css"));
            bundles.Add(new StyleBundle("~/content/index-css").Include(
                "~/Content/footer.css"));
            bundles.Add(new StyleBundle("~/content/box-css").Include(
                "~/Content/box.css",
                "~/Content/sharebox.css"));
            bundles.Add(new StyleBundle("~/content/controller-css").Include(
                "~/Content/controller.css",
                "~/Content/sharebox.css"));
        }
    }
}
