---
title: "Interactivity oraz Interaction"
published: 2011-11-29T21:01:00.000Z
categories:
  - "dotnet"
tags: 
  - "behavior"
  - "interaction"
  - "interactivity"
  - "prism"
  - "silverlight"
  - "wpf"
---

`Interactions` oraz `Interactivity` są to dwie dll-ki, które poszerzają sposób komunikacji pomiędzy widokiem oraz `ViewModelem`.
Wprowadzają one nowy typ `EventTriggerów`(w `Silverlighcie` nie ma triggerów, natomiast w `WPF-ie` event triggery można praktycznie używać jedynie do animacji) oraz dodatkowo wprowadzają ciekawe sposoby(funkcje) na interakcję widoku z `ViewModelem`.

Pierwszym z tych sposobów jest użycie właściwości `InvokeCommandAction`.
Jak sama nazwa wskazuje można wywołać komendę z `ViewModelu`.
Jaka jest różnica między wywołaniem komendy poprzez `InvokeCommandAction`, a `Command="{Binding CommandName}"`?
`InvokeCommandAction` ma tą przewagę nad normalnm bindowaniem do property `Command`, że pozwala wywołać daną komendę w odpowiedzi na zajście jakiegoś zdarzenia na widoku.
Przykładowe użycie może wyglądać następująco:
```xml
<Button Content="Submit" IsEnabled="{Binding CanSubmit}">
      <i:Interaction.Triggers>
        <i:EventTrigger EventName="MouseMove">
           <i:InvokeCommandAction Command="{Binding SubmitCommand}"/>
        </i:EventTrigger>
      </i:Interaction.Triggers>
</Button>
```

Powyższy przykład działa w następujący sposób.
Za każdym razem gdy zostanie wywołane zdarzenie `MouseMove` na przycisku, odpalona zostanie komenda `SubmitCommand`.
Wadą używania `InvokeCommandAction` jest to, że sami musimy się martwić o wygaszenie kontrolki w przypadku gdy dana komenda nie może być wykonana.
Dlatego też w pierwszej linii mamy bindowanie właściwości `IsEnabled` przycisku do właściwości CanSubmit z `ViewModelu`.
Alias `i:` jest aliasen na namespace interactivity z dll-ki

```csharp
System.Windows.Interactivity.xmlns:i="clr-namespace:System.Windows.Interactivity;assembly=System.Windows.Interactivity".
```

Drugim sposobem powiadomiania `ViewModelu` o jakimś zdarzeniu w widoku jest użycie `InvokeMethodAction`.
Dzięki tej właściwości możemy bezpośrednio z widoku (z `XAML-a`) wywołać funkcję w `ViewModelu`.
Składnia przedstawia się w następujący sposób:
```xml
<Button Content="Submit" IsEnabled="{Binding CanSubmit}">
     <i:Interaction.Triggers>
       <i:EventTrigger EventName="Click">
        <i:CallMethodAction TargetObject="{Binding}" Method="Submit"/>
      </i:EventTrigger>
     </i:Interaction.Triggers>
</Button>
```

`TargetObject` jest zbindowany do `DataContextu`, to właśnie tam będzie szukana funkcja `Submit`.
Należy pamiętać, że właściwość `CallMethodAction` nie wspiera parametrów funkcji.
Zatem jeżeli musimy wywołać jakąś funkcję z parametrami, należy opakować ją w funkcję bezparametrową, natomiast wszystkie parametry przekazać z właściwości `ViewModelu`.

Kolejnym ciekawym featurem `Interactivity` jest klasa `Behavior`.
Jest niezastąpiona jeżeli potrzebujemy ingerować w działanie widoku po jakimś zdarzeniu.
Nie musimy wówczas tworzyć obsługi eventów w code behind.
Możemy wyłuskać daną funkcjonalność i zamknąć ją w klasie `Behavior` a następnie doczepić do wszystkich widoków danego typu.
Załóżmy, że sterujemy `ListBoxem` z poziomu `ViewModelu` (przełączamy `SelectedItem`).
Możemy zaznaczyć jakiś Item, co jednak jeżeli nasza lista jest bardzo długa,a zaznaczamy ostatni element.
Na widoku element rzeczywiście się zaznaczył jednak lista się nie przewinęła.
Przez co cały czas wiszą elementy z początku i nie widać czy któryś element jest zaznaczony.
Dopiero gdy przeskrolujemy ręcznie `ListBoxa` widzimy, że rzeczywiście prawidłowo zareagował na zmianę property w `ViewModelu`.
Jest to idealna sytuacja, aby stworzyć własny `Behavior`, który będziemy mogli podczepić do wszystkich listboxów w każdym widoku.

```csharp
public class Behavior<ListBox>
{
  protected override void OnAttached()
  {
    AssociatedObject.SelectionChanged += ListBoxSelectionChanged;
  }

  protected override void OnDetaching()
  {
     AssociatedObject.SelectionChanged -= ListBoxSelectionChanged;
  }

  private void ListBoxSelectionChanged(object sender, SelectionChangedEventArgs e)
  {
    if (sender is ListBox && ((ListBox)sender).SelectedItem != null)
    {
        var listBox = sender as ListBox;
        listBox.ScrollIntoView(listBox.SelectedItem);
    }
  }
}
```

Metoda `OnAttached` odpala się w momencie, gdy behavior jest podpinany do kontrolki.
W metodzie tej powinniśmy podpiąć się pod wszystkie eventy, które są dla nas istotne.
W momencie, gdy widok jest niszczony wywołuje się metoda `OnDetaching`, w której powinniśmy odpiąć wszystkie metody od eventów.
