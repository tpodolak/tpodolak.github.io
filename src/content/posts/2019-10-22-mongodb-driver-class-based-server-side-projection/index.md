---
title: "MongoDB.Driver - class-based server side projection"
published: 2019-10-22T08:00:31.000Z
categories:
  - "databases"
tags: 
  - "mongodb"
  - "nosql"
---

### 1\. Introduction

When working with `NoSQL` databases, your documents might be quite heavy and in some cases, you would like to get only a slice of original data.
For instance, let's assume we have an `Account` document which among other things contains a list of transactions

```csharp
public class Account : IAccountDefinition
{
    public ObjectId Id { get; set; }

    public string Name { get; set; }

    public List<Transaction> Transactions { get; set; }
}

public class Transaction
{
    public ObjectId Id { get; set; }
        
    public decimal Amount { get; set; }
        
    public DateTime CreatedAt { get; set; }
        
    public DateTime ModifiedAt { get; set; }
}
```

As there might be hundreds of transaction in the account object, you might want to occasionally work on a subset of original data, say for instance `AccountSlim` object to improve the performance

```csharp
public class AccountSlim : IAccountDefinition
{
    public ObjectId Id { get; set; }
        
    public string Name { get; set; }
}
```

### 2.Exploring existing options

`MongoDB.Driver` has a couple of ways of defining projections so as you can operate on a slimmer object instead of a default one.
For instance

```csharp
List<AccountSlim> accountSlims = await accountsCollection.Find(defaultAccountFilterDefinition)
                .Project(Builders<Account>.Projection.As<AccountSlim>())
                .ToListAsync();
```
```csharp

IAsyncCursor<AccountSlim> asyncCursor = await accountsCollection.FindAsync(defaultAccountFilterDefinition,
                new FindOptions<Account, AccountSlim>());
```


Unfortunately, those are a client-side projection.
This means that the entire object is returned from the database and we just serialized it to a different class.
You can check it on your own by examining request and result commands sent to `Mongo`

```csharp
var clientSettings = MongoClientSettings.FromUrl(new MongoUrl("mongodb://localhost:27017")); 
clientSettings.ClusterConfigurator += builder => 
{ 
    builder.Subscribe<CommandStartedEvent>(OnCommandStarted); 
    builder.Subscribe<CommandSucceededEvent>(OnCommandSucceeded); 
}; 
var client = new MongoClient(clientSettings); 

private static void OnCommandSucceeded(CommandSucceededEvent @event) 
{ 
    if (@event.CommandName == FindCommandName) 
    { 
        Console.WriteLine("Returned document:"); 
        PrintDocument(@event.Reply); 
    } 
} 
 
private static void OnCommandStarted(CommandStartedEvent @event) 
{ 
    if (@event.CommandName == FindCommandName) 
    { 
        Console.WriteLine("Requested document:"); 
        PrintDocument(@event.Command); 
    } 
} 
```

In both cases requested query doesn't contain `projection` section, so entire document is returned

```json
// query 
{ 
  "find" : "Accounts", 
  "filter" : { 
    "_id" : ObjectId("5dac6ab1ea342a254e1b7748") 
  }, 
  "$db" : "Accounting", 
  "lsid" : { 
    "id" : CSUUID("c6b40361-c47f-4fe6-99bd-6a9ec1702576") 
  } 
} 

// returned document 
{ 
  "cursor" : { 
    "firstBatch" : [{ 
        "_id" : ObjectId("5dac6ab1ea342a254e1b7748"), 
        "AccountName" : "WRKYDWKKJY", 
        "Transactions" : [{ 
            "_id" : ObjectId("5dac6ab1ea342a254e1b7749"), 
            "Amount" : "413648280", 
            "CreatedAt" : ISODate("2019-10-20T14:09:53.635Z"), 
            "ModifiedAt" : ISODate("2019-10-20T14:09:53.635Z") 
          }] 
      }], 
    "id" : NumberLong(0), 
    "ns" : "Accounting.Accounts" 
  }, 
  "ok" : 1.0 
} 
```

Of course, there is a possibility to manually create a server-side projection, for instance

```csharp
var accountSlims = await accountsCollection.Find(defaultAccountFilterDefinition)
                .Project(new ObjectProjectionDefinition<Account, AccountSlim>(new { id = 1, name = 1 }))
                .ToListAsync();
```

or with a strongly typed version

```csharp
var bsonDocument = Builders<Account>.Projection.Exclude(x => x.Transactions)
                .Render(accountsCollection.DocumentSerializer, accountsCollection.Settings.SerializerRegistry);

List<AccountSlim> accountSlim = await accountsCollection.Find(defaultAccountFilterDefinition)
                .Project(new BsonDocumentProjectionDefinition<Account, AccountSlim>(bsonDocument))
                .ToListAsync();
```

However, in my opinion, this is error-prone and it would be better to generate server-side projection automatically based on properties in a slim object.
As I didn't find anything like that in the official driver, here is my approach for handling this

### 3\. Class-based server-side projection

