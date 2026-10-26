---
title: "Using async/await with IAsyncResult pattern"
published: 2016-02-12T17:45:14.000Z
categories: 
  - "async-await"
  - "iasyncresult"
tags: 
  - "async-await"
  - "iasyncresult"
---

Even though in my current project we use `.NET 4.5` we still have lots of references to internal libraries targeting `.NET 4.0`.
Usually it is not a problem, however some of these libraries follow [Asynchronous Programming Model](https://msdn.microsoft.com/pl-pl/library/jj152938\(v=vs.110\).aspx) pattern.
This approach makes the code quite ugly because we end up with lots of nested callbacks.

```csharp
// rest of the code omitted for brevity
private static void GetHostEntryIAsyncResultPattern()
{
    DnsService dnsService = new DnsService();
    dnsService.BeginGetHostEntry(GoogleHost, googleAsyncResult =>
    {
        var googleHostResult = dnsService.EndGetHostEntry(googleAsyncResult);
        Console.WriteLine($"Result from IAsyncResultPattern: {GoogleHost} - {FormatHostEntry(googleHostResult)}");
        dnsService.BeginGetHostEntry(YahooHost, yahooAsyncResult =>
        {
            var yahooHostResult = dnsService.EndGetHostEntry(yahooAsyncResult);
            Console.WriteLine($"Result from IAsyncResultPattern: {YahooHost} - {FormatHostEntry(yahooHostResult)}");
        }, null);
    }, null);
}
// rest of the code omitted for brevity
```

Fortunately thanks to `Task.Factory.FromAsync` method it is possible to quite easily make `Begin`/`End` methods work with `async`/`await` pattern.
All you have to do is to pass `Begin`/`End` methods as an arguments to [Task.Factory.FromAsync](https://msdn.microsoft.com/en-us/library/system.threading.tasks.taskfactory.fromasync\(v=vs.110\).aspx) and you are good to go.
The original code after refactoring looks like that

```csharp
// rest of the code omitted for brevity
var dnsService = new DnsService();
var googleHostResult = await Task.Factory.FromAsync((callback, stateObject) => dnsService.BeginGetHostEntry(GoogleHost, callback, stateObject), dnsService.EndGetHostEntry, null);
Console.WriteLine($"Result from async/await: {GoogleHost} - {FormatHostEntry(googleHostResult)}");

var yahooHostResult = await Task.Factory.FromAsync((callback, stateObject) => dnsService.BeginGetHostEntry(YahooHost, callback, stateObject), dnsService.EndGetHostEntry, null);
Console.WriteLine($"Result from async/await: {YahooHost} - {FormatHostEntry(yahooHostResult)}");
// rest of the code omitted for brevity
```

I think everyone will agree with me that refactored version is much better than original one.

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/BeginInvokeEndInvokeAsyncAwait)
