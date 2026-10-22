---
title: "NHhibernate - multiple queries in one roundtrip to server"
published: 2014-04-27T22:14:00.000Z
slug: "nhhibernate-multiple-queries-in-one-roundtrip-to-server"
categories: 
  - "c"
  - "nhibernate"
tags: 
  - "c"
  - "nhibernate"
---

Usually when we need to retrieve data from database server, we write code which looks like that

```
using (var session = DataAccesLayer.Instance.OpenSession())
{
    using (var transaction = session.BeginTransaction())
    {
        var projects = session.QueryOver().Where(val => val.Name == "Project").List();
        var tasks = session.QueryOver().Where(val => val.Name == "First task").List();
        //more queries           
        //more queries             
        //exception handling etc.
    }
}

```

This code will execute two queries,each of them in separate roundtrip to the server. [![SeveralRoundtrips](images/SeveralRoundtrips.png)](http://tpodolak.com/blog/wp-content/uploads/2014/04/nhhibernate-multiple-queries-in-one-roundtrip-to-server/SeveralRoundtrips.png) This is the most popular way of getting data for multiple tables etc. However it is possible to enhance the code above and execute several queries in only one roundtrip to the database server. NHibernate provides us with three different mechanisms to accomplish this goal:

- **MultiQuery**
First way to execute several queries at once is MultiQuery. In my opinion this is not very handy mechanism because of the fact, that we must use HQL. Here is an example of usage

```
var projectQuery = session.CreateQuery("FROM Project as prj where prj.Name= :projectName")
                          .SetParameter("projectName", "Project");

var taskQuery = session.CreateQuery( "FROM Task as tsk where tsk.Name=:taskName" )
                       .SetParameter("taskName","First task");
 
var multiQueryByIndex = session.CreateMultiQuery( )
                               .Add( projectQuery )
                               .Add( taskQuery );

```

As You can see thanks to _CreateMultiQuery_ method we are able to aggregate multiple queries. In order to get access to results, we have to execute code below

```
var result = multiQueryByIndex.List();

```

Now we can get result of specific query using indexer

```
var projects = result[0] as List;
var tasks = result[1] as List;

```

If we don't like this approach, the _CreateMultiQuery_ method has an overload which allows to give "names" to queries. Thanks to this we can get result of query by its name.

```
var multiQueryByKey = session.CreateMultiQuery( )
                             .Add( "project", projectQuery )
                             .Add( "task", taskQuery );
 
var projects = multiQueryByKey.GetResult( "project" ) as List;
var tasks = multiQueryByKey.GetResult( "task" ) as List;

```

- **MultiCriteria**
Much better way of creating multiple queries is MultiCriteria. In this case we can use _QueryOver_ API, so we don't have to rely on _HQL_ query strings.

```
var projectQuery = session.QueryOver().Where(val => val.Name == "Project");
var taskQuery = session.QueryOver( ).Where(val => val.Name == "First task");
var multiCriteriaByIndex = session.CreateMultiCriteria( )
                                  .Add( projectQuery )
                                  .Add( taskQuery );

var multiCriteriaByKey = session.CreateMultiCriteria( )
                                .Add( "project", projectQuery )
                                .Add( "task", taskQuery );

IList result = multiCriteriaByIndex.List( );
var projects = result[0] as List;
var tasks = result[1] as List;

projects = multiCriteriaByKey.GetResult( "project" ) as List;
tasks = multiCriteriaByKey.GetResult( "task" ) as List;

```

As You can see the usage of _CreateMultiCriteria_ method is pretty consistent with _CreateMultiQuery_. Unfortunately we still have to retrieve data from specific query by index or by query name.- **Future**
My personal favorite for creating multi queries is _Future_. The usage is pretty straightforward

```
var projects = session.QueryOver().Where(val => val.Name == "Project").Future();
var tasks = session.QueryOver().Where(val => val.Name == "First task").Future();

```

As You can see, we can leverage _QueryOver_ API and instead of calling List we call Future. NHibernate will aggregate our queries and will execute them once we start to iterate over one of them. [![delayedenumerator](images/delayedenumerator.png)](http://tpodolak.com/blog/wp-content/uploads/2014/04/nhhibernate-multiple-queries-in-one-roundtrip-to-server/delayedenumerator.png) 

Despite the fact that all three mechanism has completely different syntax ,SQL created by all of them is the same and looks like that [![multiple queries](images/intheend.png)](http://tpodolak.com/blog/wp-content/uploads/2014/04/nhhibernate-multiple-queries-in-one-roundtrip-to-server/intheend.png)
