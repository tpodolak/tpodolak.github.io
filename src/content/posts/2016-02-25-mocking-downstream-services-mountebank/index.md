---
title: "Mocking downstream services with Mountebank"
published: 2016-02-25T20:44:35.000Z
categories:
  - "testing"
tags: 
  - "mountebank"
  - "testing"
---

### 1\. Introduction

I'm a part of a team which creates large enterprise platform for the banking sector.
Due to the fact that we operate in the financial area, our application consumes a high amount of downstream services.
One of the major problems we are facing at the moment is the inaccessibility of those services on `DEV` and `UAT` environments.
It often happens that one of those services is down for quite some time, so our development speed is impaired.
The bigger problem, however, is the fact that our end-to-end tests are red.
Having a red test on `TeamCity` for a long time is a really annoying thing because basically at this point, we just automatically assume that all of the failures are caused by issues with downstream systems.
Fortunately, we finally decided to get rid of this problem and this is the solution we came up with.

### 2\. Background

Before I go to the implementation details, take a look at a sample implementation of situation I described at the very beginning.
Let's assume that we have `WCF` service which contains business logic of our application and it is consumed by the `UI` side

```csharp
public class BookingFacade :  IBookingFacade
{
    public Response<Price> Price(Models.GetPriceRequest request)
    {
        // in real life scenario Pricer should be injected
        var pricerService = new Pricer();
        var response = new Response<Price>();
        try
        {
            var tradingDates = pricerService.GetTradingDates();
            var price = pricerService.GetPrice(new GetPriceRequest
            {
                IsAdvised = request.IsAdvised
            });

            // rest of the code omitted for brevity
            response.Result = new Price
            {
                TradingDates = new TradingDates
                {
                    MaturityDate = tradingDates.MaturityDate,
                    SettlementDate = tradingDates.SettlementDate
                }
            };
            // rest of the code omitted for brevity
        }
        catch (Exception ex)
        {
            // rest of the code omitted for brevity
        }
        return response;
    }
}
```

`BookingFacade` uses `Pricer` service which basically is just a wrapper for external/downstream service we have to use in order to retrieve some data (and we do not have an ownership of that service).

```csharp
public class Pricer : IPricer
{
    public TradingDates GetTradingDates()
    {
        using (var webClient = new WebClient())
        {
            var result = webClient.DownloadString(ConfigurationManager.AppSettings["MockingDownstreamServices.Externals.Pricer.GetTradingDates"]);
            return JsonConvert.DeserializeObject<TradingDates>(result);
        }

    }

    public Price GetPrice(GetPriceRequest request)
    {
        using (var webClient = new WebClient())
        {
            var result = webClient.UploadString(ConfigurationManager.AppSettings["MockingDownstreamServices.Externals.Pricer.GetPrice"], JsonConvert.SerializeObject(request));
            return JsonConvert.DeserializeObject<Price>(result);
        }
    }
}
```

Very simple end-to-end test for `BookingFacade` can look like that

```csharp
[TestFixture]
public class BookingFacadeTests
{
    [Test]
    public void CanSuccessfullyPriceTest()
    {
        var response = this.Price(new GetPriceRequest());
        Assert.IsNotNull(response);
        Assert.IsNotNull(response.Result);
        Assert.IsFalse(string.IsNullOrWhiteSpace(response.Result.Id));
        CollectionAssert.IsEmpty(response.Messages.Where(val => val.StatusCode == StatusCodes.Error));
    }
}
```

As I mentioned before, everything is fine as long as all of the downstream systems are working.
The moment one of them is down, our tests start failing.

