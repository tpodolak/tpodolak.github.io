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
  - "net"
  - "c"
  - "disjunction"
  - "nhibernate"
  - "queryover"
  - "restrictions"
---

Let's assume that we have a simple table _GL\_Task_ which looks like this [![Table](images/Table.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/nhibernate-generating-where-in-or-queries/Table.png) I was asked to rewrite simple _SQL_ query

```sql
SELECT Id,Name,IdProject FROM GL_Task WHERE Name = 'First task' OR Id IN (3,4 /*more id's to come*/)

```

using NHibernate's QueryOver API. As simple as it may seem, solution for this particular problem is not straightforward. My first (not so clever) attempt was simply combining _WhereRestrictionOn_ and _Where_ clause

```javascript
var result = session.QueryOver().Where(val=> val.Name == "First task")
                                      .WhereRestrictionOn(val=> val.Id)
                                      .IsIn(new []{3,4})
                                      .List();

```

Of course this query returns wrong data because of the fact, that _NHiberante_ by default "joins" queries using _AND_ operator. So above query will result in generating something like that

```sql
SELECT Id,Name,IdProject FROM GL_Task WHERE Name = 'First task' AND Id IN (3,4 /*more id's to come*/)

```

After a little digging I managed to write appropriate query

```javascript
var orRestriction = Restrictions.Or(
                         Restrictions.Where(val => val.Name == "First task"),
                         Restrictions.On(val => val.Id).IsIn(new[] { 3,4 }));

var result = session.QueryOver()
                    .Where(orRestriction)
                    .List();

```

Although this code generates correct SQL, it is hard to use it in case of many _OR_ statements. For example, adding one more _OR_ force us to write

```javascript
var orRestriction = Restrictions.Or(
      Restrictions.Or(
            Restrictions.Where(val => val.Name == "First task"),
            Restrictions.On(val => val.Id).IsIn(new[] {3, 4}) 
       ),
       Restrictions.On(val => val.Name).IsIn(new[] {"FirstTask", "SecondTask"})
);

var result = session.QueryOver()
                    .Where(orRestriction)
                    .List();

```

In my opinion this is a little bit hard to read, so I continued my searching to find more elegant solution. My third attempt was based on _Restrictions.Disjunction_

```javascript
var disjunctinos = Restrictions.Disjunction()
                           .Add(Restrictions.Where(val => val.Name == "First task"))
                           .Add(Restrictions.On(val => val.Id).IsIn(new[] { 3,4 }));
                           
var result = session.QueryOver()                    
                    .Where(disjunctinos)                    
                    .List();

```

This was almost perfect solution. Adding new _OR_ statements do not require us to do function nesting

```javascript
var disjunctinos = Restrictions.Disjunction()
                          .Add(Restrictions.Where(val => val.Name == "First task"))
                          .Add(Restrictions.On(val => val.Id).IsIn(new[] { 3,4 }))
                          .Add(Restrictions.On(val => val.Name).IsIn(new[] { "FirstTask", "SecondTask" }));

var result = session.QueryOver()
                    .Where(disjunctinos)
                    .List();

```

However the ultimate solution is to just add _NHibernate.Criterion_ namespace and use _IsIn_ extension method. This operation simplify our query into single lambda expression

```javascript
var result = session.QueryOver()
                    .Where(val => val.Name == "First task" || val.Id.IsIn(new[] { 3,4 }))
                    .List();

```

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/NHibernateDisjunction)
