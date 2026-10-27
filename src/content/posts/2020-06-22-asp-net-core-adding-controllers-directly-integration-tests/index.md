---
title: "ASP.NET Core - adding controllers directly from integration tests"
published: 2020-06-22T08:00:12.000Z
categories:
  - "testing"
tags: 
  - "asp-net-core"
  - "testing"
---

### 1\. Introduction

From time to time it might happen, that you need to test certain parts of your `ASP.NET Core` configuration without hitting publicly visible business-related controllers. For instance, in my case, I wanted to make sure that my `ASP.NET Core API` behavior is consistent with the original `API` written in `Nancy`. As you might expect there are quite a lot of differences between both of the frameworks, so let's focus on testing one thing, namely non-nullable reference type handling. Long story short, in order to have the same behavior in `ASP.NET Core` as in `Nancy` I had to add the following line of configuration

```csharp
// This method gets called by the runtime. Use this method to add services to the container.
public void ConfigureServices(IServiceCollection services)
{
    services.AddControllers(opts => opts.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true)
        .AddNewtonsoftJson();
}
```

This one prevents `ASP.NET Core` from marking non-nullable reference type properties in request as required.
Having that configuration ready, I wanted to test it with an end to end test.
Because there was no business-related logic yet, I needed to figure out the way of adding `API` controllers to my application directly from the integration tests.
Here is how you can achieve that.

### 2\. Accessing ApplicationPartManager from integration tests

`ASP.NET Core` is able to compose your `API` from different parts thanks to `ApplicationPartManager`.
By default, you don't use it directly but rather with `IMvcBuilder AddApplicationPart` extension method while setting up your application

```csharp
// This method gets called by the runtime. Use this method to add services to the container.
public void ConfigureServices(IServiceCollection services)
{
    services.AddControllers()
        .AddApplicationPart(typeof(SomeClass).Assembly)
        .AddNewtonsoftJson();
}
```

