using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using NagesenAsAService.Extensions;

namespace NagesenAsAService.Middlewares;

public class TrackingAuthMiddleware
{
    private readonly RequestDelegate _next;

    public TrackingAuthMiddleware(RequestDelegate next)
    {
        this._next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var needSignIn = context.User?.Identity?.IsAuthenticated == false;
        if (needSignIn)
        {
            var userName = Guid.NewGuid().ToBase64String();
            var identity = new ClaimsIdentity(
                new[]{
                    new Claim(ClaimTypes.Name, userName),
                    new Claim(ClaimTypes.NameIdentifier, userName),
            }, authenticationType: CookieAuthenticationDefaults.AuthenticationScheme);


            var principal = new ClaimsPrincipal(identity);

            await context.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                new AuthenticationProperties { IsPersistent = true });
            context.User = principal;
        }

        await this._next(context);
    }
}
