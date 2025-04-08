@inherits Microsoft.AspNet.Scaffolding.Templating.RazorTemplateBase
@{
  var Model = ObjectModel as Microsoft.WebTools.Scaffolding.Core.Scaffolders.Dependency.ReadMeModel;
  var index = 1;
}
ASP.NET Core MVC dependencies have been added to the project.
(These dependencies include packages required to enable scaffolding)

However you may still need to do make changes to your project.

@{
if (Model.IsStartupChangesNeeded){
@:@index. Suggested changes to Startup class:

@:    @index.1 Add a constructor:
@:        public IConfiguration Configuration { get; }
@:
@:        public Startup(IConfiguration configuration)
@:        {
@:            Configuration = configuration;
@:        }
@:
@:    @index.2 Add MVC services:
@:        public void ConfigureServices(IServiceCollection services)
@:        {
@:            // Add framework services.
@:            services.AddMvc();
@:       }
@:
@:    @index.3 Configure web app to use MVC routing:
@:
@:        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
@:        {
@:            if (env.IsDevelopment())
@:            {
@:                app.UseDeveloperExceptionPage();
@:            }
if (!Model.IsInstallMinimalDependencies)
{
@:            else
@:            {
@:                app.UseExceptionHandler("/Home/Error");
@:            }
}
@:
@:            app.UseStaticFiles();
@:
@:            app.UseMvc(routes =>
@:            {
@:                routes.MapRoute(
@:                    name: "default",
@:                    template: "{controller=Home}/{action=Index}/{id?}");
@:            });
@:        }
}
}
