---
title: "NLog - tracking flow of requests using MappedDiagnosticsLogicalContext"
published: 2016-07-05T20:38:53.000Z
slug: "nlog-tracking-flow-of-requests-using-mappeddiagnosticslogicalcontext"
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

```
public class HomeController : Controller
{
    private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
    
    public async Task Index()
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

```
TimeStamp=2016-07-03 11:56:02.2327 ThreadId=5 Level=INFO Message=About to start GET / request
TimeStamp=2016-07-03 11:56:02.3797 ThreadId=5 Level=INFO Message=Log from Index action, from thread=5
TimeStamp=2016-07-03 11:56:02.3797 ThreadId=6 Level=INFO Message=Log from Index, from thread 6 assigned by scheduler
TimeStamp=2016-07-03 11:56:02.3797 ThreadId=6 Level=INFO Message=Log from Index action, from async continuation, from thread 6
TimeStamp=2016-07-03 11:56:02.3917 ThreadId=14 Level=INFO Message=Log from Index action, from explicitly created thread 14
TimeStamp=2016-07-03 11:56:04.8250 ThreadId=8 Level=INFO Message=Request completed with status code: 200 

```

Having multiple simultaneous _Index_ requests, makes it almost impossible to figure out which log entry is part of which call. Fortunately with _NLog_ it is possible to solve this problem without too much of a hassle.

### 2\. Proposed solution

The whole idea is to leverage _MappedDiagnosticsLogicalContext_ "storage" to keep some unique identifier of request for entire call. Note, that this identifier will be accessible also from other threads created from within given call. In order to set unique request id (also known as correlation id) I will use custom _HttpModule_. The very first implementation looks like that

```
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

Once the _HttpModule_ is ready it is necessary to register it in _web.config_.

From now on, every request goes through _LogginHttpModule_ and proper _correlationId_ is set in _MappedDiagnosticsLogicalContext_. As we want to have _correlationId_ included in log files it is necessary to modify _Nlog.config_. In my case it looks like that

Note that we can access our _correlationId_ variable via _${mdlc:item=correlationid}_ Log file after the changes looks like that

```
TimeStamp=2016-07-03 12:41:35.7292 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=About to start GET / request
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index action, from thread=6
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index, from thread 7 assigned by scheduler
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index action, from async continuation, from thread 7
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index action, from explicitly created thread 9
TimeStamp=2016-07-03 12:41:38.4454 CorrelationId= Level=INFO Message=Request completed with status code: 200

```

This is almost perfect, however for some reasons _correlationId_ is lost in _EndRequest_ event handler. I am not sure if this is bug in _NLog_ (I've posted question in _Nlog's_ github) or it is by design, however there is easy workaround for that. We can store our _correlationId_ in _HttpContext.Items_ collection and reassign it to _MappedDiagnosticsLogicalContext_ in _EndRequest_ event handler.

```
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

```
TimeStamp=2016-07-03 12:41:35.7292 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=About to start GET / request
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index action, from thread=6
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index, from thread 7 assigned by scheduler
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index action, from async continuation, from thread 7
TimeStamp=2016-07-03 12:41:35.8752 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Log from Index action, from explicitly created thread 9
TimeStamp=2016-07-03 12:41:38.4454 CorrelationId=b322d1fa-47b2-4582-b7a9-c9463b7c0a47 Level=INFO Message=Request completed with status code: 200 

```

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/AspNetMvcLoggingWithCorrelationId)
