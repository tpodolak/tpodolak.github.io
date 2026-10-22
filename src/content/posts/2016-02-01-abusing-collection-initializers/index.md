---
title: "Abusing collection initializers"
published: 2016-02-01T18:03:10.000Z
slug: "abusing-collection-initializers"
categories: 
  - "net"
  - "net-4-0"
tags: 
  - "net"
  - "net-4-0"
---

Most of .NET developers are familiar with collection initializers syntax. Long story short, this language feature allows you to replace this ugly syntax

```
var numbers = new List();
numbers.Add(1);
numbers.Add(2);
numbers.Add(3);
numbers.Add(4);

```

with much shorter and cleaner one

```
var numbers = new List { 1, 2, 3, 4 };

```

The more interesting thing is the fact that you can leverage this syntax not only for build-in collections but also for your custom classes. In order to do that your class must implement _IEnumerable_ interface and expose public _Add_ method. Let's assume that we have some real case scenario and we have class which looks like that

```
public class StatusMessages : IEnumerable
{
    private List messages = new List();

    public IEnumerator GetEnumerator()
    {
        return this.messages.GetEnumerator();
    }

    IEnumerator IEnumerable.GetEnumerator()
    {
        return this.messages.GetEnumerator();
    }
}

public class StatusMessage
{
    public string Text { get; set; } = string.Empty;
    public string SourceSystem { get; set; } = string.Empty;
    public int StatusCode { get; set; }

    public StatusMessage()
    {
    }

    public StatusMessage(string text)
    {
        this.Text = text;
    }

    public override string ToString()
    {
        return $"Text: {this.Text} StatusCode: {this.StatusCode} SourceSystem: {this.SourceSystem}";
    }
}

```

This is a simple wrapper over the List. At this moment we can't use collection initializer when constructing objects of this classs. However by adding method _Add_

```
public class StatusMessages : IEnumerable
{
    // rest of the code omitted for brevity
    public void Add(StatusMessage message)
    {
        this.messages.Add(message);
    }
    // rest of the code omitted for brevity
}

```

we can create a new instance of that class just like we would do with _List_

```
var messagesAddInitializer = new StatusMessages
            {
                new StatusMessage("y"),
                new StatusMessage("x"),
            };

```

What is more, it is possible to have multiple overloads of _Add_ method in our class, so for instance if we add

```
public class StatusMessages : IEnumerable
{
    // rest of the code omitted for brevity
    public void Add(string text)
    {
         this.Add(new StatusMessage(text));
    }
    // rest of the code omitted for brevity
}

```

we are able to use this syntax

```
var messagesAddStringInitializer = new StatusMessages
            {
                "y",
                "x"
            };

```

In addition it is even possible to use a mix of _Add_ overloads

```
var messagesAddAndTextInitializers = new StatusMessages
            {
                new StatusMessage("y"),
                "x"
            };

```

_Add_ method can also have multiple arguments

```
public class StatusMessages : IEnumerable
{
    // rest of the code omitted for brevity
    public void Add(int statusCode, string text)
    {
        this.Add(new StatusMessage(text) { StatusCode = statusCode });
    }
    
    public void Add(int statusCode, string text, string sourceSystem)
    {
        this.Add(new StatusMessage(text) { StatusCode = statusCode,SourceSystem = sourceSystem });
    }
    // rest of the code omitted for brevity
}

```

in that case we are able to use this syntax

```
var messagesMultipleArgumentsInitializers = new StatusMessages
            {
                { 1, "x" },
                {1,"x","source" }
            };

```

The last thing I would like to point out is that _Add_ function doesn't have to be an instance method, we can easily implement it as an extension method and still leverage the collection initializer syntax.

```
namespace AbusingCollectionInitializers
{
    public static class StatusMessagesExtensions
    {
        public static void Add(this StatusMessages statusMessages, int statusCode)
        {
            statusMessages.Add(new StatusMessage() { StatusCode = statusCode });
        }
    }
}

```

Now with proper namespace import we can write this code

```
using AbusingCollectionInitializers;
// rest of the code omitted for brevity
var messagesExtensionInitializers = new StatusMessages { 1,2,3 };

```

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/AbusingCollectionInitializers)
