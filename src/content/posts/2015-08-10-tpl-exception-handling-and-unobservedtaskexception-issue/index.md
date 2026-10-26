---
title: "TPL - exception handling and UnobservedTaskException issue"
published: 2015-08-10T19:12:00.000Z
categories: 
  - "net-4-0"
  - "net-4-5"
  - "tpl"
  - "unobservedtaskexception"
tags: 
  - "net-4-0"
  - "net-4-5"
  - "tpl"
  - "unobservedtaskexception"
---

### 1\. Introduction

Working with `Tasks` is a modern way of writing asynchronous code in an easy and flexible manner.
It is quite straightforward to start using them, so usually developers do not investigate thoroughly the topic.
Unfortunately this often leads to unpleasant surprises - especially when it comes to exception handling.
Having this in mind let's take a look how to handle exceptions in `Task` and what can happen if we do it wrong.

### 2\. Exception handling

Because of the fact that `Tasks` are run asynchronously we can't just use a standard `try catch` block surrounding `Task`

```csharp
public static void TryCatchBlockWrongWay()
{
    try
    {
        Task.Factory.StartNew(() => { throw new Exception("From method TryCatchBlockWrongWay"); });
    }
    catch (Exception ex)
    {
        // this will never be hit
        Console.WriteLine("Exception handled {0}", ex);
    }
}
```

In that case catch block is unreachable (I will describe later what happens with that exception), of course we could use `try catch` inside `Task.Factory.StartNew` lambda expression but this is not always the case.
Usually we want to handle exception in the caller of the `Task`, not inside the `Task` itself.
There are couple of ways of achieving that - depending on the situation you can use one of the following ways.
Exception are propagated to caller once you start waiting for the result of `Task`.
So basically you can use `try catch` block if you wait for a `Task` to finish - either by accessing `Result` property or using `Wait` method

```csharp
public static void HandleExceptionTryCatchResult()
{
    try
    {
        var task = Task.Factory.StartNew(() =>
        {
            throw new Exception("From method HandleExceptionTryCatchResult");
            return 1;
        });
        // do more stuff while task is running
        // do more stuff while task is running
        // do more stuff while task is running
        var result = task.Result;
    }
    catch (Exception ex)
    {
        Console.WriteLine("HandleExceptionTryCatchResult: exception handled in try catch block. Exception is {0}", ex);
    }
}

public static void HandleExceptionTryCatchWait()
{
    try
    {
        var task = Task.Factory.StartNew(() => { throw new Exception("From method HandleExceptionTryCatchWait"); });
        // do more stuff while task is running
        // do more stuff while task is running
        // do more stuff while task is running
        task.Wait();
    }
    catch (Exception ex)
    {
        Console.WriteLine("HandleExceptionTryCatchWait: exception handled in try catch block. Exception is {0}", ex);
    }
}

```

However accessing `Result` or calling `Wait` method are blocking calls, so this might not be a perfect solution for every scenario.
Fortunately we can also leverage `ContinueWith` method which gives you an ability to specify what should be done once `Task` finishes processing the operation.
What is more important you can configure this method to only be called if exception occurs.
Nonetheless there is one crucial thing you have to remember - in order to make exception handled or observed you have to access `Exception` property of `Task`...

```csharp
public static void HandleExceptionContinueWith()
{
    Task.Factory.StartNew(() => { throw new Exception("From method HandleExceptionContinueWith"); })
                .ContinueWith(val =>
                {
                    // we need to access val.Exception property otherwise unobserved exception will be thrown
                    // ReSharper disable once PossibleNullReferenceException
                    foreach (var ex in val.Exception.Flatten().InnerExceptions)
                    {
                        Console.WriteLine("HandleExceptionContinueWith: exception handled in ContinueWith. Exception is {0}", ex);
                    }
                }, TaskContinuationOptions.OnlyOnFaulted);
}

```

or call `Handle` method from `AggregateException` object

