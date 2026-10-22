---
title: "Running ASP.NET Core together with Nancy"
published: 2020-04-20T08:00:44.000Z
slug: "running-asp-net-core-together-nancy"
categories: 
  - "asp-net-core"
tags: 
  - "asp-net-core"
  - "nancy"
---

### 1\. Introduction

Our current _API_ runs on [Nancy](https://github.com/NancyFx/Nancy) which in my opinion is past its prime. Recent news from the [GitHub](https://github.com/NancyFx/Nancy/issues/3010) issue tracker seems to confirm that thesis, that is why we started looking for a migration path from Nancy based _API_ to _ASP.NET Core_. Because the codebase is quite large we didn't want to do a _Big Bang Rewrite_ but instead of that, we wanted to gradually replace old _API_ with a new one, so both of them can coexist next to each other.

### 2\. Legacy API

Before I jump into implementation, here is a sample _Nancy API_ with two endpoints - _products_ and _variants_

```
public class Startup
{
    // This method gets called by the runtime. Use this method to add services to the container.
    public void ConfigureServices(IServiceCollection services)
    {
        // nancy has its own container
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseOwin(owin => owin.UseNancy());
    }
}

```

```
public sealed class ProductsNancyModule : NancyModule
{
    public ProductsNancyModule()
    {
        Get("products", args => Response.AsJson(new List
        {
            new Product(Guid.NewGuid().ToString(), "First product from nancy"),
            new Product(Guid.NewGuid().ToString(), "Second product from nancy")
        }));
    }
}

```

```
public sealed class VariantsNancyModule : NancyModule
{
    public VariantsNancyModule()
    {
        Get("variants", args => Response.AsJson(new List
        {
            new Variant(Guid.NewGuid().ToString(), Guid.NewGuid().ToString(), "first variant from nancy"),
            new Variant(Guid.NewGuid().ToString(), Guid.NewGuid().ToString(), "second variant from nancy")
        }));
    }
}

```

The goal is to replace _products_ endpoint with _ASP.NET Core_ implementation while _variants_ endpoint should still be served by _Nancy_

### 3\. Combining Nancy with _ASP.NET Core_

The solution is based on [branching](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware/?view=aspnetcore-3.1#branch-the-middleware-pipeline) the pipeline feature which is available starting from _ASP.NET Core_ 2.1. Long story short - it is possible to configure different pipelines for different route paths thanks to

```
public static IApplicationBuilder Map(this IApplicationBuilder app, PathString pathMatch, Action configuration)

```

method. Having that in mind we can \`Map\` _products_ path to run through _ASP.NET Core_ pipeline whereas the rest would go through _Nancy_.

```
// This method gets called by the runtime. Use this method to add services to the container.
public void ConfigureServices(IServiceCollection services)
{
    // register mvc services
    services.AddControllers();
    services.AddMvc(options => options.EnableEndpointRouting = false);
}

// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    // run everything with products prefix through mvc
    app.Map("/products", appBuilder =>
    {
        appBuilder.UseMvc();
    });

    // run the rest through Nancy
    app.Map(string.Empty, appBuilder =>
    {
        appBuilder.UseOwin(options => options.UseNancy());
    });
}

```

```
[ApiController]
public class ProductsController : ControllerBase
{
    [HttpGet("/products")]
    public List Get()
    {
        return new List
        {
            new Product(Guid.NewGuid().ToString(), "First product from asp net core"),
            new Product(Guid.NewGuid().ToString(), "Second product from asp net core")
        };
    }
}

```

At this point we are almost there, however running request through _Map_ pipeline will remove the path prefix, meaning that our controller would be accessible under _/_ path instead of _products_. In order to bypass this limitation we have to restore original prefix with _RewriteMiddleware_. Once we put it all together, now we are able to replace multiple _Nancy_ endpoints with _ASP.NET Core_ ones using following piece of code

```
// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    var aspNetCorePaths = new PathString[] {"/products"};
    foreach (var path in aspNetCorePaths)
    {
        app.Map(path, appBuilder =>
        {
            // we still want to access the resource under old url, so we need to add the branch path back to the route
            var rewriteOptions = new RewriteOptions().AddRewrite(
                "(?.*)",
                $"{path}/${{Path}}",
                skipRemainingRules: true);
            appBuilder.UseRewriter(rewriteOptions);
            appBuilder.UseMvc();
        });
    }

    app.Map(string.Empty, appBuilder =>
    {
        appBuilder.UseOwin(options => options.UseNancy());
    });
}

```

![](images/NancyCore.gif) Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/RunningAspNetCoreTogetherWithNancy)
