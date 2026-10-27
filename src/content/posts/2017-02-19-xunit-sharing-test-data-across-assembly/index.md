---
title: "XUnit - sharing test data across assembly"
published: 2017-02-19T14:02:19.000Z
categories:
  - "testing"
tags: 
  - "xunit"
---

### 1\. Introduction

`XUnit` provides two ways of sharing data between tests - `ICollectionFixture` and `IClassFixture`.
The first one allows you to shared context across collections and the second one across test classes.
I've already had a couple of cases in which these fixtures were not enough.
Basically, I wanted to share data between all tests in given assembly - without worrying in which test class or test collection given test is.
In these circumstances, I've usually used some kind of old fashioned singleton or custom `TestFrameworkExecutor`.
I've never liked those solutions, fortunately recently I've come across a nice little library - `xunit.assemblyfixture`.

### 2\. Usage

`Xunit.assemblyfixture` allows you to share data between tests in given assembly via `IAssemblyFixture` interface. The usage is basically the same as in other `XUnit's` fixtures. All we have to do is to create a class which instance we want to share with other tests

```csharp
public class TestFixture : IDisposable
{
    public static int InitializationCounter { get; private set; }

    public TestFixture()
    {
        InitializationCounter++;
    }

    public void Dispose()
    {
        // free resources if necessary
    }
}
```

And then create test classes which implement `IAssemblyFixture` interface.
If we want to have access to the fixture from the tests, we can inject instance of `TFixture` via constructor

```csharp
public class TestBase : IAssemblyFixture<TestFixture>
{
    protected readonly ITestOutputHelper TestOutputHelper;
    protected readonly TestFixture Fixture;

    protected TestBase(ITestOutputHelper testOutputHelper, TestFixture fixture)
    {
        this.TestOutputHelper = testOutputHelper;
        this.Fixture = fixture;
    }

    protected void DisplayInitializationCount()
    {
        TestOutputHelper.WriteLine($"Initialization count: {TestFixture.InitializationCounter}");
    }
}
```

`Xunit.assemblyfixture` fixture will ensure that given test class is shared via all the tests and is initialized only once.

[![Shared](images/Shared.png)](//tpodolak.com/blog/wp-content/uploads/2017/02/xunit-sharing-test-data-across-assembly/Shared.png)

If you want to share multiple classes across the assembly, you can, of course, use `IAssemblyFixture` multiple times.

### 3\. Visual Studio 2017 - XUnit beta tests runners

As for now `VS 2017 RC` requires beta runners of `XUnit` in order to run our unit tests.
`xunit.assemblyfixture` seems not to cooperate with them smoothly.
However, there is a simple workaround to fix that. All we have to do is to add the following attribute to our test project

```csharp
[assembly: TestFramework("Xunit.TestFramework", "xunit.assemblyfixture")]

```

And from now on, `XUnit` correctly can inject assembly fixtures into our test classes

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/XunitSharingFixtureDataAcrossAssembly)
