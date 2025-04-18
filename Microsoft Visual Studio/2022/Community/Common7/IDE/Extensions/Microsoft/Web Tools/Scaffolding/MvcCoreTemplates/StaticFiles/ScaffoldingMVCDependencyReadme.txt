﻿ASP.NET Core MVC dependencies have been added to the project.
(These dependencies include packages required to enable scaffolding)

However you may still need to make changes to your project.

1. Add Scaffolding CLI tool to the project:
    <ItemGroup>
        <DotNetCliToolReference Include="Microsoft.VisualStudio.Web.CodeGeneration.Tools" Version="1.0.3" />
    </ItemGroup>

2. Suggested changes to Startup class:

    2.1 Add a constructor:
        public IConfigurationRoot Configuration { get; }

        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();
            Configuration = builder.Build();
        }

    2.2 Add MVC services:

        public void ConfigureServices(IServiceCollection services)
        {
            // Add framework services.
            services.AddMvc();
        }

    2.3 Configure web app to use MVC routing:

        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseStaticFiles();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }

3. Replace the project name and namespace in the newly scaffolded files:

    3.1 The file _Layout.cshtml contains the string "AppName" in a few places. It can be globally replaced with the name of the app.

    3.2 The file _ViewImports.cshtml contains the string "Root_Namespace". It should be replaced with the root namespace of the project.