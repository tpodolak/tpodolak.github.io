---
title: "WinJS - AuthenticateAndContinue and \"remote procedure call failed\" exception"
published: 2015-02-19T22:11:00.000Z
categories: 
  - "authenticateandcontinue"
  - "authorization"
  - "javascript"
  - "winjs"
tags: 
  - "authenticateandcontinue"
  - "javascript"
  - "winjs"
---

A while ago I started playing around a bit with _JavaScript_ on _Windows Phone_. I wanted to create very simple app using AngularJS but of course I also had to use some _WinJS_ features (for integration with device ). One of the things I needed to implement was authentication/authorization using _OAuth_. According to _WinJS_ [documentation](https://msdn.microsoft.com/pl-pl/library/dn608114.aspx) it should be pretty straightforward - just use _Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAndContinue_ method with appropriate URLs. Of course I wanted authentication/authorization to be called before navigating to any screen, so I slightly modified default _WinJS_ template and my code looked like that

```
// rest of code omitted for brevity
var activation = Windows.ApplicationModel.Activation,
    app = WinJS.Application,
    nav = WinJS.Navigation,
    sched = WinJS.Utilities.Scheduler,
    ui = WinJS.UI;

 app.addEventListener("activated", function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }

            nav.history = app.sessionState.history || {};
            nav.history.current.initialPlaceholder = true;

            var p = ui.processAll().then(function() {
                Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAndContinue(
                        requestUrl, // for instance facebook auth url
                        callbackUrl // for instance facebook auth callback url
                    );
            });
            args.setPromise(p);
        }
    });
// rest of code omitted for brevity

```

Unfortunately all I got was this strange exception [![remote procedure call failed](images/RemoteProcedureCallsFailed.png)](http://tpodolak.com/blog/wp-content/uploads/2015/02/angularjs-extending-existing-services-using-decorator/RemoteProcedureCallsFailed.png)

The exception itself originated somewhere from _WinJS_ framework so I wasn't able to debug it at all. It took me a while to figure this out but after all it turned out, that all you have to do, to make it work is to "schedule" call of _AuthenticateAndContinue_ method using _WinJS.Utilities.Scheduler_

```
WinJS.Utilities.Scheduler.schedule(function(){ //your code in here});

```

After this change entire code listing looks like that

```
// rest of code omitted for brevity
var activation = Windows.ApplicationModel.Activation,
   app = WinJS.Application,
   nav = WinJS.Navigation,
   sched = WinJS.Utilities.Scheduler,
   ui = WinJS.UI;

app.addEventListener("activated", function (args) {
       if (args.detail.kind === activation.ActivationKind.launch) {
           if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
               // TODO: This application has been newly launched. Initialize
               // your application here.
           } else {
               // TODO: This application has been reactivated from suspension.
               // Restore application state here.
           }
           
           nav.history = app.sessionState.history || {};
           nav.history.current.initialPlaceholder = true;
           
           var p = ui.processAll().then(function() {
               return sched.schedule(function() {
                   Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAndContinue(
                       requestUrl, // for instance facebook auth url,
                       callbackUrl // for instance facebook auth callback url
                   );
               });
           });
           
           args.setPromise(p);
       }
   });
// rest of code omitted for brevity

```

After this procedure we should be successfully redirected to the _requestUrl_, in my case to _Facebook_ login page [![Succesfull](images/Succesfull.png)](http://tpodolak.com/blog/wp-content/uploads/2015/02/angularjs-extending-existing-services-using-decorator/Succesfull.png)
