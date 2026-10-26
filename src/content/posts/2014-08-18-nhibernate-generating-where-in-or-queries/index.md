---
title: "NHibernate - generating WHERE IN … OR … queries"
published: 2014-08-18T10:08:00.000Z
categories: 
  - "net"
  - "c"
  - "disjunction"
  - "nhibernate"
  - "queryover"
  - "restrictions"
tags: 
  - "dotnet"
  - "csharp"
  - "nhibernate"
---

Let's assume that we have a simple table `GL_Task` which looks like this

[![Table](images/Table.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/nhibernate-generating-where-in-or-queries/Table.png)

I was asked to rewrite simple `SQL` query

```sql showLineNumbers=false
SELECT Id,Name,IdProject FROM GL_Task WHERE Name = 'First task' OR Id IN (3,4 /*more id's to come*/)
```

using NHibernate's `QueryOver API`. As simple as it may seem, solution for this particular problem is not straightforward.
My first (not so clever) attempt was simply combining `WhereRestrictionOn` and `Where` clause

```csharp
var result = session.QueryOver<Task>().Where(val=> val.Name == "First task")
                                      .WhereRestrictionOn(val=> val.Id)
                                      .IsIn(new []{3,4})
                                      .List();
```

Of course this query returns wrong data because of the fact, that `NHiberante` by default "joins" queries using `AND` operator.
So above query will result in generating something like that

```sql showLineNumbers=false
SELECT Id,Name,IdProject FROM GL_Task WHERE Name = 'First task' AND Id IN (3,4 /*more id's to come*/)
```

After a little digging I managed to write appropriate query

```csharp
var orRestriction = Restrictions.Or(
                         Restrictions.Where<Task>(val => val.Name == "First task"),
                         Restrictions.On<Task>(val => val.Id).IsIn(new[] { 3,4 }));

var result = session.QueryOver<Task>()
                    .Where(orRestriction)
                    .List();
```

Although this code generates correct `SQL`, it is hard to use it in case of many `OR` statements.
For example, adding one more `OR` force us to write

```csharp
var orRestriction = Restrictions.Or(
      Restrictions.Or(
            Restrictions.Where<Task>(val => val.Name == "First task"),
            Restrictions.On<Task>(val => val.Id).IsIn(new[] {3, 4}) 
       ),
       Restrictions.On<Task>(val => val.Name).IsIn(new[] {"FirstTask", "SecondTask"})
);

var result = session.QueryOver<Task>()
                    .Where(orRestriction)
                    .List();
```

In my opinion this is a little bit hard to read, so I continued my searching to find more elegant solution.
My third attempt was based on `Restrictions.Disjunction`

```csharp
var disjunctinos = Restrictions.Disjunction()
                           .Add(Restrictions.Where<Task>(val => val.Name == "First task"))
                           .Add(Restrictions.On<Task>(val => val.Id).IsIn(new[] { 3,4 }));
                           
var result = session.QueryOver<Task>()                    
                    .Where(disjunctinos)                    
                    .List();
```

This was almost perfect solution. Adding new `OR` statements do not require us to do function nesting

```csharp
var disjunctinos = Restrictions.Disjunction()
                          .Add(Restrictions.Where<Task>(val => val.Name == "First task"))
                          .Add(Restrictions.On<Task>(val => val.Id).IsIn(new[] { 3,4 }))
                          .Add(Restrictions.On<Task>(val => val.Name).IsIn(new[] { "FirstTask", "SecondTask" }));

var result = session.QueryOver<Task>()
                    .Where(disjunctinos)
                    .List();
```

However the ultimate solution is to just add `NHibernate.Criterion` namespace and use `IsIn` extension method.
This operation simplify our query into single lambda expression

```csharp
var result = session.QueryOver<Task>()
                    .Where(val => val.Name == "First task" || val.Id.IsIn(new[] { 3,4 }))
                    .List();
```

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/NHibernateDisjunction)
