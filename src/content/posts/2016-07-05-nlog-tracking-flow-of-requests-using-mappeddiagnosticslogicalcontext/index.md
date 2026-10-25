---
title: "NLog - tracking flow of requests using MappedDiagnosticsLogicalContext"
published: 2016-07-05T20:38:53.000Z
categories: 
  - "net-4-5"
  - "nlog"
tags: 
  - "logging"
  - "mappeddiagnosticslogicalcontext"
  - "nlog"
---

### 1\. Problem

Everyone who has ever had to analyze logs from production environment knows, that quite often it is not an easy task. Usually application flow is deduced by log entries matched by thread id, which is problematic when you deal with multithreading scenarios. Say for example we have following piece of code

```csharp
public class HomeController : Controller
{
    private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
    
    public async Task<ActionResult> Index()
    {
        await PreprocessRequest(nameof(Index));
        return View();
    }
    
    private static async Task PreprocessRequest(string actionName)
    {
        Logger.Info($"Log from {actionName} action, from thread={Thread.CurrentThread.ManagedThreadId}");
        
        await Task.Run(() => Logger.Info($"Log from {actionName}, from thread {Thread.CurrentThread.ManagedThreadId} assigned by scheduler"))
                  .ConfigureAwait(continueOnCapturedContext: false);
        Logger.Info($"Log from {actionName} action, from async continuation, from thread {Thread.CurrentThread.ManagedThreadId}");
               
        var thread =
            new Thread(() => Logger.Info($"Log from {actionName} action, from explicitly created thread {Thread.CurrentThread.ManagedThreadId}"));
        thread.Start();
        thread.Join();
    }
}

```

Default log file usually looks like that

```log wrap=false showLineNumbers=false
TimeStamp=2016-07-03 11:56:02.2327 ThreadId=5 Level=INFO Message=About to start GET / request
TimeStamp=2016-07-03 11:56:02.3797 ThreadId=5 Level=INFO Message=Log from Index action, from thread=5
TimeStamp=2016-07-03 11:56:02.3797 ThreadId=6 Level=INFO Message=Log from Index, from thread 6 assigned by scheduler
TimeStamp=2016-07-03 11:56:02.3797 ThreadId=6 Level=INFO Message=Log from Index action, from async continuation, from thread 6
TimeStamp=2016-07-03 11:56:02.3917 ThreadId=14 Level=INFO Message=Log from Index action, from explicitly created thread 14
TimeStamp=2016-07-03 11:56:04.8250 ThreadId=8 Level=INFO Message=Request completed with status code: 200 

```

Having multiple simultaneous `Index` requests, makes it almost impossible to figure out which log entry is part of which call. Fortunately with `NLog` it is possible to solve this problem without too much of a hassle.

### 2\. Proposed solution

The whole idea is to leverage `MappedDiagnosticsLogicalContext` "storage" to keep some unique identifier of request for entire call. Note, that this identifier will be accessible also from other threads created from within given call. In order to set unique request id (also known as correlation id) I will use custom `HttpModule`. The very first implementation looks like that

```csharp
public class LoggingHttpModule : IHttpModule
{
    private const string CorrelationIdKey = "correlationid";

    private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

    public void Init(HttpApplication context)
    {
        context.BeginRequest += HandleBeginRequest;
        context.EndRequest += HandleEndRequest;
    }

    public void Dispose()
    {
    }

    private void HandleBeginRequest(object sender, EventArgs e)
    {
        var value = Guid.NewGuid().ToString();
        var httpApplication = (HttpApplication) sender;
        var httpContext = httpApplication.Context;
        MappedDiagnosticsLogicalContext.Set(CorrelationIdKey, value);
        Logger.Info($"About to start {httpContext.Request.HttpMethod} {httpContext.Request.RawUrl} request");
    }

    private void HandleEndRequest(object sender, EventArgs e)
    {
        var httpApplication = (HttpApplication) sender;
        var httpContext = httpApplication.Context;
        Logger.Info($"Request completed with status code: {httpContext.Response.StatusCode} ");
    }
}
```

