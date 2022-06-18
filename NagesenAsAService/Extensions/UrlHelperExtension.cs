using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace NagesenAsAService.Extensions;

public static class UrlHelperExtension
{
    public static string AppUrl(this IUrlHelper urlHelper)
    {
        var request = urlHelper.ActionContext.HttpContext.Request;
        var requestUri = new Uri(request.GetDisplayUrl());
        return requestUri.GetLeftPart(UriPartial.Scheme | UriPartial.Authority);
    }
}