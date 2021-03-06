using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NagesenAsAService.Hubs;
using NagesenAsAService.Services.RoomRepository;
using NagesenAsAService.Services.UrlShorter;

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
            services.AddControllers();
            services.AddRazorPages();

            var signalRServerBuilder = services.AddSignalR();
            if (!string.IsNullOrEmpty(this.Configuration["Azure:SignalR:ConnectionString"]))
                signalRServerBuilder.AddAzureSignalR();

            services.AddSingleton<IRoomRepository, AzureTableRoomRepository>();
            services.AddSingleton<IUrlShorter, BitlyUrlShorter>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseHttpsRedirection();

            app.UseStaticFiles();
            app.UseRouting();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapRazorPages();
                endpoints.MapControllers();
                endpoints.MapHub<TestHub>("/testhub");
            });
        }
    }
}
