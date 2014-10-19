using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace NagesenAsAService
{
    public static class UrlHelperExtension
    {
        public static string AppUrl(this UrlHelper urlHelper)
        {
            var request = urlHelper.RequestContext.HttpContext.Request;
            return request.Url.GetLeftPart(UriPartial.Scheme | UriPartial.Authority);
        }
    }
}