```csharp
public static void HandleExceptionContinueWithAndHandleMethod()
{
    Task.Factory.StartNew(() => { throw new Exception("From method HandleExceptionContinueWith"); })
                .ContinueWith(val =>
                {
                    val.Exception.Handle(ex =>
                    {
                        Console.WriteLine("HandleExceptionContinueWith: exception handled in AggregateException.Handle. Exception is {0}", ex);
                        return true;
                    });
                }, TaskContinuationOptions.OnlyOnFaulted);
}
```

Otherwise exception will not be handled which may cause a lot of troubles described in section 3 of this post.
Lastly if you use `.NET 4.5` you can also just use `async await` and `try catch` block

```csharp
// called from Main
public static async void HandleExceptionTryCatchAwait()
{
    try
    {
        await HandleExceptionTryCatchAwaitInternal();
    }
    catch (Exception ex)
    {
        Console.WriteLine("HandleExceptionTryCatchAwait: exception handled in try catch block");
    }
}

private static async Task<int> HandleExceptionTryCatchAwaitInternal()
{
    return await Task.Factory.StartNew(() =>
    {
        throw new Exception();
        return 1;
    }, TaskCreationOptions.LongRunning);
}
```

### 3\. Handling UnobservedTaskException

If it happens that exception thrown by `Task` is not handled, once the `Task` is garbage-collected, finalizer thread will throw `UnobservedTaskException`.

```csharp
Task.Factory.StartNew(() => { throw new Exception("fire-and-forget no exception handling"); });
using (var autoresetEvent = new AutoResetEvent(false))
{
    //wait for task to run
    autoresetEvent.WaitOne(TimeSpan.FromSeconds(2));
}

Console.WriteLine("GC: Collecting");
GC.Collect();
GC.WaitForPendingFinalizers();
Console.WriteLine("GC: Collected");
```

The implication of this depends on framework we are running our application on. If you run your app on `.NET 4.5` or later version, with default escalation policy, `TaskScheduler.UnobservedTaskException` event will be raised and basically that is all.
No more further problems, so basically you may not even realize that there is something like `UnobservedTaskException`.
However if we add this entry

```xml
<runtime>
    <ThrowUnobservedTaskExceptions enabled="true"/>
</runtime>
```

to `app.config` our process will be killed once `UnobservedTaskExceptionis` is thrown.

[![UnobservedTaskExceptionis](images/ProcessKilled.png)](http://tpodolak.com/blog/wp-content/uploads/2015/08/tpl-exception-handling-and-unobservedtaskexception-issue/ProcessKilled.png)

The problem arises in `.NET 4.0` (if you run your app on `.NET 4.0` not only compile it against this framework version), in this version of framework default escalation policy is very strict and will kill our process once the `UnobservedTaskException` is thrown by finalizer thread.
Furthermore you cannot change this policy using `app.config`. Fortunately there is a one last chance to handle UnobservedExceptions and prevent our process from being killed.
All you have to do is to wire up `TaskScheduler.UnobservedTaskException` static event handler and then set exception to observed state

```csharp
TaskScheduler.UnobservedTaskException += TaskScheduler_UnobservedTaskException;
private static void TaskScheduler_UnobservedTaskException(object sender, UnobservedTaskExceptionEventArgs e)
{
    e.SetObserved();
}
```

There is one more thing to clarify. You can compile your library against `.NET 4.0` but if you have `.NET 4.5` installed on your machine, your application is launched and run on `.NET 4.5`.
This means that escalation policy from `.NET 4.5` will be used - so by default process will not be killed.
In order to simulate pure `.NET 4.0` behavior while having `.NET 4.5` installed you have to add

```xml
<runtime>
    <ThrowUnobservedTaskExceptions enabled="true"/>
</runtime>
```

in your `app.config` as it was mentioned before. Otherwise you would have to uninstall `.NET 4.5` in order to, for example reproduce production issue.

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/HandlingUnobservedTaskExceptions)
