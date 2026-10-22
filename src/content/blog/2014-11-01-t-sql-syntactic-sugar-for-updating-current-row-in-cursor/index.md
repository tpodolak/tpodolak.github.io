---
title: "T-SQL - syntactic sugar for updating current row in cursor"
pubDate: 2014-11-01
slug: "t-sql-syntactic-sugar-for-updating-current-row-in-cursor"
categories: 
  - "sql"
  - "t-sql"
tags: 
  - "sql"
  - "t-sql"
---

I am not a big fan of cursors, however for time to time I have to write one. In my case cursor usually is responsible for some complicated updates. Until yesterday I've been writing my update statements within the cursor the standard way

```
-- cursor code omitted for brevity
-- some complicated update
UPDATE Person.Person set FirstName = 'some logic goes here' where Person.BusinessEntityID = @Id
where @Id variable is set by cursor. 
-- cursor code omitted for brevity

```

There is nothing wrong with that, however we can do the same thing using specialized syntax - _current of_ keyword(s)

```
UPDATE Person.Person set FirstName = 'some logic goes here' where current of personCursor

```

The entire cursor statement then looks that way

```
DECLARE personCursor CURSOR FOR SELECT top 1000 * FROM Person.Person
OPEN personCursor
FETCH NEXT FROM personCursor
WHILE @@FETCH_STATUS = 0
BEGIN
   -- some complicated update goes here
   UPDATE Person.Person set FirstName = 'some logic goes here' where current of personCursor
   FETCH NEXT FROM personCursor
END
CLOSE personCursor
DEALLOCATE personCursor

```
