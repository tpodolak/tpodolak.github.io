---
title: "C# - dynamic type can be useful"
published: 2015-05-16T09:29:00.000Z
categories:
  - "dotnet"
tags: 
  - "dotnet-framework-4-0"
  - "csharp"
  - "dynamic"
---

I am not a big fan of `dynamic` type in C#, however there are certain situations in which it can be handy.
Let's assume that we have following piece of code (which I encounter quite often at my work)

```csharp
public abstract class Weapon
{
    //some properties
}

public class Gun : Weapon
{
     //some properties
}

// more derived types

var weaponService = new WeaponService();
IList<TransferObjects.Weapon> data = weaponService.GetWeapons();
List<Models.Weapon> weapons = data.Select(WeaponConverter.Convert).ToList();
```

As you can see we have to convert `DTO` objects into `normal` objects using some kind of converter.
This is not a problematic when you can use some auto-mappings libraries (`Automapper`,`FastMapper`) however I am not allowed to do that in a company I work for.
So the question is how to write `WeaponConverter.Convert` method in some elegant way. The obvious way (but definitely not elegant) is just to use lots of `if` statements

```csharp
public static Models.Weapon ConvertOld(TransferObjects.Weapon weapon)
{
    if (weapon == null)
        return null;
        
    if (weapon is TransferObjects.Gun)
        return ConvertInternal((TransferObjects.Gun) weapon);
        
    if (weapon is TransferObjects.Sword)
        return ConvertInternal((TransferObjects.Sword) weapon);
        
    throw new ArgumentException("Unknown weapon", nameof(weapon));
}
// ConvertInternal implementation goes here for every derived type

```

But this is really ugly, much better idea (at least from my point of view) is to leverage `dynamic` keyword introduced in `.NET 4`.
Thanks to it our `Convert` method can be reduced to this

```csharp
public static Models.Weapon Convert(TransferObjects.Weapon weapon)
{
    return weapon != null ? ConvertInternal((dynamic)weapon) : null;
}

// ConvertInternal implementation goes here for every derived type
```

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/DynamicCanBeUseful)
