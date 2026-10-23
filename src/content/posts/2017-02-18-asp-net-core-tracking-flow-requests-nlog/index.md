---
title: "ASP.NET Core - tracking flow of requests with NLog"
published: 2017-02-18T14:11:18.000Z
categories: 
  - "asp-net-core"
  - "nlog"
tags: 
  - "asp-net-core"
  - "nlog"
---

### 1\. Introduction

A while ago I wrote an [article](//tpodolak.com/blog/2016/07/05/nlog-tracking-flow-of-requests-using-mappeddiagnosticslogicalcontext/) about using _MappedDiagnosticsLogicalContext_ for tracking request flow in your application. As we are moving our project to _ASP.NET Core_, I wanted to keep that functionality in place. Unfortunately, _MDLC_ layout renderer is not available in that framework anymore(when targeting _.NET Core_). Luckily, there are two other renderers which can be used as a replacement:

- aspnet-traceidentifier
- aspnet-item

### 2\. Configuring NLog

Before I dig into details of layout renderers mentioned above, we have to configure _ASP.NET Core_ to use _NLog_ as a logger. First of all, we need to grab _NLog.Web.AspNetCore_ _NuGet_ package. Once the package is installed we have to manually add _NLog.config_ to the project (the file won't be added automatically by _NuGet_ installer). The next step is to configure _NLog_ with our config, then configure _NLogWeb_ and finally register _NLog_ in _LoggingFactory_. All of these steps should be done in _Startup_ class.

```
public class Startup
{
    public Startup(IHostingEnvironment env)
    {
        // rest of the code omitted for brevity
        env.ConfigureNLog("NLog.config");
        // rest of the code omitted for brevity
    }
	
    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
    {
        // rest of the code omitted for brevity
        loggerFactory.AddNLog();
        app.AddNLogWeb();
        // rest of the code omitted for brevity
    }
}	

```

The final step required for _NLog_ to work is to register _HttpContextAccessor_ in _IoC_ container of your choice. If you use the build one, you can do it like that

```
public class Startup
{
    // rest of the code omitted for brevity
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddSingleton();
    }
    // rest of the code omitted for brevity
}

```

### 3\. Using aspnet-traceidentifier renderer

_Aspnet-traceidentifier_ layout renderer allows you to obtain value of _TraceIdentifier_ property from current _HttpContext_. _TraceIdentifier_ is basically unique id which identifies the request. The renderer can be used as follows

From now on (without any additional configuration) every log entry logged (once _HttpContext_ is created), will contain _TraceIdentifier_.

```
	TimeStamp=2017-02-15 23:10:52.1901 Level=INFO TraceId=0HL2LTTU3JVBI Message=Request starting HTTP/1.1 GET http://localhost:50334/api/values  
	TimeStamp=2017-02-15 23:10:52.1941 Level=DEBUG TraceId=0HL2LTTU3JVBI Message=Request successfully matched the route with name '' and template 'api/Values'.
	TimeStamp=2017-02-15 23:10:52.1941 Level=DEBUG TraceId=0HL2LTTU3JVBI Message=Action 'AspNetCoreLoggingWithCorrelationId.Controllers.ValuesController.Post (AspNetCoreLoggingWithCorrelationId)' with id 'a133346a-a8f9-4182-ac10-efa1afb18c4d' did not match the constraint 'Microsoft.AspNetCore.Mvc.Internal.HttpMethodActionConstraint'
	TimeStamp=2017-02-15 23:10:52.1941 Level=DEBUG TraceId=0HL2LTTU3JVBI Message=Executing action AspNetCoreLoggingWithCorrelationId.Controllers.ValuesController.Get (AspNetCoreLoggingWithCorrelationId)
	TimeStamp=2017-02-15 23:10:52.2091 Level=INFO TraceId=0HL2LTTU3JVBI Message=Executing action method AspNetCoreLoggingWithCorrelationId.Controllers.ValuesController.Get (AspNetCoreLoggingWithCorrelationId) with arguments () - ModelState is Valid
	TimeStamp=2017-02-15 23:10:52.2091 Level=INFO TraceId=0HL2LTTU3JVBI Message=Get method requested
	TimeStamp=2017-02-15 23:10:52.2091 Level=INFO TraceId=0HL2LTTU3JVBI Message=Log from Get action, from thread=4
	TimeStamp=2017-02-15 23:10:52.2271 Level=INFO TraceId=0HL2LTTU3JVBI Message=Log from Get, from thread 3 assigned by scheduler
	TimeStamp=2017-02-15 23:10:52.2271 Level=INFO TraceId=0HL2LTTU3JVBI Message=Log from Get action, from async continuation, from thread 3
	TimeStamp=2017-02-15 23:10:52.2422 Level=INFO TraceId=0HL2LTTU3JVBI Message=Log from Get action, from explicitly created thread 15
	TimeStamp=2017-02-15 23:10:52.3212 Level=DEBUG TraceId=0HL2LTTU3JVBI Message=Executed action method AspNetCoreLoggingWithCorrelationId.Controllers.ValuesController.Get (AspNetCoreLoggingWithCorrelationId), returned result Microsoft.AspNetCore.Mvc.ObjectResult.
	TimeStamp=2017-02-15 23:10:52.3212 Level=DEBUG TraceId=0HL2LTTU3JVBI Message=No information found on request to perform content negotiation.
	TimeStamp=2017-02-15 23:10:52.3322 Level=DEBUG TraceId=0HL2LTTU3JVBI Message=Selected output formatter 'Microsoft.AspNetCore.Mvc.Formatters.JsonOutputFormatter' and content type 'application/json' to write the response.
	TimeStamp=2017-02-15 23:10:52.3322 Level=INFO TraceId=0HL2LTTU3JVBI Message=Executing ObjectResult, writing value Microsoft.AspNetCore.Mvc.ControllerContext.
	TimeStamp=2017-02-15 23:10:52.3492 Level=INFO TraceId=0HL2LTTU3JVBI Message=Executed action AspNetCoreLoggingWithCorrelationId.Controllers.ValuesController.Get (AspNetCoreLoggingWithCorrelationId) in 140.4884ms
	TimeStamp=2017-02-15 23:10:52.3492 Level=INFO TraceId=0HL2LTTU3JVBI Message=Request finished in 170.7178ms 200 application/json; charset=utf-8
	TimeStamp=2017-02-15 23:10:52.3672 Level=DEBUG TraceId= Message=Connection id "0HL2LTTU1ONI7" completed keep alive response.

```

### 4\. Using aspnet-item renderer

If for some reasons we don’t like to use _TraceIdentifier_ as our CorrelationId, we can leverage _aspnet-item_ renderer, which basically allows you to read data from _HttpContext.Items_ collection. However in that case, we are responsible for providing and storing unique identifier of request in HttpContext.Items. Fortunately it is pretty straightforward to do with custom middleware.

```
public class LoggingMiddleware
{
    private readonly ILogger logger;
    private readonly RequestDelegate next;
	
    public LoggingMiddleware(ILogger logger, RequestDelegate next)
    {
        this.logger = logger;
        this.next = next;
    }
	
    public async Task Invoke(HttpContext context)
    {
        context.Items["CorrelationId"] = Guid.NewGuid().ToString();
        logger.LogInformation($"About to start {context.Request.Method} {context.Request.GetDisplayUrl()} request");
	
        await next(context);

        logger.LogInformation($"Request completed with status code: {context.Response.StatusCode} ");
    }
}

```

Of course we have to also use this middleware in our application so we have to add following line

```
app.UseMiddleware();

```

in configure method of our _Startup_ class. Having all the pieces in place, now we can append _CorrelationId_ read from _HttpContext.Items_ to our log entries with following configuration

From now on, _CorrelationId_ will be automatically added to our log entries

```
TimeStamp=2017-02-15 23:35:56.8333 Level=INFO CorrelationId= Message=Request starting HTTP/1.1 GET http://localhost:50334/api/values  
TimeStamp=2017-02-15 23:35:56.8333 Level=INFO CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=About to start GET http://localhost:50334/api/values request
TimeStamp=2017-02-15 23:35:56.8333 Level=DEBUG CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Request successfully matched the route with name '' and template 'api/Values'.
TimeStamp=2017-02-15 23:35:56.8513 Level=DEBUG CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Action 'AspNetCoreLoggingWithCorrelationId.Controllers.ValuesController.Post (AspNetCoreLoggingWithCorrelationId)' with id '5d60d23c-ddef-4d20-98eb-a0c03885bea5' did not match the constraint 'Microsoft.AspNetCore.Mvc.Internal.HttpMethodActionConstraint'
TimeStamp=2017-02-15 23:35:56.8513 Level=DEBUG CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Executing action AspNetCoreLoggingWithCorrelationId.Controllers.ValuesController.Get (AspNetCoreLoggingWithCorrelationId)
TimeStamp=2017-02-15 23:35:56.8513 Level=INFO CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Executing action method AspNetCoreLoggingWithCorrelationId.Controllers.ValuesController.Get (AspNetCoreLoggingWithCorrelationId) with arguments () - ModelState is Valid
TimeStamp=2017-02-15 23:35:56.8673 Level=INFO CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Get method requested
TimeStamp=2017-02-15 23:35:56.8673 Level=INFO CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Log from Get action, from thread=3
TimeStamp=2017-02-15 23:35:56.8923 Level=INFO CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Log from Get, from thread 4 assigned by scheduler
TimeStamp=2017-02-15 23:35:56.8993 Level=INFO CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Log from Get action, from async continuation, from thread 4
TimeStamp=2017-02-15 23:35:56.8993 Level=INFO CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Log from Get action, from explicitly created thread 16
TimeStamp=2017-02-15 23:35:56.9163 Level=DEBUG CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Executed action method AspNetCoreLoggingWithCorrelationId.Controllers.ValuesController.Get (AspNetCoreLoggingWithCorrelationId), returned result Microsoft.AspNetCore.Mvc.ObjectResult.
TimeStamp=2017-02-15 23:35:56.9163 Level=DEBUG CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=No information found on request to perform content negotiation.
TimeStamp=2017-02-15 23:35:56.9274 Level=DEBUG CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Selected output formatter 'Microsoft.AspNetCore.Mvc.Formatters.JsonOutputFormatter' and content type 'application/json' to write the response.
TimeStamp=2017-02-15 23:35:56.9274 Level=INFO CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Executing ObjectResult, writing value Microsoft.AspNetCore.Mvc.ControllerContext.
TimeStamp=2017-02-15 23:35:56.9444 Level=INFO CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Executed action AspNetCoreLoggingWithCorrelationId.Controllers.ValuesController.Get (AspNetCoreLoggingWithCorrelationId) in 83.2831ms
TimeStamp=2017-02-15 23:35:56.9444 Level=INFO CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Request completed with status code: 200 
TimeStamp=2017-02-15 23:35:56.9674 Level=INFO CorrelationId=15989892-9f27-49d0-88b5-ced61b6851ac Message=Request finished in 134.3253ms 200 application/json; charset=utf-8
TimeStamp=2017-02-15 23:35:56.9764 Level=DEBUG CorrelationId= Message=Connection id "0HL2LUBSKVM2T" completed keep alive response.

```

### 6\. It works in multithreading scenarios

If you take a closer look at logs presented above, you will see that both of the renderers can log proper _CorrelationId_/_TraceId_ regardless of the thread from which the logger was called. This is possible thanks to implementation of _HttpContextAccessor_ which uses _AsyncLocal_ under the hood, which allows you to persist data across threads.

```
// decompiled code
namespace Microsoft.AspNetCore.Http
{
    public class HttpContextAccessor : IHttpContextAccessor
    {
        private AsyncLocal _httpContextCurrent = new AsyncLocal();
	
        public HttpContext HttpContext
        {
            get
            {
                return this._httpContextCurrent.Value;
            }
            set
            {
                this._httpContextCurrent.Value = value;
            }
        }
    }
}    

```

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/AspNetCoreLoggingWithCorrelationId)
