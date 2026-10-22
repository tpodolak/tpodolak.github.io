---
title: ".NET Core - missing currency symbol in docker alpine image"
published: 2019-11-18T13:54:32.000Z
slug: "net-core-missing-currency-symbol-docker-alpine-image"
categories: 
  - "net-core"
tags: 
  - "docker"
---

During the process of moving a Scala-based API to .NET Core, we encountered an interesting localization issue when running our code in a docker container based on an alpine image. The code itself was doing a currency formatting based on some culture. It looked more or less as below

```
[Route("api/[controller]")]
[ApiController]
public class PriceController : ControllerBase
{
    [HttpGet]
    public ActionResult Get(string cultureCode = "de-DE")
    {
        var cultureInfo = CultureInfo.CreateSpecificCulture(cultureCode);
        var price = 10m;
        
        return new
        {
            price,
            formattedPrice = price.ToString("C", cultureInfo),
            currencySymbol = cultureInfo.NumberFormat.CurrencySymbol
        };
    }
}

We also had some integration tests for that piece of logic
public class PriceTests : IClassFixture>
{
    private readonly WebApplicationFactory _factory;

    public PriceTests(WebApplicationFactory factory)
    {
        _factory = factory;
    }
        
    [Fact]
    public async Task GetPrice_ReturnsCorrectCurrency()
    {
        var httpClient = _factory.CreateClient();
        var httpResponseMessage = await httpClient.GetAsync("api/Price");
            
        httpResponseMessage.EnsureSuccessStatusCode();
        var content = await httpResponseMessage.Content.ReadAsStringAsync();
        var jObject = JObject.Parse(content);

        jObject["currencySymbol"].ToObject().Should().Be("€");
    }
}

The tests were run during a CI build in a container with an image defined as below
# Builder image
FROM mcr.microsoft.com/dotnet/core/sdk:2.1.700-alpine AS builder
WORKDIR /sln

COPY ./*.sln ./

# Copy the main source project files
COPY src/*/*.csproj ./
RUN for file in $(ls *.csproj); do mkdir -p src/${file%.*}/ && mv $file src/${file%.*}/; done

# Copy the test project files
COPY test/*/*.csproj ./
RUN for file in $(ls *.csproj); do mkdir -p test/${file%.*}/ && mv $file test/${file%.*}/; done

RUN dotnet restore

# Copy across the rest of the source files
COPY ./test ./test
COPY ./src ./src

RUN dotnet build -c Release

RUN dotnet test "./test/AlpineMissingCurrencySymbol.Tests/AlpineMissingCurrencySymbol.Tests.csproj" \
    -c Release --no-build --no-restore

RUN dotnet publish "./src/AlpineMissingCurrencySymbol/AlpineMissingCurrencySymbol.csproj" \
    -c Release -o "../../dist" --no-restore

# App image
FROM mcr.microsoft.com/dotnet/core/aspnet:2.1.11-alpine
WORKDIR /app
ENTRYPOINT ["dotnet", "AlpineMissingCurrencySymbol.dll"]
COPY --from=builder /sln/dist .

At this point, we were sure that everything works fine, as the tests were green and everything was also working correctly on our local machines. However, after deployment to a testing environment, we started getting invalid currency symbols
curl localhost:8080/api/price 
{ 
  "price": 10, 
  "formattedPrice": "¤10.00", 
  "currencySymbol": "¤" 
}

As you can see the response contains ¤ (invariant currency symbol) instead of expected €. It took us some time to figure this out but finally, it turned out that aspnet:2.1.11-alpine image(the one we used for running the application) contrary to the SDK image(used for building and running tests) is missing icu-libs package. In default conditions, the application should throw the following exception during the startup
FailFast:
Couldn't find a valid ICU package installed on the system. Set the configuration flag System.Globalization.Invariant to true if you want to run with no globalization support.

   at System.Environment.FailFast(System.String)
   at System.Globalization.GlobalizationMode.GetGlobalizationInvariantMode()
   at System.Globalization.GlobalizationMode..cctor()
   at System.Globalization.CultureData.CreateCultureWithInvariantData()
   at System.Globalization.CultureData.get_Invariant()
   at System.Globalization.CultureInfo..cctor()
   at System.StringComparer..cctor()
   at System.AppDomain.InitializeCompatibilityFlags()
   at System.AppDomain.Setup(System.Object)

However, aspnet:2.1.11-alpine image has the DOTNET_SYSTEM_GLOBALIZATION_INVARIANT flag set to true by default, so the missing package was not validated during a startup. After all, in order to fix the issue, we had to install the icu-libs package and also set the DOTNET_SYSTEM_GLOBALIZATION_INVARIANT back to false. This was done by these two lines in Dockerfile
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false 
RUN apk add --no-cache icu-libs 

Once the lines were added the application started working as expected
curl localhost:8080/api/price 
{ 
  "price": 10, 
  "formattedPrice": "10,00 €", 
  "currencySymbol": "€" 
} 

Source code for this post can be found here
```
