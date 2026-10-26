---
title: "Nested properties initialization - syntactic sugar"
published: 2015-04-18T19:11:00.000Z
categories: 
  - "net"
  - "c"
tags: 
  - "dotnet"
  - "csharp"
---

I think most of developers are familiar with the object syntax initializer, which basically allows you to set up values of properties just like that

```csharp
var webClient = new CustomWebClient
            {
                Settings = new CustomWebClientSettings
                {
                    Encoding = "UTF-8",
                    Method = "POST"
                }
            };
```

In this example the `Settings` property is assigned with new instance of `CustomWebClientSettings` class.
However for time to time we only want to change particular property of given nested property and leave rest of the object intact.
Of course we can write it usual way

```csharp
// we assume that CustomWebClient initialized Settings property in constructor
var webClient = new CustomWebClient();
webClient.Settings.Encoding = "UTF-8";
webClient.Settings.Method = "POST";
```

but there is a much cooler syntax for that. The code above can be rewritten to

```csharp
var webClient = new CustomWebClient
            {
                 Settings = {Encoding = "UTF-8", Method = "POST"}
            };
```

Note that there is no `new` keyword in the assignment of `Settings` property, which means that the `Settings` object is updated with the values of properties in braces.
Of course this syntax can be safely used only if the nested property(in this case `Settings`) is initialized up front in constructor, otherwise you will get `NullReferenceException`.

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/NestedPropertiesInitialization)
