---
title: "Solution-wide project properties with Directory.Build.props"
published: 2018-04-03T08:00:14.000Z
categories: 
  - "net"
tags: 
  - "net"
  - "msbuild"
---

### 1\. Problem

When you work with a solution which contains multiple projects, you usually have some kind of convention which is applied to all of the projects. For instance, in my case, I always make sure that Stylecop.Analyzers package is installed and properly configured in every project. In this particular case, this boils down to adding these lines into the _csproj_ file

```

  True

  

  

```

Unfortunately, you have to add these lines to every project in a solution in order to make the Stylecop.Analyzers work for given project. This might be fine if you create all of them up front, but in real life scenario sooner or later you will add a new project to the solution. In that case, you might forget about adding those magic lines, so you will end up with inconsistent coding style in your repository. An additional problem with this approach is a code duplication so in case you rename _StyleCop.json_ file you will have to make sure you update it everywhere. A partial solution for that problem is a manual import of custom made .props file, however, this approach is not perfect as well. The import part is not automatic, that is why you still have to remember about adding import directive to all of your projects.

### 2\. Solution

Fortunately starting form _MSBuild_ 15 you can bypass the limitations mentioned above thanks to automatic imports of properties from _Directory.Build.props_ file. All you have to do is to create a beforementioned file in the root folder of your solution and you are good to go. The properties defined in the _Directory.Build.props_ file will be automatically propagated to all of the child projects. In my case, this file looks as follows

```

  
    True
  
  
    
  
  
    
  

```

The sample application which leverages this feature can be found [here](https://github.com/tpodolak/Blog/tree/master/SolutionWideProjectPropertiesWithDirectoryBuildProps)
