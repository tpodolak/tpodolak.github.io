---
title: "Generating string consisting of the same character"
published: 2013-11-03T14:45:00.000Z
categories: 
  - "csharp"
tags: []
---

Recently I've been asked by friend of mine, how to generate string consisting of 50 commas.
I came up with these three code snippets:

```csharp
var repeat = string.Join(string.Empty, Enumerable.Repeat(",", 50));
var aggregate = Enumerable.Range(1, 50).Aggregate(new StringBuilder(), 
                                                 (acc, seed) => acc.Append(",")).ToString();
var usingArray = string.Join(",", new string[51]);//must be 51, separator is not inserted after last index
```

Although all of these lines produce appropriate outcome, it's seemed to me that there is some simpler way to accomplish this task.
After a little bit of searching, it turned out, that it is possible to generate string consisting of same characters using one of string's constructors

```csharp
var usingConstructor = new string(',', 50);
```
