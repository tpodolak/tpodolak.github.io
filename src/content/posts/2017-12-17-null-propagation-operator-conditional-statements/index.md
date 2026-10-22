---
title: "Null-propagation operator and conditional statements"
published: 2017-12-17T15:23:23.000Z
slug: "null-propagation-operator-conditional-statements"
categories: 
  - "c"
tags: 
  - "c"
---

This post is just a quick reminder for me to put a bit more attention to conditional statements combined with a null-propagation operator. Nothing too fancy but I tend to overlook this when doing code review. Starting from C# 6 we can simplify accessing members of an object which might be _null_ thanks to _?._ operator. For my perspective it is particularly useful within _if_ statements, however, you have to be aware of how compiler rewrites the code under the hood otherwise, it is easy to introduce a bug. Consider following scenario

```
public Flight GetFirstPossibleFlight(Availability availability)
{
    if (availability.Flights?.Any() == false)
    {
       return null;
    }
            
    // more magic in here
     return availability.Flights.First();
}

```

At a glance everything seems to be ok, we make sure that _Flight_ collection is not accessed if it is _null_, however simple test shows that this method has a bug.

```

We protected the code from NullReferenceException in if statement, however we failed on the return statement. This happens because our original code is rewritten by compiler as follows
public Flight GetFirstPossibleFlight(Availability availability)
{
    List expr_07 = availability.Flights;
    bool flag = expr_07 != null && !expr_07.Any();
    Flight result;
    if (flag)
    {
        result = null;
    }
    else
    {
        result = availability.Flights.First();
    }
    return result;
}

Now it is clearly visible that we have to satisfy both of the conditions in order to return null. Fortunately, you still can use one-liner and have a bug-free code, the one thing which is needed is an additional null-coalescing operator in the if statement.
public Flight GetFirstPossibleFlight(Availability availability)
{            
    if ((availability.Flights?.Any() ?? false) == false)
    {
        return null;
    }
            
    // more magic in here
    return availability.Flights.First();
}

Now the compiler will rewrite the code in a following way
public Flight GetFirstPossibleFlight(Availability availability)
{
    List expr_07 = availability.Flights;
    bool flag = expr_07 == null || !expr_07.Any();
    Flight result;
    if (flag)
    {
        result = null;
    }
    else
    {
        result = availability.Flights.First();
    }
    return result;
}

Notice that AND operator was replaced with OR operator, resulting in code safe from NullReferenceException.
Source code for this post can be found here
```
