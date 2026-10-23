---
title: "Asp.NET Core - populating IOptions<T> from external data source"
published: 2017-02-26T22:56:52.000Z
categories: 
  - "asp-net-core"
tags: 
  - "asp-net-core"
---

### 1\. Introduction

In _ASP.NET Core_ _web.config_ is no longer a proper place for storing application settings. New framework introduces the concept of a json based configuration and the default file which stores the settings now is _appsettings.json_. Here is a quick tutorial how to use new features.

### 2\. Reading configuration

Let's assume that our _appsettings.json_ file looks as follows.

```
{
    "Logging": {
        "IncludeScopes": false,
        "LogLevel": {
            "Default": "Debug",
            "System": "Information",
            "Microsoft": "Information"
        }
    },
    "AvailabilitySearchOptions": {
        "FlexDaysIn": 2,
        "FlexDaysOut": 3
    }
}

```

Thanks to _ConfigurationBuilder_ we can parse this config and later on materialize sections or entire file into strongly typed configuration classes. Let's say we want to parse _AvailabilitySearchOptions_ node to following class

```
public class AvailabilitySearchOptions
{
    public int FlexDaysIn { get; set; }

    public int FlexDaysOut { get; set; }

    public TimeSpan MinimumConnectionTime { get; set; }

    public TimeSpan MinimumDepartureTime { get; set; }
}

```

We can achieve that with following steps. First of all, we need to read entire configuration

```
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

```

And in the next step we have to register _IOptions<AvailabilitySearchOptions>_ in the container using _services.Configure<TOptions>(IConfiguration section)_ method

```
// This method gets called by the runtime. Use this method to add services to the container.
public void ConfigureServices(IServiceCollection services)
{
    // Add framework services.
    services.AddMvc();
    services.Configure(Configuration.GetSection("AvailabilitySearchOptions"));  
}

```

Note _Configuration.GetSection("AvailabilitySearchOptions")_ passed as argument to _services.Configure_ method. From now on we can access _AvailabilitySearchOptions_ settings via _IOptions<AvailabilitySearchOptions>_ interface, which you can easily inject into your classes.

```
[Route("api/[controller]")]
public class OptionsController : Controller
{
    private readonly IOptions availabilitySearchOptions;

    public OptionsController(IOptions availabilitySearchOptions)
    {
        this.availabilitySearchOptions = availabilitySearchOptions;
    }

    public AvailabilitySearchOptions Get()
    {
        return availabilitySearchOptions.Value;
    }
}

```

### 3\. Populating _IOptions<T>_ from external data source

From time to time, reading configuration just from JSON file might not be enough and for instance you would like to add additional configuration read from some external data source. Fortunately you don't have to resign from the _IOptions<T>_ class as it is possible to read additional data for literally any other source thanks to _IConfigureOptions<T>_ class. All we have to do is to create a setup class which implements _IConfigureOptions<T>_ interface

```
public class AvailabilitySearchOptionsSetupService : IConfigureOptions
{
    private readonly ILogger logger;
    private readonly IReservationSettingsService reservationSettingsService;
	
    public AvailabilitySearchOptionsSetupService(ILogger logger ,IReservationSettingsService reservationSettingsService)
    {
        this.logger = logger;
        this.reservationSettingsService = reservationSettingsService;
    }
	
    public void Configure(AvailabilitySearchOptions options)
    {
        this.logger.LogInformation($"Calling first {typeof(IConfigureOptions)} service");
        options.MinimumConnectionTime = reservationSettingsService.GetMinimumConnectionTime();
    }
}

```

And then registering this class in our container

```
// This method gets called by the runtime. Use this method to add services to the container.
public void ConfigureServices(IServiceCollection services)
{
    // Add framework services.
    services.AddMvc();
    services.Configure(Configuration.GetSection("AvailabilitySearchOptions"));
    services.AddSingleton, AvailabilitySearchOptionsSetupService>();
}

```

From now on, when value of _IOptions<AvailabilitySearchOptions>_ is accessed for very first time, _Configure_ method from _AvailabilitySearchOptionsSetupService_ will be called and you will be able to set additional values for your settings. Note that values from _appsettings.json_ will already be there. In addition, it is possible to have multiple implementations of _IConfigureOptions<T>_ so if you want your setup to be split into multiple classes you are good to go. [![multiple](images/multiple.png)](//tpodolak.com/blog/wp-content/uploads/2017/02/asp-net-core-populating-ioptions-external-data-source/multiple.png) Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/AspNetCoreInitializingOptions)
