@inherits Microsoft.AspNet.Scaffolding.Templating.RazorTemplateBase
@{
  var Model = ObjectModel as Microsoft.WebTools.Scaffolding.Core.Scaffolders.Dependency.ReadMeModel;
  var index = 1;
}
ASP.NET Core MVC dependencies have been added to the project.
(These dependencies include packages required to enable scaffolding)

However you may still need to do make changes to your project.
@{

if (Model.IsCLIToolReferenceNeeded){
@:@index. Add Scaffolding CLI tool to the project's .csproj file:
@:    <ItemGroup>
@:        <DotNetCliToolReference Include="Microsoft.VisualStudio.Web.CodeGeneration.Tools" Version="1.0.3" />
@:    </ItemGroup>

index++;
}
}

@{
if (Model.IsStartupChangesNeeded){
@:@index. Suggested changes to Startup class:

@:    @index.1 Add a constructor:
@:        public IConfigurationRoot Configuration { get; }
@:
@:        public Startup(IHostingEnvironment env)
@:        {
@:            var builder = new ConfigurationBuilder()
@:                .SetBasePath(env.ContentRootPath)
@:                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
@:                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
@:                .AddEnvironmentVariables();
@:            Configuration = builder.Build();
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
@:        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
@:        {
@:            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
@:            loggerFactory.AddDebug();
if (!Model.IsInstallMinimalDependencies)
{
@:
@:            if (env.IsDevelopment())
@:            {
@:                app.UseDeveloperExceptionPage();
@:            }
@:            else
@:            {
@:                app.UseExceptionHandler("/Home/Error");
@:            }
@:
@:            app.UseStaticFiles();
}
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
