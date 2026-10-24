---
title: "ASP.NET Core – custom ILogger<T> and Nlog callsite layout renderer issue"
published: 2018-03-01T08:00:34.000Z
categories: 
  - "asp-net-core"
tags: 
  - "asp-net-core"
  - "logging"
---

### 1\. Introduction

In my current project, we use `Microsoft.Extensions.Logging.ILogger<T>` default implementation as our logging mechanism. This basically comes with the `ASP.NET Core 2.0` package and it was working fine so far. However recently we decided to switch the default implementation with a custom one, due to the fact that we wanted to have some additional logic applied for all of the logging providers.

### 2\. Implementation

The custom implementation itself is very similar to the original one, we came up with something like that

```csharp
public class Logger : ILogger
{
    private readonly ILogger _logger;

    public Logger(ILoggerFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger();
    }

    public void Log(LogLevel, EventId, TState state, Exception, Func formatter)
    {
        string Formatter(TState innserState, Exception innerException)
        {
            // additional logic goes here, in my case that was extracting additional information from custom exceptions
            var message = formatter(innserState, innerException) ?? string.Empty;
            return message + " additional stuff in here";
        }

        _logger.Log(logLevel, eventId, state, exception, Formatter);
    }

    public bool IsEnabled(LogLevel logLevel)
    {
        return _logger.IsEnabled(logLevel);
    }

    public IDisposable BeginScope(TState state)
    {
        return _logger.BeginScope(state);
    }
}

```

and we replaced the default logger with this code

```csharp
services.Replace(new ServiceDescriptor(typeof(ILogger<>), typeof(Logger.Logger<>), ServiceLifetime.Singleton));

```

As you can see we basically wanted to add information from custom exceptions to the message. Due to the fact that this is added in here, we don’t have to modify all of our existing logging providers.

### 3\. `NLog` call site renderer issue

Once we run the application all of the providers were working fine and were producing expected output apart from `NLog` provider. Originally `NLog` provider for the following code

```csharp
[Route("api/[controller]")]
public class ValuesController : Controller
{
    private readonly ILogger _logger;

    public ValuesController(ILogger logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public IEnumerable Get()
    {
        _logger.LogTrace("Get method called trace");
        _logger.LogWarning("Get method called warning");
        _logger.LogError("Get method called error");
        _logger.LogInformation("Get method called information");

        return new string[] {"value1", "value2"};
    }
}

```

was producing this output

```log wrap=false
TimeStamp=2018-02-28 20:14:37.2711 Callsite=AspNetCoreCustomLoggerAndNLogCallsiteIssue.Controllers.ValuesController.Get Level=TRACE Message=Get method called trace 
TimeStamp=2018-02-28 20:14:37.3261 Callsite=AspNetCoreCustomLoggerAndNLogCallsiteIssue.Controllers.ValuesController.Get Level=WARN Message=Get method called warning 
TimeStamp=2018-02-28 20:14:37.3261 Callsite=AspNetCoreCustomLoggerAndNLogCallsiteIssue.Controllers.ValuesController.Get Level=ERROR Message=Get method called error 
TimeStamp=2018-02-28 20:14:37.3261 Callsite=AspNetCoreCustomLoggerAndNLogCallsiteIssue.Controllers.ValuesController.Get Level=INFO Message=Get method called information 

```

However, after introducing new implementation of `ILogger<T>`, it started appending wrong caller member name

```log wrap=false
TimeStamp=2018-02-28 20:17:27.4044 Callsite=AspNetCoreCustomLoggerAndNLogCallsiteIssue.Logger`1.Log Level=TRACE Message=Get method called trace additional stuff in here 
TimeStamp=2018-02-28 20:17:27.5117 Callsite=AspNetCoreCustomLoggerAndNLogCallsiteIssue.Logger`1.Log Level=WARN Message=Get method called warning additional stuff in here 
TimeStamp=2018-02-28 20:17:27.5117 Callsite=AspNetCoreCustomLoggerAndNLogCallsiteIssue.Logger`1.Log Level=ERROR Message=Get method called error additional stuff in here 
TimeStamp=2018-02-28 20:17:27.5202 Callsite=AspNetCoreCustomLoggerAndNLogCallsiteIssue.Logger`1.Log Level=INFO Message=Get method called information additional stuff in here 

```

After some digging, it turned out that the issue lies in the (indirect)configuration of `NLog's` [callsite layout renderer](https://github.com/NLog/NLog/wiki/Callsite-layout-renderer). Long story short, when you add `NLog` provider to your logger providers, under the hood it adds `Microsoft.Extensions.Logging.Abstractions` assembly(among others) to something called hidden assembly collection. Once the `NLog` tries to figure out what is the caller member name, it crawls the stack trace to find a method name. If the method in current frame comes from a hidden assembly, logger skips it and continues iteration. As we changed the `Logger<T>` to our custom one, it is no longer part of `Microsoft.Extensions.Logging.Abstractions` assembly, so the `NLog` reports `Log` method from our custom logger as a caller member name.

### 4\. The fix

In order to restore previous behavior you have to add custom logger assembly to the hidden assembly collection. You can do it via

```csharp
LogManager.AddHiddenAssembly(typeof(Logger.Logger<>).Assembly);

```

Of course, if the logger is located in the same assembly as rest of your code, this might not be the perfect solution - as this will impact the way the callsite is rendered for other parts of your code in this assembly. In that case, you might consider moving the logging piece to separate assembly or resign from using callsite layout renderer at all. We decided to replace it with [logger layout renderer](https://github.com/NLog/NLog/wiki/Logger-Layout-Renderer) as callsite layout renderer, either way, wouldn’t be used in production environments.

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/AspNetCoreCustomLoggerAndNLogCallsiteIssue)
