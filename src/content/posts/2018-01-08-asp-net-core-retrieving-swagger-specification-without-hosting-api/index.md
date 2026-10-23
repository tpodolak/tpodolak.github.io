---
title: "ASP.NET Core - retrieving swagger specification without hosting API"
published: 2018-01-08T08:00:19.000Z
categories: 
  - "asp-net-core"
tags: 
  - "asp-net-core"
  - "swagger"
---

### 1\. Introduction

I am currently exploring possible ways of removing a repetitive work when it comes to creating integration tests for our _API_. The one thing which usually takes some time when testing a new endpoint is a process of creating response and request classes (as we don't share the models between API project and integration test project). That is why I would like to have some kind of a tool (_AutoRest_ or _NSwag_) which would do it for us (possibly, in a prebuild step). As those tools generate _API_ clients based on swagger specification and I wanted this process to be as fast as possible I decided to figure out the way how to retrieve swagger specs without hosting the _API_.

### 2\. Implementation

After taking a look at _Swashbuckle.AspNetCore.Swagger_ source code it turned out that _Swashbuckle.AspNetCore.Swagger.ISwaggerProvider_ is responsible for creating a SwaggerDocument class. _JSON_ representation of that class is a swagger specification. Having all of that in mind I wrote following piece of code.

```
public class SchemaRetriever
{
    private readonly Lazy _webHostProxy = new Lazy(() => Program.BuildWebHost(new string[0]));

    private IWebHost WebHost => _webHostProxy.Value;
        
    public string RetrieveSchema(string swaggerDocument)
    {
        using (var scope = WebHost.Services.CreateScope())
        {
            var serviceProvider = scope.ServiceProvider;
            var swaggerProvider = serviceProvider.GetRequiredService();
            var mvcJsonOptions = serviceProvider.GetRequiredService>();
            var document = swaggerProvider.GetSwagger(swaggerDocument, null, "/");

            var serializer = new JsonSerializer
                {
                    NullValueHandling = NullValueHandling.Ignore,
                    Formatting = mvcJsonOptions.Value.SerializerSettings.Formatting,
                    ContractResolver = new SwaggerContractResolver(mvcJsonOptions.Value.SerializerSettings)
                };

            using (var stringWriter = new StringWriter())
            {
                serializer.Serialize(stringWriter, document);
                return stringWriter.ToString();
            }   
        }
    }
}

public class Program
{
    public static void Main(string[] args)
    {
        BuildWebHost(args).Run();
    }

    public static IWebHost BuildWebHost(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseStartup()
                .Build();
}

```

The _Program_ class is an entry point of the _API_. The only one difference compared to default _ASP.NET Core_ template is the fact that I made the _BuildWebHost_ method public. Thanks to that we can build the host (but without running) and get our hands on the _DI_ container of our application. From that point the rest is easy, I retrieve the _ISwaggerProvider_ from the container so I can get the swagger document for given id. [![](images/TestWithoutHosting.png)](//tpodolak.com/blog/wp-content/uploads/2018/01/asp-net-core-retrieving-swagger-specification-without-hosting-api/TestWithoutHosting.png) In order to make sure that the _SchemaRetriever_ works as expected I wrote simple integration test which makes sure that swagger specs from hosted _API_ is the same as the one retrieved without hosting.

```
[Fact]
public async Task RetrieveSchema_RetrievesSwaggerSchema_SameAsDeployedSchema()
{
    var swaggerSchemaWithoutHosting = _subject.RetrieveSchema(_swaggerDocumentName);
    using (var testServer = new TestServer(new WebHostBuilder().UseStartup()))
    {
        using (var httpClient = testServer.CreateClient())
        {
            var response = await httpClient.GetAsync($"swagger/{EscapeDataString(_swaggerDocumentName)}/swagger.json");
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();

            swaggerSchemaWithoutHosting.Should().Be(content);
        }
    }
}

```

[![](images/IntegrationTest.png)](//tpodolak.com/blog/wp-content/uploads/2018/01/asp-net-core-retrieving-swagger-specification-without-hosting-api/IntegrationTest.png) Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/AspNetCoreManuallyRetrieveSwaggerSchema)