Once the `HttpModule` is ready it is necessary to register it in `web.config`.

```xml
<!--rest of the code omitted -->
<system.webServer>
  <modules>
  <!--rest of the code omitted -->
    <add name="LoggingHttpModule" type="AspNetMvcLoggingWithCorrelationId.HttpModules.LoggingHttpModule"/>
  </modules>
</system.webServer>
<!--rest of the code omitted -->
<system.web>
<!--rest of the code omitted -->
  <httpModules>
  <!--rest of the code omitted -->
    <add name="ApplicationInsightsWebTracking" type="Microsoft.ApplicationInsights.Web.ApplicationInsightsHttpModule,Microsoft.AI.Web"/>
  </httpModules>
</system.web>
```

From now on, every request goes through `LogginHttpModule` and proper `correlationId` is set in `MappedDiagnosticsLogicalContext`. As we want to have `correlationId` included in log files it is necessary to modify `Nlog.config`. In my case it looks like that
```xml
<?xml version="1.0" encoding="utf-8" ?>
<nlog xmlns="http://www.nlog-project.org/schemas/NLog.xsd"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.nlog-project.org/schemas/NLog.xsd NLog.xsd"
      autoReload="true"
      throwExceptions="false"
      internalLogLevel="Off" internalLogFile="c:\temp\nlog-internal.log" >

  <variable name="myvar" value="myvalue"/>
  <targets>
    <target xsi:type="File" name="f" fileName="${basedir}/logs/${shortdate}.log"
            layout="TimeStamp=${longdate} CorrelationId=${mdlc:item=correlationid} Level=${uppercase:${level}} Message=${message}" />
  </targets>

  <rules>
    <logger name="*" minlevel="Debug" writeTo="f" />
  </rules>
</nlog>
```

Note that we can access our `correlationId` variable via `${mdlc:item=correlationid}` Log file after the changes looks like that

```log wrap=false showLineNumbers=false
TimeStamp=2016-07-03 12:41:35.7292 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=About to start GET / request
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index action, from thread=6
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index, from thread 7 assigned by scheduler
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index action, from async continuation, from thread 7
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index action, from explicitly created thread 9
TimeStamp=2016-07-03 12:41:38.4454 CorrelationId= Level=INFO Message=Request completed with status code: 200

```

This is almost perfect, however for some reasons `correlationId` is lost in `EndRequest` event handler. I am not sure if this is bug in `NLog` (I've posted question in `Nlog's` github) or it is by design, however there is easy workaround for that. We can store our `correlationId` in `HttpContext.Items` collection and reassign it to `MappedDiagnosticsLogicalContext` in `EndRequest` event handler.

```csharp
private void HandleBeginRequest(object sender, EventArgs e)
{
    var value = Guid.NewGuid().ToString();
    var httpApplication = (HttpApplication) sender;
    var httpContext = httpApplication.Context;
    MappedDiagnosticsLogicalContext.Set(CorrelationIdKey, value);

    httpContext.Items[CorrelationIdKey] = value;
    Logger.Info($"About to start {httpContext.Request.HttpMethod} {httpContext.Request.RawUrl} request");
}

private void HandleEndRequest(object sender, EventArgs e)
{
    var httpApplication = (HttpApplication) sender;
    var httpContext = httpApplication.Context;

    var correlationId = httpContext.Items[CorrelationIdKey].ToString();
    MappedDiagnosticsLogicalContext.Set(CorrelationIdKey, correlationId);

    Logger.Info($"Request completed with status code: {httpContext.Response.StatusCode} ");
}

```

After these changes our log file finally looks OK

```log wrap=false showLineNumbers=false
TimeStamp=2016-07-03 12:41:35.7292 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=About to start GET / request
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index action, from thread=6
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index, from thread 7 assigned by scheduler
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index action, from async continuation, from thread 7
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index action, from explicitly created thread 9
TimeStamp=2016-07-03 12:41:38.4454 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Request completed with status code: 200 

```

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/AspNetMvcLoggingWithCorrelationId)
