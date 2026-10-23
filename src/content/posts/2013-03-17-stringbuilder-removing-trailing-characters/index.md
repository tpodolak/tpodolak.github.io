---
title: "StringBuilder - removing trailing characters"
published: 2013-03-17T00:03:00.000Z
categories: 
  - "net"
  - "c"
tags: 
  - "net"
  - "c"
  - "stringbuilder"
---

Today just quick tip about _StringBuilder_ I used to remove last character(s) from _StringBuilder_ using _Remove_ method.

```
 StringBuilder builder = new StringBuilder("some long text with comma,");
 builder.Remove(builder.Length - 1, 1);

```

However, recently I've came accross even simpler solution. You just need to lessen the _Length_ property of StringBuilder, in order to get rid of last characters

```
StringBuilder builder = new StringBuilder("some long text with comma,");
builder.Length--;

```