In order to create a custom projection, all we have to do is to extend `ProjectionDefinition<TSource, TResult>` class and provide a `RenderedProjectionDefinition` with all properties which are in both "heavy" and "slim" object

```csharp
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Reflection;
using MongoDB.Bson.Serialization;
using MongoDB.Driver;

namespace MongoDBServerSideProjection.Projections
{
    public class ServerSideProjectionDefinition<TSource, TResult> : ProjectionDefinition<TSource, TResult>
    {
        private readonly ProjectionDefinition<TSource> _projectionDefinition;

        public ServerSideProjectionDefinition()
        {
            _projectionDefinition = BuildProjectionDefinition();
        }

        public override RenderedProjectionDefinition<TResult> Render(IBsonSerializer<TSource> sourceSerializer, IBsonSerializerRegistry serializerRegistry)
        {
            var bsonDocument = _projectionDefinition.Render(sourceSerializer, serializerRegistry);

            return new RenderedProjectionDefinition<TResult>(bsonDocument, serializerRegistry.GetSerializer<TResult>());
        }

        private static ProjectionDefinition<TSource> BuildProjectionDefinition()
        {
            var sourceProperties = ProjectionPropertyCache<TSource>.PropertyNames;
            var resultProperties = ProjectionPropertyCache<TResult>.PropertyNames;

            var projectionDefinitionBuilder = Builders<TSource>.Projection;

            var projectionDefinitions = resultProperties.Intersect(sourceProperties).Select(
                name => projectionDefinitionBuilder.Include(new StringFieldDefinition<TSource>(name)));

            return projectionDefinitionBuilder.Combine(projectionDefinitions);
        }

        private class ProjectionPropertyCache<T>
        {
            static ProjectionPropertyCache()
            {
                PropertyNames = GetProperties();
            }

            public static IReadOnlyCollection<string> PropertyNames { get; }

            private static ReadOnlyCollection<string> GetProperties()
            {
                return typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance)
                    .Where(prop => !prop.IsSpecialName).Select(prop => prop.Name).ToList().AsReadOnly();
            }
        }
    }
}
```

As you can see we use `MongoDB.Driver` build-in projections to render our custom projection consisting of necessary properties.
Note, that as we are using `StringFieldDefinition` instead of defining `Bson` document manually, the projection will take into account potential class mappings or attribute mappings applied to your object

```csharp
BsonClassMap.RegisterClassMap<Account>(cm =>
            {
                cm.AutoMap();
                cm.MapProperty(account => account.Name).SetElementName("AccountName");
            });
```

Having the projection ready we can make it a bit easier to use by introducing some extensions. The first one looks as follows

```csharp
using MongoDB.Driver;
using MongoDBServerSideProjection.Projections;

namespace MongoDBServerSideProjection.Extensions
{
    public static class ProjectionDefinitionBuilderExtensions
    {
        public static ServerSideProjectionDefinition<TSource, TResult> ServerSide<TSource, TResult>(this ProjectionDefinitionBuilder<TSource> builder)
        {
            return new ServerSideProjectionDefinition<TSource, TResult>();
        }
    }
}
```

which allows you to use this projection similarly like others – so by accessing `Builders` class

```csharp
var projection = Builders<Account>.Projection.ServerSide<Account, AccountSlim>();
List<AccountSlim> slims = await accountsCollection.Find(defaultAccountFilterDefinition)
                .Project(projection)
                .ToListAsync();
```

The second method will extend `IFindFluent<TDocument, TProjection>` interface

```csharp
using MongoDB.Driver;

namespace MongoDBServerSideProjection.Extensions
{
    public static class FindFluentExtensions
    {
        public static IFindFluent<TSource, TResult> ProjectTo<TSource, TResult>(this IFindFluent<TSource, TSource> findFluent)
        {
            var serverSideProjectionDefinition = Builders<TSource>.Projection.ServerSide<TSource, TResult>();
            return findFluent.Project(serverSideProjectionDefinition);
        }
    }
}
```

and thanks to it we will end up with an even better syntax

```csharp
List<AccountSlim> list = await accountsCollection.Find(defaultAccountFilterDefinition)
                .ProjectTo<Account, AccountSlim>()
                .ToListAsync();
```

One way or another we will end up with proper projection definition which will result in a smaller document returned from the database

```json
// query
{ 
  "find" : "Accounts", 
  "filter" : { 
    "_id" : ObjectId("5dac846eea29403cb83f99bb") 
  }, 
  "projection" : { 
    "_id" : 1, 
    "AccountName" : 1 
  }, 
  "$db" : "Accounting", 
  "lsid" : { 
    "id" : CSUUID("cf5d5a88-2598-4110-9295-6417d1a5f7dd") 
  } 
} 

// returned document
{ 
  "cursor" : { 
    "firstBatch" : [{ 
        "_id" : ObjectId("5dac846eea29403cb83f99bb"), 
        "AccountName" : "CBBRRWQVKJ" 
      }], 
    "id" : NumberLong(0), 
    "ns" : "Accounting.Accounts" 
  }, 
  "ok" : 1.0 
}
```

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/MongoDBServerSideProjection)