However, there is no easy way of getting `IMvcBuidler` from the integration tests(at least I didn't find a proper way of doing that without tampering too much with the original application pipeline) so we need to access `ApplicationPartManager` directly.
Inspecting the source code of the framework you will find that `ApplicationPartManager` can be retrieved directly from `IServiceCollection` with following [code](https://github.com/dotnet/aspnetcore/blob/3.0/src/Mvc/Mvc.Core/src/DependencyInjection/MvcCoreServiceCollectionExtensions.cs#L74)

```csharp
private static ApplicationPartManager GetApplicationPartManager(IServiceCollection services)
{
    var manager = GetServiceFromCollection<ApplicationPartManager>(services);
    if (manager == null)
    {
        manager = new ApplicationPartManager();

        var environment = GetServiceFromCollection<IWebHostEnvironment>(services);
        var entryAssemblyName = environment?.ApplicationName;
        if (string.IsNullOrEmpty(entryAssemblyName))
        {
            return manager;
        }

        manager.PopulateDefaultParts(entryAssemblyName);
    }

    return manager;
}

private static T GetServiceFromCollection<T>(IServiceCollection services)
{
    return (T)services
        .LastOrDefault(d => d.ServiceType == typeof(T))
        ?.ImplementationInstance;
}
```

Applying similar code to the `WebApplicationFactory` will allow us to add controllers directly from tests

```csharp
[Fact]
public async Task DoesNotReturnBadRequest_WhenNonNullableTypeHasNoValue_FirstAttempt()
{
    var webApplicationFactory = new WebApplicationFactory<Startup>()
        .WithWebHostBuilder(
            builder => builder.ConfigureServices(services =>
            {
                var partManager = (ApplicationPartManager) services
                    .Last(descriptor => descriptor.ServiceType == typeof(ApplicationPartManager))
                    .ImplementationInstance;

                partManager.ApplicationParts.Add(new AssemblyPart(GetType().Assembly));
            }));

    var expectedResponse = new Request
    {
        Id = "1"
    };

    var httpClient = webApplicationFactory.CreateClient();
    var httpResponseMessage = await httpClient.GetAsync("test?id=1");

    httpResponseMessage.IsSuccessStatusCode.Should().BeTrue();
    var rawContent = await httpResponseMessage.Content.ReadAsStringAsync();
    var result = JsonConvert.DeserializeObject<Request>(rawContent);

    result.Should().BeEquivalentTo(expectedResponse);
}

[ApiController]
public class MvcOptionsTestController : ControllerBase
{
    [HttpGet("test")]
    public object Get([FromQuery] Request request)
    {
        return request;
    }
}

public class Request
{
    public string Id { get; set; }

    public string OtherId { get; set; }
}
```

### 3\. Handling private controllers

The solution presented below works nice, however it has couple of drawbacks.
First of all, it only discovers public non-nested controllers.
Second of all, it will always add all controllers from given assembly - which potentially might affect other integration tests.
In order to get rid of these drawbacks, we need to tell `ApplicationPartManager` to include only selected controllers.
We can achieve that by adding additional `IApplicationFeatureProvider<ControllerFeature>` to the list of `FeatureProviders`.

```csharp
public class ExternalControllersFeatureProvider : IApplicationFeatureProvider<ControllerFeature>
{
    private readonly Type[] _controllers;

    public ExternalControllersFeatureProvider(params Type[] controllers)
    {
        _controllers = controllers ?? Array.Empty<Type>();
    }

    public void PopulateFeature(IEnumerable<ApplicationPart> parts, ControllerFeature feature)
    {
        foreach (var controller in _controllers)
        {
            feature.Controllers.Add(controller.GetTypeInfo());
        }
    }
}

[Fact]
public async Task DoesNotReturnBadRequest_WhenNonNullableTypeHasNoValue()
{
    var webApplicationFactory = new WebApplicationFactory<Startup>()
        .WithWebHostBuilder(
            builder => builder.ConfigureServices(services =>
            {
                var partManager = (ApplicationPartManager) services
                    .Last(descriptor => descriptor.ServiceType == typeof(ApplicationPartManager))
                    .ImplementationInstance;

                partManager.FeatureProviders.Add(new ExternalControllersFeatureProvider(typeof(MvcOptionsTestController)));
            }));
// rest of the code omitted for brevity
}
```

Putting it all together and applying some refactoring we will end up with following code

```csharp
internal static class WebHostBuilderExtensions
{
    public static IWebHostBuilder WithAdditionalControllers(this IWebHostBuilder builder, params Type[] controllers)
    {
        return builder.ConfigureTestServices(
            services =>
            {
                var partManager = GetApplicationPartManager(services);

                partManager.FeatureProviders.Add(new ExternalControllersFeatureProvider(controllers));
            });
    }

    private static ApplicationPartManager GetApplicationPartManager(IServiceCollection services)
    {
        var partManager = (ApplicationPartManager)services
            .Last(descriptor => descriptor.ServiceType == typeof(ApplicationPartManager))
            .ImplementationInstance;
        return partManager;
    }

    private class ExternalControllersFeatureProvider : IApplicationFeatureProvider<ControllerFeature>
    {
        private readonly Type[] _controllers;

        public ExternalControllersFeatureProvider(params Type[] controllers)
        {
            _controllers = controllers ?? Array.Empty<Type>();
        }

        public void PopulateFeature(IEnumerable<ApplicationPart> parts, ControllerFeature feature)
        {
            foreach (var controller in _controllers)
            {
                feature.Controllers.Add(controller.GetTypeInfo());
            }
        }
    }
}

public class MvcOptionsConfigurationTests
{
    [Fact]
    public async Task DoesNotReturnBadRequest_WhenNonNullableTypeHasNoValue()
    {
        var webApplicationFactory = new WebApplicationFactory<Startup>()
            .WithWebHostBuilder(
                builder => builder.WithAdditionalControllers(typeof(MvcOptionsTestController)));

        var httpClient = webApplicationFactory.CreateClient();
        var expectedResponse = new Request
        {
            Id = "1"
        };

        var httpResponseMessage = await httpClient.GetAsync("test?id=1");

        httpResponseMessage.IsSuccessStatusCode.Should().BeTrue();
        var rawContent = await httpResponseMessage.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<Request>(rawContent);

        result.Should().BeEquivalentTo(expectedResponse);
    }

    [ApiController]
    private class MvcOptionsTestController: ControllerBase
    {
        [HttpGet("test")]
        public object Get([FromQuery] Request request)
        {
            return request;
        }
    }

    private class Request
    {
        public string Id { get; set; }

        public string OtherId { get; set; }
    }
}
```

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/AspNetCoreAddingControllersInIntegrationTests)
