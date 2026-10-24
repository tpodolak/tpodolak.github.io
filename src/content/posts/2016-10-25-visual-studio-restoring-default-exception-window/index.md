---
title: "Visual Studio - restoring default exception window"
published: 2016-10-25T19:22:33.000Z
categories: 
  - "visual-studio"
tags: 
  - "visual-studio"
---

I think everyone is familiar with this nice exception window we see once exception is thrown.

[![exceptionwindow](images/DefaultException.png)](http://tpodolak.com/blog/wp-content/uploads/2016/10/visual-studio-restoring-default-exception-window/DefaultException.png)

However today for some reasons my `VisualStudio` started showing some weird dialog.



[![exceptionwindow](images/ExceptionWindow.png)](http://tpodolak.com/blog/wp-content/uploads/2016/10/visual-studio-restoring-default-exception-window/ExceptionWindow.png)

This was pretty frustrating as I wasn’t able to see which line has thrown exception and basically after clicking `Break` or `Continue` application was terminated. After a while I found out that the default window is called `Exception assistant` and you can enable it in `Visual Studio's` options. So in order to restore default behavior, just go to `Tools -> Options -> Debugging -> General` and select `Enable the exception assistant` checkbox.

[![enableexceptionassistant](images/EnableExceptionAssistant.png)](http://tpodolak.com/blog/wp-content/uploads/2016/10/visual-studio-restoring-default-exception-window/EnableExceptionAssistant.png)
