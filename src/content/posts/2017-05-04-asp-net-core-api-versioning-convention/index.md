---
title: "ASP.NET Core - API versioning by convention"
published: 2017-05-04T13:02:47.000Z
categories:
  - "web-development"
tags: 
  - "asp-net-core"
  - "versioning"
---

### 1\. Introduction

If you were looking for information about `API` versioning support for `ASP.NET Core` you've probably come across [Microsoft.AspNetCore.Mvc.Versioning](https://www.nuget.org/packages/Microsoft.AspNetCore.Mvc.Versioning) library. The library itself allows you to set up versioning in a couple of different ways, for instance, via [attributes](https://github.com/Microsoft/aspnet-api-versioning/wiki/How-to-Version-Your-Service) or via [manual convention setup](https://github.com/Microsoft/aspnet-api-versioning/wiki/API-Version-Conventions). All of this options are really nice but unfortunately, they have one significant drawback, namely, you have to set them up manually. As I tend to forget about this kind of things I wanted to automate that process as much as possible. Thankfully `ASP.NET Core` has a very nice feature called `ApplicationModelConventions` which allows you to add some metadata(like routing information, `API` versioning ) to your controller, actions etc.

### 2\. Convention

I've decided to implement versioning by routing which means the `API` will be accessible via this template

```csharp
"v{version:apiVersion}/[controller]"
```

The template itself doesn’t give you much, as you also have to add information to the controllers which version of `API` they support.
In my case, I decided to go with a version by namespace convention, which means that supported version will be deduced from namespace in which given controller resides.
So, in fact, there will be two conventions, one for applying routing and a second one for applying versioning

### 3\. Creating conventions.

In order to write an `ASP.NET Core` convention, we have to implement `IApplicationModelConvention` interface. This interface has a single method `Apply` which takes `ApplicationModel` class as an argument. This class gives us access to all of our controllers, actions and other parts of the application. So if we want to apply a routing with versioning for all of the controllers, we can do it in following way

```csharp
public class ApiVersionRoutePrefixConvention : IApplicationModelConvention
{
    private readonly string _versionConstraintTemplate;
    private readonly string _versionedControllerTemplate;

    public ApiVersionRoutePrefixConvention()
    {
        _versionConstraintTemplate = "v{version:apiVersion}";
        _versionedControllerTemplate = $"{_versionConstraintTemplate}/[controller]";
    }

    public void Apply(ApplicationModel application)
    {
        foreach (var applicationController in application.Controllers)
        {
            foreach (var applicationControllerSelector in applicationController.Selectors)
            {
                if (applicationControllerSelector.AttributeRouteModel != null)
                {
                    var versionedConstraintRouteModel = new AttributeRouteModel
                    {
                        Template = _versionConstraintTemplate
                    };

                    applicationControllerSelector.AttributeRouteModel =
                            AttributeRouteModel.CombineAttributeRouteModel(versionedConstraintRouteModel,
                                applicationControllerSelector.AttributeRouteModel);
                }
                else
                {
                    applicationControllerSelector.AttributeRouteModel = new AttributeRouteModel
                    {
                        Template = _versionedControllerTemplate
                    };
                }
            }
        }
    }
}
```

As you can see we iterate through all of the `Selectors` and then apply new route model to them.
If selector already had a route attribute applied we combine two attributes together. Once our convention is applied our actions will be accessible with following routing prefix

```csharp
"v{version:apiVersion}/[controller]" 
```

or via

```csharp
"v{version:apiVersion}/previous_route_for_controller"
```

Having our routing ready now it is time to add versioning information to our controllers.
Once again it will be done via application model convention.
The version of the controller will be deduced from the namespace given controller is located in.

```csharp
public class ApiVersionByNamespaceConvention : IApplicationModelConvention
{
    public void Apply(ApplicationModel application)
    {
        foreach (var controllerModel in application.Controllers)
        {
            var version = DeduceControllerVersion(controllerModel);
            var builder = new ControllerApiVersionConventionBuilder<ControllerModel>();
            builder.HasApiVersion(new ApiVersion(version, 0));
            builder.ApplyTo(controllerModel);
        }
    }

    private int DeduceControllerVersion(ControllerModel model)
    {
        // super trivial way of retrieving version number from namespace
        if (!int.TryParse(model.ControllerType.Namespace.Last().ToString(), out var version))
        {
            throw new InvalidOperationException("Unable to retrieve version information from namespace");
        }
        
        return version;
     }
}
```

As you can see I iterate through all of the controller models of our application, then check the version of controller based on its namespace and finally with

```csharp
var builder = new ControllerApiVersionConventionBuilder<ControllerModel>();
builder.HasApiVersion(new ApiVersion(version, 0));
builder.ApplyTo(controllerModel);
```

I am able to inform the framework which version of `API` given controller supports.

### 4\. Adding convention to application

Having all of our conventions prepared now we can enable versioning support

```csharp
// Add framework services.
services.AddApiVersioning(options =>
{
    options.ReportApiVersions = true;
});
```

And of course, we have to add newly created conventions to list of application conventions

```csharp
services.AddMvc(options =>
{
    options.Conventions.Remove<ApiVersionConvention>();
    options.Conventions.Remove<ImplicitControllerVersionConvention>();
    options.Conventions.Add(new ApiVersionRoutePrefixConvention());
    options.Conventions.Add(new ApiVersionByNamespaceConvention());
});
```

Note that I removed `ApiVersionConvention` and `ImplicitControllerVersionConvention` with simple extension method `Remove<T>`

```csharp
public static class CollectionExtensions
{
    public static void Remove<T>(this IList<IApplicationModelConvention> conventionsCollection)
            where T : IApplicationModelConvention
    {
        var conventions = conventionsCollection.OfType<T>().ToList();

        foreach (var convention in conventions)
        {
            conventionsCollection.Remove(convention);
        }
    }
}
```

to make sure that only my convention is responsible for API versioning.

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/AspNetCoreDefaultApiVersionWithUrlPathVersioning)
