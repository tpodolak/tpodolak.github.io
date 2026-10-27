---
title: "WCF - exposing metadata over TCP"
published: 2015-06-28T15:10:00.000Z
categories:
  - "dotnet"
tags: 
  - "csharp"
  - "wcf"
---

I think that everyone who has ever been working with `WCF` knows that we can enable metadata exchange by adding `ServiceMetadataBehavior` to `App.config` file

```xml
<behaviors>
     <serviceBehaviors>
       <behavior>
         <serviceMetadata httpGetEnabled="true"></serviceMetadata>
       </behavior>
     </serviceBehaviors>
</behaviors>
```

Up until yesterday the build in solution works fine for me. However recently I've had to expose metadata over `TCP` protocol.
`ServiceMetadataBehavior` doesn't have something like `TcpGetEnabled` property so in order to expose metadata over other protocols (in my case `TCP`) it is necessary to add custom `MEX` endpoint.

```xml
<system.serviceModel>
    <services>
          <service name="AudioLib.Services.AudioService">
            <endpoint address="AudioService/MEX" binding="mexTcpBinding" contract="IMetadataExchange">
    <!-- application endpoints -->
            <host>
              <baseAddresses>
                <add baseAddress="net.tcp://localhost:8080"></add>
              </baseAddresses>
            </host>
          </endpoint>
        </service>
    </services> 
    <!-- rest of the config -->
</system.serviceModel>
```

The endpoint configuration has to have a specific binding - in my case `mexTcpBinding` (there are of course `MEX` bindings available for other protocols).
What is more, the contract has to be set to `IMetadataExchange`. The address value is up to us, we can use full blown address as well as leverage base address.
At this point if we run service we will get the exception

[![Exception](images/Exception.png)](http://tpodolak.com/blog/wp-content/uploads/2015/06/wcf-exposing-metadata-over-tcp/Exception.png)

Even though we added custom endpoint for metadata exchange we still have to use `ServiceMetadataBehavior`.
This time however we can skip `httpGetEnabled` property

```xml
<!-- rest of the config -->
<serviceBehaviors>
        <behavior>
          <serviceMetadata httpgetenabled="true"></serviceMetadata>
        </behavior>
</serviceBehaviors>
<!-- rest of the config -->
```

From now on we can access metadata over `TCP`

[![metadata over TCP](images/audioservicetcpmex.png)](http://tpodolak.com/blog/wp-content/uploads/2015/06/wcf-exposing-metadata-over-tcp/audioservicetcpmex.png)

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/WCFExposingServiceMetadataOverTCP)
