---
title: "C# - testing internal classes"
published: 2015-07-26T09:23:00.000Z
categories: 
  - "net"
  - "c"
  - "unittest"
tags: 
  - "dotnet"
  - "csharp"
  - "unittest"
---

I am currently involved in writing library which will be used by couple of external teams.
In that library we have a quite a lot classes which are only used internally and won't be a part of public `API`.
The natural way of keeping that code inaccessible for other assemblies is to use internal access modifier.
However this makes the code also inaccessible directly for testing.
Of course you can still test your internal code through public `API` but usually this is inconvenient and forces you to write a lot of additional code in test.
This is particularly painful for me, because our build process requires 100% test coverage.
Fortunately there is an easy way to make internal classes visible for certain assemblies without making them public.
All you have to do is to use `InternalsVisibleToAttribute` and specify assembly name which is allowed to use code with internal access modifier.
This attribute is most commonly added to `AssemblyInfo.cs` file. For example, assuming that my library is in `TestingInternalClasses.Lib` assembly and my tests are in `TestingInternalClasses.Tests` I should add

```csharp
[assembly: InternalsVisibleTo("TestingInternalClasses.Tests")]

```

to `AssemblyInfo.cs` located in `TestingInternalClasses.Lib` project. However you can also use this attribute in a class definition file - just like that

```csharp
using System;
using System.IO;
using System.Runtime.CompilerServices;
[assembly: InternalsVisibleTo("TestingInternalClasses.Tests")]

namespace TestingInternalClasses.Lib
{
    internal class VanillaSerializer : ISerializer
    {
        public Stream Serialize(object obj)
        {
            if (obj == null)
                throw new ArgumentNullException(nameof(obj));

            // rest of the code
            // ...
            // ...
        }

        public T Deserialize<T>(Stream stream)
        {
            if (stream == null)
                throw new ArgumentNullException(nameof(stream));

            // rest of the code
            // ...
            // ...
        }
    }
}
```

From now on I can easily test internal classes from `TestingInternalClasses.Lib` project in `TestingInternalClasses.Tests`. Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/TestingInternalClasses)
