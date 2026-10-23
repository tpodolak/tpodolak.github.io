---
title: "Fixing empty SQL server list in \"Entity Data Model Wizard\""
published: 2014-11-10T15:23:00.000Z
categories: 
  - "ef"
  - "entity-framework"
  - "mssql"
  - "sql"
  - "visual-studio"
tags: 
  - "ef"
  - "entity-framework"
  - "mssql"
  - "sql"
  - "visual-studio"
---

I consider myself as a quite experienced user of Nhibernate, that is why I decided to check what is going on on the other side of barricade and started playing with Entity Framework. I followed the steps of some tutorial and I stuck at the very beginning of it. I was about to generate model classes using "Entity Data Model Wizard" but it turned out that the wizard could not find my SQL server (despite the fact that server itself was up and running). [![empty SQL server list](images/EmptyServerList.png)](http://tpodolak.com/blog/wp-content/uploads/2014/11/fixing-empty-sql-server-list-in-entity-data-model-wizard/EmptyServerList.png) I remember having similar issue a while back, but at that time I wasn't able to solve it (I ended up creating connections string manually). This time I wanted to give this issue a closer look. After a bit of digging I found the problem - the SQL server wasn't broadcasting information about itself. In order to fix it and make the server visible to other computers and applications it is necessary to start _SQL Server Browser_ service. To do that go to _Start -> Run_ and type _Services.msc_ [![runservices](images/runservices.png)](http://tpodolak.com/blog/wp-content/uploads/2014/11/fixing-empty-sql-server-list-in-entity-data-model-wizard/runservices.png) Then in newly opened window find _SQL Server Browser_ service [![SqlServerBrowser](images/SqlServerBrowser.png)](http://tpodolak.com/blog/wp-content/uploads/2014/11/fixing-empty-sql-server-list-in-entity-data-model-wizard/SqlServerBrowser.png) Double click it and set up startup type to _Automatic_. You can also click _Start_ button to make sure that service starts immediately [![automaticserverbrowser](images/automaticserverbrowser.png)](http://tpodolak.com/blog/wp-content/uploads/2014/11/fixing-empty-sql-server-list-in-entity-data-model-wizard/automaticserverbrowser.png) From now on SQL servers should be visible in "Entity Data Model Wizard" [![filledserverlist](images/filledserverlist.png)](http://tpodolak.com/blog/wp-content/uploads/2014/11/fixing-empty-sql-server-list-in-entity-data-model-wizard/filledserverlist.png)
