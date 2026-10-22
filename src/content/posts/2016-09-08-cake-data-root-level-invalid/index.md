---
title: "Cake - Data at the root level is invalid"
published: 2016-09-08T20:55:01.000Z
slug: "cake-data-root-level-invalid"
categories: 
  - "cake"
tags: 
  - "cake"
---

Couple of weeks [ago](http://tpodolak.com/blog/2016/07/10/debugging-cake-scripts/) I mentioned that in my current project we use _Cake_ as a build mechanism. Recently we wanted to add simple functionality to our build script, which would allow us to modify one of the _App.config_'s properties. According to the documentation it should be a straightforward tasks, as all the heavy lifting can be done via _XmlPeek_ and _XmlPoke_ aliases. Our initial script looked as follows

```
Task("Update-Version")
.Does(()=>
{
    var appConfigPath = paths.Directories.Project + "/" + Context.File("App.config");
    var version = GetVersion(appConfigPath);
    Information("Current version: {0}", version);
    XmlPokeString(File(appConfigPath), xPathVersionSelector, (++version).ToString());
    version = GetVersion(appConfigPath);
    Information("Updated version: {0}", version);
});

private int GetVersion(string appConfigPath)
{
    return int.Parse(XmlPeek(appConfigPath, xPathVersionSelector));
}

```

And what was surprising for us, it didn't work. [![dataattherootlevel](images/DataAtTheRootLevel.png)](http://tpodolak.com/blog/wp-content/uploads/2016/09/cake-data-at-the-root-level-is-invalid/DataAtTheRootLevel.png) We got a bit weird error _"Data at the root level is invalid. Line 1, position 1"_. The exception suggested that there was something wrong with our _App.config_ file. However if you look at the picture presented above, you will see that we were able to successfully read the file and retrieve value of _Version_ with XmlPeek method. After a bit of digging it turned out that _XmlPoke_ and _XmlPokeString_ are not able to work with relative paths and we have to use absolute one in order to make it work. Fortunately there is an easy way to do that, namely _MakeAbsolute_ method. Out script after modifications looks that way

```
Task("Update-Version")
.Does(()=>
{
    var appConfigPath = paths.Directories.Project + "/" + Context.File("App.config");
    var version = GetVersion(appConfigPath);
    Information("Current version: {0}", version);
    XmlPoke(MakeAbsolute(File(appConfigPath)), xPathVersionSelector, (++version).ToString());
    version = GetVersion(appConfigPath);
    Information("Updated version: {0}", version);
});

private int GetVersion(string appConfigPath)
{
    return int.Parse(XmlPeek(appConfigPath, xPathVersionSelector));
}

```

And now everything works fine [![after](images/after.png)](http://tpodolak.com/blog/wp-content/uploads/2016/09/cake-data-at-the-root-level-is-invalid/after.png)

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/CakeDataAtTheRootLevelIsInvalid)