[![FailingTests](images/FailingTests.png)](//tpodolak.com/blog/wp-content/uploads/2016/02/mocking-downstream-services-with-mountebank-part-one/FailingTests.png)

### 3\. Implementation

General idea to fix this problem is to use fake downstream systems during end-to-end testing. 
In order to do that we use combination of custom compilation profile, `app.config` transformations and [mountebank](http://www.mbtest.org/) test doubles.

#### 3.1 Setting up transformations

First of all we will create a custom compilation profile called `test.integration` which will be used for running tests with mocked downstream systems (we want to preserve the normal use of downstreams for `Debug` and `Release` mode).
In order to do that, go to `ConfigurationManager`

[![ConfigurationManager](images/ConfigurationManager.png)](//tpodolak.com/blog/wp-content/uploads/2016/02/mocking-downstream-services-with-mountebank-part-one/ConfigurationManager.png)

and follow the steps presented in the pictures below

[![ConfigurationManager2](images/ConfigurationManager2.png)](//tpodolak.com/blog/wp-content/uploads/2016/02/mocking-downstream-services-with-mountebank-part-one/ConfigurationManager2.png)

[![ConfigurationManager3](images/ConfigurationManager3.png)](//tpodolak.com/blog/wp-content/uploads/2016/02/mocking-downstream-services-with-mountebank-part-one/ConfigurationManager3.png)

Now it is time to prepare our `app.config` for transformations. We can do it manually but for sake of simplicity I will use `SlowCheetah` extension.
Go to `Tools->Extensions and Updates` and install [SlowCheetah - XML Transforms](https://visualstudiogallery.msdn.microsoft.com/69023d00-a4f9-4a34-a6cd-7e854ba318b5).
Once extension is installed you will see a `Add Transform` item in a config files' context menu.

[![AddTransform](images/AddTransform.png)](//tpodolak.com/blog/wp-content/uploads/2016/02/mocking-downstream-services-with-mountebank-part-one/AddTransform.png)

Clicking `Add Transform` will create three files: `App.Debug.config`, `App.Release.config` and `App.Test.Integration.config`.
What is more, some additional changes will be added to your `csproj` file, which will be responsible for applying transformations during a build process.
These three additional files hold information about config transformations. The default `App.config` file looks like that
```xml
<?xml version="1.0" encoding="utf-8" ?>
<configuration>
  <appSettings file="">
    <add key="commonKey" value="commonValue"/>
  </appSettings>
</configuration>
```

Nothing special in here but note the empty `file` attribute in `appSettings` node.
The value of this attribute will be replaced with proper filename during transformation process.
In order to do that let's implement tramsforms for every of three config files we use

```xml title="App.Debug.config"
<?xml version="1.0" encoding="utf-8" ?>
<!-- For more information on using transformations 
     see the web.config examples at http://go.microsoft.com/fwlink/?LinkId=214134. -->
<configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform">
  <appSettings file="app.settings.debug" xdt:Transform="SetAttributes">
  </appSettings>
</configuration>
```

```xml title="App.Release.config"
<?xml version="1.0" encoding="utf-8" ?>
<!-- For more information on using transformations 
     see the web.config examples at http://go.microsoft.com/fwlink/?LinkId=214134. -->
<configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform">
  <appSettings file="app.settings.release" xdt:Transform="SetAttributes">
  </appSettings>
</configuration>
```

```xml title="App.Test.Integration.config"
``<?xml version="1.0" encoding="utf-8" ?>
<!-- For more information on using transformations 
     see the web.config examples at http://go.microsoft.com/fwlink/?LinkId=214134. -->
<configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform">
  <appSettings file="app.settings.tests.integration" xdt:Transform="SetAttributes">
  </appSettings>
</configuration>
```

As you can see I apply `SetAttributes` transform for `appSettings` node, which means that the transformation will replace `appSettings` node attributes from `app.config` file with `appSettings` node attributes from transform file.
You can preview results of transformation by clicking `Preview Transform` context menu option available for every of our transform files

[![Preview](images/Preview.png)](//tpodolak.com/blog/wp-content/uploads/2016/02/mocking-downstream-services-with-mountebank-part-one/Preview.png)

As you've probably already figured it out `app.settings.debug` and `app.settings.release` fileses contain real downstream endpoints and `app.settings.tests.integration` contains addresses of fake endpoints. Of course you have to create those files and copy them to output directory during the build (for instance by using `Copy to Output directory` option).

#### 3.2. Creating fake downstreams with mountebank

Setting up fake downstream systems completely from scratch would be a very painful and time consuming process.
Fortunately there are tools which can make this task easier. The tool I use is called [mountebank](http://www.mbtest.org/) - you can easily install it via `npm`

```bash showLineNumbers=false frame="none"
npm install -g mountebank

```

Having `mountebank` on board it is time to configure it, so that it acts as fake `Pricer` service. It can be done in couple of ways but I will go with file based configuration.
You can run the tool using following command

```bash showLineNumbers=false frame="none"
mb --configfile impostors.ejs --allowInjection

```

[![ImpostorsListening](images/ImpostorsListening.png)](//tpodolak.com/blog/wp-content/uploads/2016/02/mocking-downstream-services-with-mountebank/ImpostorsListening.png)

Where `impostors.ejs` is a configuration file with following structure

```json
{
  "imposters": [
    <% include pricer.json %>
  ]
}

```

`<% include pricer.json %>` is [EJS](http://www.embeddedjs.com/) syntax which (in this case) allows you to split configuration into multiple files.
As you've probably already figured it out, `Pricer.json` contains the actual mock configuration for `Pricer` service.
The initial mock object consists of couple of properties which setup the name, port and protocol for given mock.

```json
{
  "port": 4545,
  "protocol": "http",
  "name": "pricer stub",
  "stubs": []
}

```

Note that we do not specify the address of mock but just a port. `Mountebank` by default runs on `http://localhost:2525` and mocks listen on `http://localhost:{port}`.
The actual magic happens in `stubs` property. Here is an example of stub/mock for `GetTradingDates` method.

```json
{
    "responses": [
      {
        "is": {
          "body": {
            "MaturityDate": "2016-02-17",
            "SettlementDate": "2012-02-23"
          }
        }
      }
    ],
    "predicates": [
      {
        "equals": {
          "path": "/GetTradingDates",
          "method": "GET"
        },
      }
    ]
}

```

As you can see stub object consists of two properties

- responses
- predicates

**`responses`** property is an array of objects `mountebank` will be using to create a response.
If you insert multiple items into array, they will be utilized using round robin algorithm.
Note that you don't have to create a full response (with all the headers etc.) just use "is" property which will fill the default values for you.
More about that topic can be found [here](http://www.mbtest.org/docs/api/stubs) but in most of the cases setting value for "body" property will be enough for you.

**`predicates`** property is an array of predicates which will be used during matching process.
Predicate object can be quite complex, it supports lots of different matching techniques.
In this case, for simple `GET` method I just use `equals` operator to match `HTTP` verb and `HTTP` method.
The same technique can be used for stubbing `POST` methods. However, in this case, you can also perform matching against the body of the request.
The one thing you have to remember is that `body` property is not an object but string. So in my case, if I want to make a stub for `GetPrice` which takes as params following request object

```csharp
public class GetPriceRequest
{
    public bool IsAdvised { get; set; }
}

```

I can write for instance this stub

```json
{
    "responses": [
      {
        "is": {
          "body": {
            "Id": "1",
            "Strike": "1"
          }
        }
      }
    ],
    "predicates": [
      {
        "equals": {
          "path": "/GetPrice",
          "method": "POST",
          "body": "{\"IsAdvised\":false}"
        }
      }
    ]
}

```

Of course for more complex request it is pointless to write every possible combination of params. Fortunately you can create fallback/default stub which will match everything

```json
{
    "responses": [
      {
        "is": {
          "body": {
            "Id": "default",
            "Strike": "1"
          }
        }
      }
    ],
    "predicates": [
      {
        "equals": {
          "path": "/GetPrice",
          "method": "POST"
        }
      }
    ]
}

```

If you put this at the very end of stubs array it will not interfere with other stubs. This is of course just a tip of the iceberg when it comes to predicate matching. Explanation of all possible matching options can be found [here](http://www.mbtest.org/docs/api/predicates)

### 4\. Results

From now on running tests against `test.integration` compilation profile and having `mountebank` working in the background, our tests will be green.

[![SuccessfulTests](images/SuccessfulTests.png)](//tpodolak.com/blog/wp-content/uploads/2016/02/mocking-downstream-services-with-mountebank/SuccessfulTests.png) 

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/MockingDownstreamServicesWithMountebank)
