---
title: "VS Code - forcing partial IntelliSense support for Cake scripts"
published: 2017-04-12T22:39:44.000Z
categories: 
  - "cake"
  - "vscode"
tags: 
  - "cake"
  - "vscode"
---

### 1\. Introduction

I've been using `Cake` for quite some time now, and I really like this tool, however the more complex my build scripts are, the more painful lack of `IntelliSense` is. Inspired a bit by this [post](http://www.strathweb.com/2016/12/writing-c-build-scripts-with-fake-omnisharp-and-vs-code/), I decided to see what it takes to enable at least partial `IntelliSense` for `Cake` scripts in Visual Studio Code.

### 2\. Investigation

The proper way of providing the code completion for `Cake` scripts would probably be a plugin to `Omnisharp-Roslyn`, as `Cake` script is basically a valid c# snippet. Unfortunately, at this moment `Omnisharp-Roslyn` doesn’t have plugin infrastructure [ready](https://github.com/OmniSharp/omnisharp-roslyn/issues/208), that is why I decided to go with a bit different path. As you might or might not be aware, `VS Code` already supports `csx` files, so if you add an empty `project.json` file (by empty I mean file with empty `JSON` object) to your build directory and change extension of your scripts to `csx`, you will immediately get a `C#` syntax highlighting and some `IntelliSense` support. Sadly this will not provide code completion for `Cake` method aliases. The reason why it fails on that is the fact that the `Cake` alias is `ICakeContext` extension method

```csharp
[CakeMethodAlias]
public static T Argument(this ICakeContext context, string name)

```

but you use it as it was written as

```csharp
[CakeMethodAlias]
public static T Argument(string name)

```

The `Cake` engine generates additional alias overloads during script compilation, and as these overloads exist only on runtime, `VS Code` just can't "see" them.

### 3\. My approach

Having in mind the way `Cake` works I decided to write an application which would be able to take any `Cake` or `Cake add-in` and produce a library containing proper alias overloads. For instance, if original `Cake` method looks as follows

```csharp
/// <summary>
/// Contains functionality related to arguments.
/// </summary>
[CakeAliasCategory("Arguments")]
public static class ArgumentAliases
{
    /// <summary>
    /// Determines whether or not the specified argument exist.
    /// </summary>
    /// <param name="context">The context.</param>
    /// <param name="name">The argument name.</param>
    /// <returns>Whether or not the specified argument exist.</returns>
    /// <example>
    /// This sample shows how to call the <see cref="HasArgument"/> method.
    /// <code>
    /// var argumentName = "myArgument";
    /// //Cake.exe .\hasargument.cake -myArgument="is specified"
    /// if (HasArgument(argumentName))
    /// {
    ///     Information("{0} is specified", argumentName);
    /// }
    /// //Cake.exe .\hasargument.cake
    /// else
    /// {
    ///     Warning("{0} not specified", argumentName);
    /// }
    /// 
    /// </example>
    [CakeMethodAlias]
    public static bool HasArgument(this ICakeContext context, string name)
    {
        // rest of the code omitted for brevity
    }
}
```

the application will rewrite it into

```csharp
/// <summary>
/// Contains functionality related to arguments.
/// </summary>
[CakeAliasCategory("Arguments")]
public static class ArgumentAliasesMetadata
{
    /// <summary>
    /// Determines whether or not the specified argument exist.
    /// </summary>
    /// <param name="name">The argument name.</param>
    /// <returns>Whether or not the specified argument exist.</returns>
    /// <example>
    /// This sample shows how to call the <see cref="HasArgument"/> method.
    /// <code>
    /// var argumentName = "myArgument";
    /// //Cake.exe .\hasargument.cake -myArgument="is specified"
    /// if (HasArgument(argumentName))
    /// {
    ///     Information("{0} is specified", argumentName);
    /// }
    /// //Cake.exe .\hasargument.cake
    /// else
    /// {
    ///     Warning("{0} not specified", argumentName);
    /// }
    /// 
    /// </example>
    public static bool HasArgument(string name)
    {
        return default(bool);
    }
}
```

The algorithm looks more or less like that

