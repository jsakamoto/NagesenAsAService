using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NagesenAsAService.Extensions.DependencyInjection;
using NagesenAsAService.Hubs;
using NagesenAsAService.Middlewares;
using Toolbelt.Extensions.DependencyInjection;

namespace NagesenAsAService
{
    public class Startup
    {
        private IConfiguration Configuration { get; }

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddHttpClient();
            services.AddControllersWithViews();
            services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie();
            services.AddApplicationInsightsTelemetry();
            services.AddAntiforgery(options => options.HeaderName = "X-ANTIFORGERY-TOKEN");

            var signalRServerBuilder = services.AddSignalR();
            if (!string.IsNullOrEmpty(this.Configuration["Azure:SignalR:ConnectionString"]))
                signalRServerBuilder.AddAzureSignalR();

            services.AddNaaSRoomRepository(this.Configuration);
            services.AddNaaSUrlShorter(this.Configuration);
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseCssLiveReload();
            }
            else
            {
                app.UseHsts();
                app.UseHttpsRedirection();
            }

            app.UseAuthentication();
            app.UseMiddleware<TrackingAuthMiddleware>();
            app.UseStaticFiles();
            app.UseRouting();

            var supportedCultures = new[] { "en", "ja" };
            var localizationOptions = new RequestLocalizationOptions().SetDefaultCulture(supportedCultures[0])
                .AddSupportedCultures(supportedCultures)
                .AddSupportedUICultures(supportedCultures);
            app.UseRequestLocalization(localizationOptions);

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapHub<NaaSHub>("/naashub");
            });
        }
    }
}
