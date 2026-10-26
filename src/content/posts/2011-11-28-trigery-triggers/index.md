---
title: "Trigery - Triggers"
published: 2011-11-28T17:20:00.000Z
categories: 
  - "datatrigger"
  - "trigery"
  - "triggers"
  - "wpf"
tags: 
  - "datatrigger"
  - "trigery"
  - "triggers"
  - "wpf"
---

Trigery jest to mechmizm `WPF-a` służący reakcji `UI` na jakieś zdarzenie. Wyróżniamy cztery rodzaje triggerów

- `Property triggers` - używane do zareagowanie na zmiany dependency property w danej kontrolce,
- `Data triggers` - używane do zareagowanie na zmiany w bindowanych obiektach - można podłączyć się do właściwości z `DataContextu` jak i z danej kontrolki,
- `MultiDataTriggers` - używane do reagowania na zmiany kilku właściwości,
- `MultiTrigger` - używane do reagowania na zmiany kilku dependecy property w danej kontrolce,
- `Event triggers` - używane do reagowania na jakieś zdarzenie - służą do odpalania animacji

### 1\. Property triggers

Oto przykład wykorzystania `Property Triggera`. W `ResourceDictionary` tworzymy styl, który zostanie przypisany do przycisku.

```xml
<Style TargetType="{x:Type Button}">
    <Style.Triggers>
        <Trigger Property="IsMouseOver" Value="True">
            <Setter Property="Background" Value="Black"></Setter>
        </Trigger>
    </Style.Triggers>
    <Setter Property="Background" Value="Red"/>
</Style>
```

Widzimy, że dany trigger jest powiązany z właściwością `IsMouseOver`. W przypadku gdy wartość tej właściwości zostanie ustawiona na `true, tło przycisku zostanie zmienione na czarne.
Natomiast gdy `IsMouseOver` powróci do stanu `false`, tło przycisku wróci do wartości sprzed zmiany.

### 2\. Data triggers

Oto przykład wykorzystania `Data Triggera`. W `ResourceDictionary` tworzymy styl, który zostanie przypisany do przycisku.

```xml
<Style x:Key="bindingTest" TargetType="Button">
    <Style.Triggers>
        <DataTrigger Binding="{Binding Path=Text}" Value="Kolor">
            <Setter Property="Background"  Value="Beige"/>
        </DataTrigger>
    </Style.Triggers>
</Style>
```

W tym przypadku nasz trigger reaguje na zmiany właściwości `Text`. Jako, że nie ustawiliśmy źródła bindowania, właściwość `Text` będzie wyszukiwana w `DataContext` danej kontrolki.
W przypadku gdy `DataContext` nie zostanie ustawiony, właściwość ta będzie wyszukiwana w kontrolce będącej wyżej w hierarchii.
W przypadku gdy wartość właściwości `Text` będzie wynosiła `Kolor` tło kontrolki zostanie zmienione na kolor beżowy.

### 3\. MultiData triggers

Oto przykład wykorzystania `MultiDataTriggera`. W `ResourceDictionary` tworzymy styl, który zostanie przypisany do przycisku.

```xml
<Style x:Key="MultiDataTrigger" TargetType="{x:Type Button}">
    <Style.Triggers>
        <MultiDataTrigger>
            <MultiDataTrigger.Conditions>
                <Condition Binding="{Binding Path=Text}" Value="Kolor"/>
                <Condition Binding="{Binding Path=Title}" Value="Spider-Man"/>
            </MultiDataTrigger.Conditions>
            <Setter Property="Background" Value="Black"/>
        </MultiDataTrigger>
    </Style.Triggers>
</Style>
```

Tym razem nasz trigger zareaguje, tylko i wyłącznie gdy wartość właściwości `Text`(znajdującej się w `DataContext`) będzie równe `Kolor`, oraz wartość właściwości `Title` będzie równa `Spider-Man`.
W chwili gdy warunek ten zostanie spełniony, tło kontrolki zmieni się na kolor czarny.

### 4\. MultiTrigger

Zasada działania `MultiTriggera` jest analogiczna z zasadą działania `MultiDataTriggera`.
Różnica między ni mi jest taka, że w `MultiTriggerze` możemy jedynie odnosić się do propertisów danej kontrolki (kontrolki dla której styl tworzymy,oraz kontrolek wchodzących w skład naszej kontrolki).
Przykładowy kod `MultiTriggera` może wyglądać w następujący sposób:

```xml
<Style x:Key="MultiTrigger" TargetType="{x:Type Button}">
    <Style.Triggers>
        <MultiTrigger>
            <MultiTrigger.Conditions>
                <Condition Property="Background" Value="Black"/>
                <Condition Property="IsMouseOver" Value="True"/>
            </MultiTrigger.Conditions>
            <Setter Property="Content" Value="MultiTrigger"/>
        </MultiTrigger>
    </Style.Triggers>
</Style>
```

Tym razem nasz trigger zareaguje, tylko i wyłącznie gdy tło naszej kontrolki będzie czarne, oraz kursor myszy będzie znajdował się nad przyciskiem.
W chwili gdy warunki ten zostaną spełnione, napis na przycisku zmieni się na `MultiTrigger`

### 5\. Event triggers

Event triggery wykraczają poza zakres tej części tutoriala, gdyż są one ściśle związane z animacjami.
