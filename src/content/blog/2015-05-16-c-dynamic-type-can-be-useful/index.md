---
title: "C# - dynamic type can be useful"
pubDate: 2015-05-16
slug: "c-dynamic-type-can-be-useful"
categories: 
  - "c"
  - "dynamic"
tags: 
  - "net-4-0"
  - "c"
  - "dynamic"
---

I am not a big fan of _dynamic_ type in C#, however there are certain situations in which it can be handy. Let's assume that we have following piece of code (which I encounter quite often at my work)

```
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
IList data = weaponService.GetWeapons();
List weapons = data.Select(WeaponConverter.Convert).ToList();

```

As you can see we have to convert _DTO_ objects into "_normal_" objects using some kind of converter. This is not a problematic when you can use some auto-mappings libraries (_Automapper_,_FastMapper_) however I am not allowed to do that in a company I work for. So the question is how to write _WeaponConverter.Convert_ method in some elegant way. The obvious way (but definitely not elegant) is just to use lots of "_if_" statements

```
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

But this is really ugly, much better idea (at least from my point of view) is to leverage _dynamic_ keyword introduced in _.NET 4_. Thanks to it our _Convert_ method can be reduced to this

```
public static Models.Weapon Convert(TransferObjects.Weapon weapon)
{
    return weapon != null ? ConvertInternal((dynamic)weapon) : null;
}

// ConvertInternal implementation goes here for every derived type

```

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/DynamicCanBeUseful)
