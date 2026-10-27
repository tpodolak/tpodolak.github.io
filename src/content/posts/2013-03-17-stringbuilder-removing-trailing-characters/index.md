---
title: "StringBuilder - removing trailing characters"
published: 2013-03-17T00:03:00.000Z
categories:
  - "dotnet"
tags: 
  - "dotnet"
  - "csharp"
---

Today just quick tip about `StringBuilder` I used to remove last character(s) from `StringBuilder` using `Remove` method.

```csharp
 StringBuilder builder = new StringBuilder("some long text with comma,");
 builder.Remove(builder.Length - 1, 1);
```

However, recently I've came accross even simpler solution.
You just need to lessen the `Length` property of StringBuilder, in order to get rid of last characters

```csharp
StringBuilder builder = new StringBuilder("some long text with comma,");
builder.Length--;
```