- Retrieve Cake or Cake add-in via NuGet
- Scan an assembly and find all classes containing alias methods
- Use [CSharpCodeGenerationService](http://source.roslyn.io/#Microsoft.CodeAnalysis.CSharp.Workspaces/CodeGeneration/CSharpCodeGenerationService.cs,20912a440e5cda03) to generate metadata for Cake alias methods
- Parse generated code with `Roslyn` and produce `SyntaxTree`
- Append Metadata suffix to classes containing alias method
- Remove `ICakeContext` parameter from alias method
- Generate dummy body for methods which require that (methods which have return type or which have out parameters)
- Update xml documentation
- Compile generated code and produce dll

There is no point of doing more detailed description in here so if you want to take a closer look here is [source code](https://github.com/tpodolak/Cake.Intellisense).

### 4\. Generating metadata libraries

Before we start "hacking" `VS Code` to have `IntelliSense`, we have to prepare metadata libraries which will contain all necessary `Cake` alias overloads. In order to do that grab the application from [NuGet](https://www.nuget.org/packages/Cake.Intellisense/) and generate `Cake.Common` and `Cake.Core` metadata libraries. The simplest way of doing it is to run these commands

```bat frame="none"
Cake.Intellisense.exe --Package Cake.Common --PackageVersion 0.19.2 --TargetFramework .NETFramework,Version=v4.5 --OutputFolder C:\Output
	
Cake.Intellisense.exe --Package Cake.Core --PackageVersion 0.19.2 --TargetFramework .NETFramework,Version=v4.5 --OutputFolder C:\Output

```

As a result, the application will produce following files:

- `Cake.CommonMetadata.dll`
- `Cake.CommonMetadata.xml`
- `Cake.CoreMetadata.dll`
- `Cake.CoreMetadata.xml`

### 5\. Enabling `IntelliSense` in `VS Code`

Having our metadata libraries prepared now we can adjust our build scripts to have code completion in `VS Code`. Here are the steps:

- Add `project.json` file with empty `JSON` object into your build directory.
- Change extension of all your build scripts to `csx`.
- Copy metadata libraries into your `Build` directory.
- Create `imports.csx` file. This is the file which contains all original namespace imports. It may look as follows
    
    ```csharp
    #load "./metadataImports.csx"
    using Cake.Core;
    using Cake.Core.IO;
    // rest of imports
    
    ```
    
- Create `metadataimports.csx` file. This is the file which contains metadata namespaces imports and loads `Cake` and metadata references.
    
    ```csharp
    #r "./tools/Cake/Cake.Core.dll"
    #r "./tools/Cake/Cake.Common.dll"
    #r "./tools/Cake.Metadata/Cake.Core.Metadata.dll"
    #r "./tools/Cake.Metadata/Cake.Common.Metadata.dll"
    using static Cake.Common.ArgumentAliasesMetadata;
    using static Cake.Common.EnvironmentAliasesMetadata;
    // rest of imports
    
    ```
    
    Each original `Cake` alias class has corresponding metadata class with Metadata suffix, for instance `Cake.Common.ArgumentAliases -> Cake.Common.ArgumentAliasesMetadata` `Cake.Common.EnvironmentAliases -> Cake.Common.EnvironmentAliasesMetadata`
- Load `imports.csx` to your `build.csx` file via
    
    ```csharp
    #load "./imports.csx"
    
    ```
    
- Run `VS Code` install [ms-vscode.csharp 1.7.0](//tpodolak.com/blog/2017/04/09/downgrading-visual-studio-code-extension/), open `Build` directory and write your build script with `IntelliSense` support

[![](images/ButIXBW.gif)]()
- Before running the script remember to comment out
    
    ```csharp
    #load "./metadataImports.csx"
    
    ```
    
    from `imports.csx` file
- Run the build
    
    ```powershell
    build.ps1 -script build.csx -target Your-Target
    
    ```
    

I do realize this is quite convoluted explanation so in case of any troubles take a look at my [build](https://github.com/tpodolak/Cake.Intellisense/tree/master/Build)

### 6\. Known issues

- `Cake.Intellisense` can only generate metadata libraries for a standard .NET frameworks, it will fail if you try to create metadata targeting `.NETStandard` or `.NET Core` framework
- Due to some [breaking changes](https://github.com/OmniSharp/omnisharp-roslyn/issues/811) in `Omnisharp-Roslyn` scripting support, `IntelliSense` will only work with `Omnisharp 1.7.0`

### 7\. Summary

This approach is just a temporary solution. As you can see, it requires significant amount of work to have a code completion in `VS Code`. I believe that once `Omnisharp-Roslyn` has proper plugin support it should be possible to write some kind of custom `IntelliSense` provider for `Cake` scripts. There are already people who forked `Omnisharp-Roslyn` and play around with [that](https://github.com/mholo65/omnisharp-roslyn/tree/wip/new-cake-plugin), so we just have to wait for something better than this solution.
