---
title: "ASP.NET MVC javascript debugging using WebStorm"
published: 2012-09-17T08:26:00.000Z
categories: 
  - "asp-net-mvc"
  - "chrom"
  - "debugger"
  - "debugging"
  - "webstorm"
tags: 
  - "asp-net-mvc"
  - "chrom"
  - "debugger"
  - "debugging"
  - "webstorm"
---

I've been working with `ASP .NET` combined with `Extjs` for about half a year. All this time for debugging I've been using `Firebug` in `Firefox`, or `Developer Tools` in `Chrome`. Although both of these tools are great, I decided to try to use build in `WebStorm` debugger. According to documentation this debugger should work with `Firefox` as well as with `Chrome`. However I've only managed to run it correctly with `Firefox`. In order to start debugging session, we have to make some preparation. Let's choose option `Debug...` from `Run` menu


[![rundebug](images/rundebug.png)](http://tpodolak.com/blog/wp-content/uploads/2012/09/asp-net-mvc-javascript-debugging-using-webstorm/rundebug.png)

In opened small window, we have to choose first option - `Edit configurations...`

[![editconfigurationsmall](images/editconfigurationsmall.png)](http://tpodolak.com/blog/wp-content/uploads/2012/09/asp-net-mvc-javascript-debugging-using-webstorm/editconfigurationsmall.png)

In the next window we can create new debugging profile. In order to do that, click on `+` sign in the left upper corner of window, then choose `JavascriptDebug` and `Remote` option

[![runremotedebug](images/runremotedebug.png)](http://tpodolak.com/blog/wp-content/uploads/2012/09/asp-net-mvc-javascript-debugging-using-webstorm/runremotedebug.png)

This is the final step of the configuration. The most important fields in configuration window is `URL to open` field, in which we specify adress of our site. In my case it is localhost on port `8142`. We also have to specify mapping from remote host direcotry structure to our directory structure. Sample configuration is presented below

[![sampleconfig](images/sampleconfig.png)](http://tpodolak.com/blog/wp-content/uploads/2012/09/asp-net-mvc-javascript-debugging-using-webstorm/sampleconfig.png)

We also have a possibility to choose browser in which our site will be displayed. I decided to choose `Firefox` because of the fact, that `WebStorm` debugger had some problems with `Chrome`. Now we can try to run debugging session by pressing `ALT+F9`. If we choose `Firefox`, in the very first time we run debugger, we will see this window

[![installExtension](images/installExtension.png)](http://tpodolak.com/blog/wp-content/uploads/2012/09/asp-net-mvc-javascript-debugging-using-webstorm/installExtension.png)

which informs us that `WebStorm` must install extension to `Firefox`. Clicking `OK` button starts `Firefox`

[![AddOnInstalation](images/AddOnInstalation.jpg)](http://tpodolak.com/blog/wp-content/uploads/2012/09/asp-net-mvc-javascript-debugging-using-webstorm/AddOnInstalation.jpg)

which warns us that external program is trying to install extension. Clicking `continue` button will finish configuration process, and `WebStorm` will successfully attach debugger.


[![debugging](images/debuggerattached.png)](http://tpodolak.com/blog/wp-content/uploads/2012/09/asp-net-mvc-javascript-debugging-using-webstorm/debuggerattached.png)
