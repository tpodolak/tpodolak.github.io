---
title: "Intercepting browser requests with Postman"
published: 2016-07-24T22:39:19.000Z
categories:
  - "developer-tools"
tags: 
  - "postman"
---

If you are doing any kind of rest api development you probably have heard of `Postman`.
Long story short, it is a `Chrome` extension which allows you to send http requests in a very easy and intuitive way.
Apart from that (and many other features), it also allows you to intercept browser request.
As this feature is very easy to overlook, here is a simple guide how to use it.

In the `Postman` window, click little satellite look-like button and toggle the `Interceptor` switch

[![Postman switch interceptor](images/SwitchRed.png)](http://tpodolak.com/blog/wp-content/uploads/2016/07/intercepting-browser-requests-postman/SwitchRed.png)

`Postman` will ask you to install additional plugin called `Postman Interceptor`


[![Install](images/Install.png)](http://tpodolak.com/blog/wp-content/uploads/2016/07/intercepting-browser-requests-postman/Install.png)

Once you click `Install` you will be redirected to `Chrome Web Store` where you can add the plugin to the browser.
After successful installation you will see additional icon in `Chrome` menu bar.
Click it and toggle `Request capture` switch

[![CaptureEnabled](images/CaptureEnabled.png)](http://tpodolak.com/blog/wp-content/uploads/2016/07/intercepting-browser-requests-postman/CaptureEnabled.png)

When you go back to `Postman` and toggle again "Interceptor" button, it will be synchronized with `Postman Interceptor` plugin

[![InSync](images/InSync.png)](http://tpodolak.com/blog/wp-content/uploads/2016/07/intercepting-browser-requests-postman/InSync.png)

and from now on, requests sent by browser will be visible in requests history

[![Interception](images/Interception.gif)](http://tpodolak.com/blog/wp-content/uploads/2016/07/intercepting-browser-requests-postman/Interception.gif)

where you will be able to modify and resend them.
