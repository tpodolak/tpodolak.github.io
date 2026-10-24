---
title: "ASP.NET Core - passing command-line arguments to Startup class"
published: 2018-01-16T09:00:24.000Z
categories: 
  - "asp-net-core"
tags: 
  - "asp-net-core"
---

### 1\. Introduction

I usually pass configuration to my web API via JSON files, but recently I needed to pass them also via command-line arguments. As the solution for _ASP.NET Core 2.x_ is quite different than for _ASP.NET Core 1.x_ I decided to describe both methods in here.

### 2\. ASP.NET Core 2.x

For the newest version of _ASP.NET Core_, the solution is pretty straightforward as _IConfiguration_ is injected by default to the _Startup_ class. All we have to do is to add _CommandLineConfigurationSource_ to _IConfigurationBuilder_ when configuring _IWebHost_. _CommandLineConfigurationSource_ is part of the _Microsoft.Extensions.Configuration.CommandLine_ package and can be easily used by _AddCommandLine_ extension method

```csharp
public class Program
{
    public static void Main(string[] args)
    {
        BuildWebHost(args).Run();
    }
	
    public static IWebHost BuildWebHost(string[] args)
    {
        var webHost = new WebHostBuilder()
	     .UseKestrel()
	     .UseContentRoot(Directory.GetCurrentDirectory())
	     .ConfigureAppConfiguration((hostingContext, config) =>
	     {
	         var env = hostingContext.HostingEnvironment;
	         config.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
	               .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true, reloadOnChange: true);
	         config.AddEnvironmentVariables();
	         config.AddCommandLine(args);
	     }).UseStartup()
	       .Build();
        return webHost;
    }
}

```

Now we can access our command-line arguments just like any other configuration

```csharp
public class Startup
{
    private readonly IConfiguration _configuration;

    public Startup(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // This method gets called by the runtime. Use this method to add services to the container.
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddMvc();
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory, IApplicationLifetime applicationLifetime)
    {
        loggerFactory.AddConsole();
        loggerFactory.AddDebug();
        applicationLifetime.ApplicationStarted.Register(() => loggerFactory.CreateLogger().LogInformation("CommandLine argument {0}: ", _configuration["usecustomschema"]));
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }

        app.UseMvc();
    }
}

```

[![](images/AspNetCore2CommandLineArgument-1.png)](//tpodolak.com/blog/wp-content/uploads/2018/01/asp-net-core-passing-command-line-arguments-to-startup-class/AspNetCore2CommandLineArgument-1.png)

### 3\. ASP.NET Core 1.x

The solution for _ASP.NET Core 1.x_ requires a bit more work but it is possible to achieve the same result. We still will be using _CommandLineConfigurationSource_ from _Microsoft.Extensions.Configuration.CommandLine_ package, however this time we have to manually create _IConfiguration_ object and register it in the container before the _Startup_ class is created. This is possible because the _WebHostBuilder_ exposes _ConfigureServices_ method.

```csharp
public class Program
{
    public static void Main(string[] args)
    {
        var host = new WebHostBuilder()
             .UseKestrel()
             .UseContentRoot(Directory.GetCurrentDirectory())
             UseIISIntegration()
             .ConfigureServices(serviceCollection =>
                 serviceCollection.AddSingleton(new ConfigurationBuilder().AddCommandLine(args).Build()))
             .UseStartup()
             .Build();

          host.Run();
    }
}

```

Having our service registered now we can easily access _IConfiguration_ object in our application

```csharp
public class Startup
{
    // This method gets called by the runtime. Use this method to add services to the container.
    public void ConfigureServices(IServiceCollection services)
    {
        // Add framework services.
        services.AddMvc();
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IHostingEnvironment hostingEnvironment, IConfiguration configuration, ILoggerFactory loggerFactory, IApplicationLifetime applicationLifetime)
    {
        loggerFactory.AddConsole();
        loggerFactory.AddDebug();
        applicationLifetime.ApplicationStarted.Register(() =>
                loggerFactory.CreateLogger().LogInformation("CommandLine argument {0}: ", configuration["usecustomschema"]));

        if (hostingEnvironment.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }

        app.UseMvc();
    }
}

```

[![](images/AspNetCoreCommandLineArgument-1.png)](//tpodolak.com/blog/wp-content/uploads/2018/01/asp-net-core-passing-command-line-arguments-to-startup-class/AspNetCoreCommandLineArgument-1.png) Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/AspNetCorePassingCommandLineArgumentsToStartupClass)
