---
title: "Kolekcje wspierające sortowanie, grupowanie oraz filtrowanie"
published: 2011-11-28T20:13:00.000Z
categories: 
  - "listcollectionview"
  - "pagedcollectionview"
  - "wpf"
tags: 
  - "listcollectionview"
  - "pagedcollectionview"
  - "wpf"
---

### 1\. ListViewCollection (WPF)

ListViewCollection jest to kolekcja wprowadzona do WPF-a, która wspiera sortowanie, grupowanie oraz filtrowanie. Kolekcję taką tworzymy w następujący sposób

```
List palyerList = new Player { new Player(),new Player()};
public ListViewCollection PlayerListCollectionView {get;set;}
ListViewCollection PlayerListCollectionView= new ListViewCollection(playerList);

```

czyli po prostu w konstruktorze przesyłamy obiekt implementujący interfejs IEnumerable **Filtrowanie** W celu przefiltrowania kolekcji wystarczy podać odpowiedni obiekt typu Predicate(czyli tak naprawdę wystarczy napisać funkcję zwracającą bool oraz przyjmującą w parametrze obiekt). Załóżmy, że chcemy pokazać na widoku jedynie tych graczy, który nazywają się "Tomek". W tym celu wystarczy, że zrobimy coś takiego:

```
PlayerListCollectionView.Filter = val => { return (val as Player).Name.ToLower() == “tomek”;  }

```

po zaaplikowaniu predicata widok zbindowany do danej listy automatycznie się odświeży. W razie czego można zawsze wymusić oświeżenie przez wywołanie funkcji

```
PlayerListCollectionView.Refresh();

```

**Grupowanie** Kolekcja ListViewCollection wspiera również grupowanie. W celu pogrupowania listy po jakimś elemencie wystarczy do naszej listy dorzucić tzw. group description. Odbywa się to w taki sposób:

```
PlayerListCollectionView.GroupDescriptions.Add(new PropertyGroupDescription { PropertyName = "Name" }

```

Po dodaniu PropertyGroupDescription widok automatycznie pogrupuje nam elementy po danych właściwościach. **Sortowanie** Nasza kolekcja wspiera również sortowanie. W celu posortowania wystarczy stworzyć obiekt implementujący interfjes IComparer, a następnie przypisać go do właściwości CustomSort

```
public class PlayerComparer : IComparer
{
    public int Compare(object x, object y)
    {
        if (((Player)x).Age > (((Player)y).Age))
        {
            return 1;
        }
        return -1;
    }
}

PlayerListCollectionView.CustomSort = new PlayerComparer ()

```

po takiej akcji widok automatycznie się odświeży i pokaże posortowane dane.

### 2\. PagedCollectionView (Silverlight)

PagedCollectionView jest to uboższa wersja ListCollectionView z WPF-a. Grupowanie oraz filtrowanie dobywa się w ten sam sposób, jednakże sortowanie zostało w znaczny sposób utrudnione. Sortować możemy jedynie po właściwościach, nie możemy stworzyć własnego comparera, który zostałby użyty do wykonania operacji sortowania. Wykonanie operacji może wyglądać w następujący sposób:

```
PlayerPagedCollection.SortDescriptions.Clear();
PlayerPagedCollection.SortDescriptions.Add(new System.ComponentModel.SortDescription("Name", ListSortDirection.Ascending));

```

W tym wypadku nasza kolekcja zostanie posortowana po właściwości "Name"
