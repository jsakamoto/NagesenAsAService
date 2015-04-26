using System;
using System.Linq;
using System.Security.Claims;
using System.Security.Principal;
using System.Threading.Tasks;
using Microsoft.Owin;
using Microsoft.Owin.Security;

namespace NagesenAsAService
{
    public class TrackingAuthMiddleware : OwinMiddleware
    {
        public TrackingAuthMiddleware(OwinMiddleware next)
            : base(next)
        {
        }

        public override Task Invoke(IOwinContext context)
        {
            const string ClaimType_IdentityProvider = "http://schemas.microsoft.com/accesscontrolservice/2010/07/claims/identityprovider";
            var needSignIn = context.Authentication.User.Identity.IsAuthenticated == false;
            if (context.Authentication.User.Identity.IsAuthenticated == true)
            {
                var orgIdentity = context.Authentication.User.Identity as ClaimsIdentity;
                if (orgIdentity == null || orgIdentity.Claims.Any(c => c.Type == ClaimType_IdentityProvider) == false)
                {
                    needSignIn = true;
                }
            }
            if (needSignIn)
            {
                var userName = Guid.NewGuid().ToBase64String();
                var identity = new ClaimsIdentity(new GenericIdentity(userName, "TrackingAuth"), new[]{
                    new Claim(ClaimTypes.NameIdentifier, userName),
                    new Claim(ClaimType_IdentityProvider, this.GetType().Name)
                });
                context.Authentication.SignIn(new AuthenticationProperties
                {
                    IsPersistent = true
                }, identity);
                context.Request.User = new ClaimsPrincipal(identity);
            }

            return this.Next.Invoke(context);
        }
    }
}