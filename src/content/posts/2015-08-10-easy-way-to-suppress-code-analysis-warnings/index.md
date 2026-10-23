---
title: "Easy way to suppress code analysis warnings"
published: 2015-08-10T19:12:00.000Z
categories: 
  - "net"
  - "c"
  - "code-analysis"
tags: 
  - "net"
  - "c"
  - "code-analysis"
---

Everyone who has ever been using a code analysis knows that sometimes it is hard to follow the _Microsoft_ coding guidelines and it is necessary to suppress some warnings. For me it always was a painful operation because I didn't know any automated way of doing that. So basically I had to find the warning in the _MSDN_, copy category, code and other necessary stuff and then manually add appropriate attribute in code. Fortunately a friend of mine yesterday showed me a simple trick to generate this attribute with couple of mouse clicks. All you have to do is to right-click on warning message and choose _Suppress Message_ context menu ... [![code analysis](images/ContextMenu.png)](http://tpodolak.com/blog/wp-content/uploads/2015/08/easy-way-to-suppress-code-analysis-warnings/ContextMenu.png)

There are two options in there. The first option - _In Source_, will add attribute directly in the code

[![code analysis](images/SuppressInSource.gif)](http://tpodolak.com/blog/wp-content/uploads/2015/08/easy-way-to-suppress-code-analysis-warnings/SuppressInSource.gif) and the second one - _In Suppression_ File, will create _GlobalSuppressoins.cs_ file with assembly attribute which suppresses given warning in entire assembly

[![code analysis](images/SuppresionGlobal.gif)](http://tpodolak.com/blog/wp-content/uploads/2015/08/easy-way-to-suppress-code-analysis-warnings/SuppresionGlobal.gif)
