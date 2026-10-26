---
title: "Routed Events - nowy rodzaj zdarzeń w WPF-ie"
published: 2011-11-28T18:20:00.000Z
categories: 
  - "bubbling"
  - "events"
  - "routedevent"
  - "tunelling"
  - "wpf"
tags: 
  - "bubbling"
  - "events"
  - "routedevent"
  - "tunelling"
  - "wpf"
---

`RoutedEvent` jest to nowy typ zdarzeń, który po raz pierwszy został zaprezentowany w `WPF-ie`.
Głównym założeniem `RoutedEventów` jest to, że w momencie wywołania takiego zdarzenia może ono podróżować w górę, lub w dół drzewa wizualnego oraz drzewa logicznego.
Każdy `RoutedEvent` może przyjmować jedną z trzech strategii poruszania się po drzewie:

- `Bubbling` - zdarzenie najpierw jest wywoływane w elemencie źródłowym, a następnie podróżuje ono w górę drzewa wizualnego (od naszego elementu do korzenia drzewa), aż do roota (lub do momenty gdy nie zostanie obsłużone poprzez `e.Handled = true`)
- `Tunelling` - zdarzenie wywoływane jest w korzeniu drzewa, a następnie podróżuje w dół drzewa, aż osiągnie element źródłowy (lub gdy nie zostanie obsłużone poprzez `e.Handled = true`)
- `Direct` - zdarzenie jest wywoływane tylko i wyłącznie w elemencie źródłowym - czyli zdarzenie to zachowuje się tak samo jak standardowe `.NET-owe` zdarzenia

Definiowanie własnych `RoutedEvents` wygląda następująco.
W pierwszym kroku przy pomocy `EventManagera` i jego funkcji `RegisterRoutedEvent` rejestrujemy nasze zdarzenie.

```csharp
public static RoutedEvent PreviewTrippleClickEvent = EventManager.RegisterRoutedEvent("PreviewTrippleClick", RoutingStrategy.Tunnel, typeof(RoutedEventHandler), typeof(MyContentControl));
```

następnie piszemy wrapper `RoutedEventa` na zwykłe zdarzenie

```csharp
public event RoutedEventHandler PreviewTrippleClick
{
    add
    {
        AddHandler(MyContentControl.PreviewTrippleClickEvent, value);
    }
    remove
    {
        RemoveHandler(MyContentControl.PreviewTrippleClickEvent, value);
    }
}
```

Funkcja `RegisterRoutedEvent` przyjmuje cztery parametry:

- **Nazwa naszego zdarzenia** - taka sama jak nazwa standardowego eventa opakowującego `RoutedEvent`
- **Strategia routingu** - czyli czy nasze zdarzenie będzie typu `Bubble`, `Tunnel` lub `Direct`
- **Typ handlera** - czyli typ delegata/funkcji jaki będzie można podłączyć do zdarzenia, żeby je obsłużyć
- **Typ właściciela** - czyli typ klasy do której należy dany event

Jako, że stworzenie nowego `RoutedEventa` jest dość czasochłonne (w porównaniu ze zwykłym zdarzeniem) warto zassać sobie snippet, który znacząco przyśpiesza tworzenie routed eventów.
Snippet taki można znaleźć tutaj [RoutedEventSnippet](http://interactiveasp.net/blogs/natesstuff/archive/2008/10/15/routed-event-code-snippet.aspx).
Mając już zdefiniowany nowy `RoutedEvent` można go wywołać w następujący sposób:

```csharp
RaiseEvent(new RoutedEventArgs(MyContentControl.TrippleClickEvent, this));
```

Funkcja `RaiseEvent` w parametrze przyjmuje obiekt typu `RoutedEventArts`.
W przypadku gdyby nie był on dla nas wystarczający (potrzebujemy przesłać więcej parametrów itp.), musimy napisać klasę rozszerzającą klasę `RoutedEventArts`.

Routowanie zdarzenia może zostać zatrzymane, poprzez ustawienie flagi `e.Handled` na `true`.
Gdzie e jest to obiekt klasy `RoutedEventArgs`.
Przykładowe zatrzymanie routowania eventa może wyglądać w następujący sposób

```csharp
private void Window_MouseRightButtonDown(object sender, MouseButtonEventArgs e)
{
    e.Handled = true;
}
```
:::warning[UWAGA]
Można zadeklarować zdarzenie w taki sposób aby wartość flagi `e.Handled` była pomijana.
Jednak można to zrobić jedynie z poziomu kodu.
Za pomocą metody `AddHandler(RoutedEvent, Delegate, bool)` jeżeli ustawimy ostatni parametr na true, wówczas nasza metoda wykona się nawet w przypadku gdy `e.Hadnled == true`.
Metoda ta dostępna jest dla klasy `UIElement` i wszystkich klas po niej dziedziczących.
:::

**Attached events**

`Attached events` działają podobnie jak `attached dependency properties`.
Pozwalają one rozszerzyć kolekcję zdarzeń danej kontrolki o dodatkowe zdarzenia(nawet jeżeli nie mamy dostępu do źródeł danej kontrolki.
Przykładowo, istnieje możliwość obsługi eventu `click` na kontrolce, która tak naprawdę takiego eventu nie posiada.
Każdy `RoutedEvent` może zostać użyty jako attached event.


```xml
<Window x:Class="MCTSTrainingChapter1.ThirdMainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="ThirdMainWindow" Height="300" Width="300">
    <Grid Button.Click="Grid_Click">
        <Grid.RowDefinitions>
            <RowDefinition></RowDefinition>
            <RowDefinition></RowDefinition>
            <RowDefinition></RowDefinition>
        </Grid.RowDefinitions>
        <Button Grid.Row="0">Top</Button>
        <Button Grid.Row="1">Middle</Button>
        <Button Grid.Row="2">Bottom</Button>
    </Grid>
</Window>
```

Na gridzie mamy zdefiniowane 3 przyciski, chcielibyśmy aby po naciśnięciu każdego z tych przycisków, wywoływała się odpowiednia funkcja.

Jednym ze sposobów napisania takiej funkcjonalności jest podłączenie eventa `Click` z każdego przycisku do jednego handlera.
Rozwiązanie to jest jak najbardziej poprawne, jednakże w przypadku dużej ilości przycisków może być to czasochłonne.
Można zrobić to prościej, przy wykorzystaniu attached events.
Jak widzimy w listingu przedstawionym wyżej, do grida "przypięto" event `Click` z klasy Button.
Od teraz za każdym razem gdy jakikolwiek przycisk będący w obrębie `Grida` zostanie naciśnięty, zdarzenie to zostanie przechwycone przez handler zdefiniowany w gridzie - `Grid_Click`
