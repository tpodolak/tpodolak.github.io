---
title: "ASP.NET Core 1.x -  curios case of missing IOptions&lt;T&gt; array item"
published: 2017-10-17T08:00:08.000Z
categories: 
  - "asp-net-core"
tags: 
  - "asp-net-core"
---

### 1\. Introduction

Last week while I was working on one of the features for my current project, I noticed quite surprising behavior of _IOptions<T>_ object. Long story short, for some reasons there were missing array elements in my parsed application settings class.

### 2\. Problem

Just like everyone else, we store our application settings in _JSON_ file. The settings are pretty straightforward, just a bunch of properties with some nested objects

```
{
    "PaymentMethods": [
        {
            "Name": "MasterCard",
            "ExcludedCurrencies": []
        },
        {
            "Name": "Visa",
            "ExcludedCurrencies": null
        },
        {
            "Name": "Apple Pay"
        },
        {
            "Name": "PayPal",
            "ExcludedCurrencies": [
                "MAD"
            ]
        }
    ]
}

```

which are bound to the _AppSetting_ class thanks to these couple of lines of code

```
// This method gets called by the runtime. Use this method to add services to the container.
public void ConfigureServices(IServiceCollection services)
{            
    services.Configure(Configuration);
    // Add framework services.
    services.AddMvc();
}

```

where _AppSettings_ class looks as follows

```
public class AppSettings
{
    public List PaymentMethods { get; set; }
}

public class PaymentMethod
{
    public string Name { get; set; }

    public List ExcludedCurrencies { get; set; }
}

```

As you can see nothing too fancy in here, standard _ASP.NET Core_ approach for handling configuration files. However, if you access the _PaymentMethods_ property of _IOptions<AppSettings>_

```
[Route("api/[controller]")]
public class ValuesController : Controller
{
    private readonly IOptions _appSettings;

    public ValuesController(IOptions appSettings)
    {
        _appSettings = appSettings;
    }
        
    // GET api/values
    [HttpGet]
    public List Get()
    {
        return _appSettings.Value.PaymentMethods;
    }
}

```

you will see that instead of four elements we ended up having 3 items [![](images/MissingItem.png)](//tpodolak.com/blog/wp-content/uploads/2017/10/asp-net-core-1-x-curios-case-of-missing-ioptions-array-item/MissingItem.png) as the "Visa" element is missing.

### 3\. Solution

If you look closely at the appsettings.json file you will notice that a "Visa" item configuration is a bit different than the ones which are parsed just fine. Namely _null_ is assigned to _excludedCurrencies_ property, whereas in other items an empty array or no property at all is used. So the first fix is just to use the same approach as in the other items

```
{
    "Name": "Visa",
    "ExcludedCurrencies": []
}

```

This approach works fine, however, it is not a silver bullet as someone still might use null and introduce a bug. Another fix might be upgrading to _ASP.NET Core 2.0_ as the problem doesn’t seem to exist in there. Of course, this is rather a huge change so not everyone will be willing to do it. The last option is a manual installation of _Microsoft.Extensions.Configuration.Binder 2.0_ along with _Microsoft.Extensions.Configuration.Json 2.0_ package. However, this approach requires you to retarget your application to _netcoreapp2.0_. One way or another every solution in here works fine, so once you apply the fix you will see all items in the array [![](images/AllItems.png)](//tpodolak.com/blog/wp-content/uploads/2017/10/asp-net-core-1-x-curios-case-of-missing-ioptions-array-item/AllItems.png) Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/ASP.NETCoreCuriousCaseOfMissingIOptionsOfTArrayItem)
