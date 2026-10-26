---
title: ".NET Core - calculating code coverage with OpenCover (on Windows)"
published: 2017-10-12T08:00:27.000Z
categories: 
  - "net-core"
tags: 
  - "opencover"
---

### 1\. Introduction.

I've been struggling for some time to make `OpenCover` work with `.NET Core` projects, so I've decided to document a working example.
This is basically an aggregation of hints and answers I found on the `Web` (especially in [here](https://github.com/OpenCover/opencover/issues/601))

### 2\. Working example.

If you run an `OpenCover` with the same arguments you were running it for a classic framework, you will end up with something like this 

[![](images/MissingPdbs.png)](//tpodolak.com/blog/wp-content/uploads/2017/10/net-core-calculating-code-coverage-on-windows/MissingPdbs.png)

As you can see the coverage was not calculated and `OpenCover` is complaining about a missing `PDBs`.
In order to fix that we have to do two things. First of all, we have to build the project with a full `PDBs`

```bash frame="none" showLineNumbers=false
dotnet build "PathToYourSolution.sln" /p:DebugType=Full

```

And then run `OpenCover` with and `-oldStyle` switch

```bat frame="none" showLineNumbers=false

OpenCover.Console.exe -target:"C:/Program Files/dotnet/dotnet.exe" -targetargs:"test \"PathToTestProject.csproj\" --configuration Debug --no-build" -filter:"+[*]* -[*.Tests*]*" -oldStyle -register:user -output:"OpenCover.xml"

```

From now on, `OpenCover` recognizes `PDB` files and the code coverage is calculated correctly

[![](images/OkPdbs.png)](//tpodolak.com/blog/wp-content/uploads/2017/10/net-core-calculating-code-coverage-on-windows/OkPdbs.png)

### 3\. Cake script.

As we use a `Cake` as our build automation tool I've also prepared a sample script for generating a code coverage.
The core part of the script looks as follows

```csharp
// rest of the code omitted for brevity

Task("Build")
    .IsDependentOn("Restore-NuGet-Packages")
    .Does(() =>
{
    DotNetCoreBuild(paths.Files.Solution.ToString(), new DotNetCoreBuildSettings
    {
        Configuration = parameters.Configuration,
        ArgumentCustomization = arg => arg.AppendSwitch("/p:DebugType","=","Full")
    });
});

Task("Run-Tests")
    .IsDependentOn("Build")
    .Does(() =>
{
    var success = true;
    var openCoverSettings = new OpenCoverSettings
    {
        OldStyle = true,
        MergeOutput = true
    }
    .WithFilter("+[*]* -[*.Tests*]*");

    foreach(var project in paths.Files.TestProjects)
    {
        try 
        {
            var projectFile = MakeAbsolute(project).ToString();
            var dotNetTestSettings = new DotNetCoreTestSettings
            {
                Configuration = parameters.Configuration,
                NoBuild = true
            };

            OpenCover(context => context.DotNetCoreTest(projectFile, dotNetTestSettings), paths.Files.TestCoverageOutput, openCoverSettings);
        }
        catch(Exception ex)
        {
            success = false;
            Error("There was an error while running the tests", ex);
        }
    }

    ReportGenerator(paths.Files.TestCoverageOutput, paths.Directories.TestResults);

    if(success == false)
    {
        throw new CakeException("There was an error while running the tests");
    }

});
```

Notice that script is able to merge code coverage results from multiple test projects thanks to `MergeOutput` flag passed to `OpenCover`.

[![](images/Report.png)](//tpodolak.com/blog/wp-content/uploads/2017/10/net-core-calculating-code-coverage-on-windows/Report.png)

Full sources of that script (along with a `dotnet vstest` alternative approach) can be found [here](https://github.com/tpodolak/Blog/tree/master/NETCoreCodeCoverage/Build).
