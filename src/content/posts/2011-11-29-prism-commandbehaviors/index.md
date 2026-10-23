---
title: "Prism - CommandBehaviors"
published: 2011-11-29T20:20:00.000Z
categories: 
  - "commandbehaviors"
  - "prism"
  - "silverlight"
  - "wpf"
tags: 
  - "commandbehaviors"
  - "prism"
  - "silverlight"
  - "wpf"
---

Analizując wcześniejsze przykłady pokazujące użycie DelegateCommand można odnieść wrażenie, że mimo tego iż są one bardzo użyteczne,ich użycie jest niestety bardzo ograniczone. Jedynie niektóre komponenty WPF-a i Silverlight-a mają właściwość Command do której można zbindować nasz obiekt DelegateCommand.Ponadto właściwość ta reaguje jedynie na wybrane zahardcodowane w kontrolce zdarzenie (zdarzenie Click). Co w przypadku gdybyśmy chcieli zareagować np. na zdarzenie MouseMove za pomocą komendy? Nasz problem możemy rozwiązać poprzez:

- Interactivity
- Interactions
- CommandBehaviors

W tym poście zostanie przedstawione rozwiązanie trzecie - CommandBehaviors

Pierwszą rzeczą jaką należy zrobić w celu stworzenia komendy reagującej na inne zdarzenie niż Click jest stworzenie klasy dziedziczącej po CommandBehaviorBase. Załóżmy, że zrobimy komendę reagującą na zdarzenie MouseMove

```
public class MouseMoveCommandBehavior : CommandBehaviorBase
{
    private MouseOutCommandBehavior(Control control) : base(control)
    {
        control.MouseMove += (sender, args) => 
        {
            this.ExecuteCommand();
        };
    }
}

```

Piersza część już za nami, ale pojawia się teraz pytanie jak z tego skorzystać. Żeby mieć możliwość użycia powyżej klasy wykorzytamy attached dependency property. Musimy sobie stworzyć pomocniczą statyczną klasę, w której to zarejestrujemy nasze właściwości. Zacznijmy od zarejestrowania dependency property o nazwie Command \- do tego obiektu będziemy bindowali komendy z ViewModelu (komendy reagujące na zdarzenie MouseMove)

```
public static class MouseMove 
{
    public static ICommand GetCommand(DependencyObject obj)
    {
        return (ICommand)obj.GetValue(CommandProperty);
    }

    public static void SetCommand(DependencyObject obj, ICommand value)
    {
        obj.SetValue(CommandProperty, value);
    }

    public static readonly DependencyProperty CommandProperty =
            DependencyProperty.RegisterAttached("Command", typeof(ICommand), typeof(MouseMove), new PropertyMetadata(OnSetCustomCommandCallback));
}

```

zauważmy, że podłączyliśmy event handlera reagującego na zmianę naszej nowo stworzonej właściwości Command. Funkcja OnSetCustomCommandCallback wygląda następująco:

```
private static void OnSetCustomCommandCallback(DependencyObject dep, DependencyPropertyChangedEventArgs e)
{
    var control = dep as Control;
    if (control != null)
    {
        MouseMoveCommandBehavior behavior = GetorCreateMouseMoveBehavior(control);
        behavior.Command = e.NewValue as ICommand;
    }
}

```

Funkcja ta po prostu w razie potrzeby tworzy nowy obiekt typu MouseMoveCommandBehavior (gdy ktoś zbinduje komende) i dopina go do naszej kontrolki. Pomocnicza funkcja GetorCreateMouseMoveBehavior wygląda tak:

```
private static MouseMoveCommandBehavior GetorCreateMouseMoveBehavior(Control listBox)
{
    var behavior = listBox.GetValue(MouseMoveBehaviorProperty) as
        MouseMoveCommandBehavior;
    if (behavior == null)
    {
        behavior = new MouseMoveCommandBehavior(listBox);
        listBox.SetValue(MouseMoveBehaviorProperty, behavior);
    }
    return behavior;
}

```

Obiekt rejestrowany poprzez funkcję GetorCreateMouseMoveBehavior jest dopinany do kolejnej attached property, która również została zadeklarowana w tym pliku

```
public static MouseMoveCommandBehavior GetMouseMoveBehavior(DependencyObject obj)
{
    return (MouseMoveCommandBehavior)obj.GetValue(MouseMoveBehaviorProperty);
}

public static void SetMouseMoveBehavior(DependencyObject obj, MouseMoveCommandBehavior value)
{
    obj.SetValue(MouseMoveBehaviorProperty, value);
}

public static readonly DependencyProperty MouseMoveBehaviorProperty =
    DependencyProperty.RegisterAttached("MouseMoveBehavior", typeof(MouseMoveCommandBehavior), typeof(MouseMove), null );

```

Mając zdefiniowane wszystkie powyższe właściwości możemy już wykorzystać naszą komendę. Jednakże przydałoby się dodać jeszcze jedną właściwość (opcjonalnie), mianowicie właściwość CommandParameters

```
public static object GetCommandParametr(DependencyObject obj)
{
    return (object)obj.GetValue(CommandParametrProperty);
}

public static void SetCommandParametr(DependencyObject obj, object value)
{
    obj.SetValue(CommandParametrProperty, value);
}

public static readonly DependencyProperty CommandParametrProperty =
    DependencyProperty.RegisterAttached("CommandParametr", typeof(object), typeof(MouseMove), new PropertyMetadata(OnSetCustomCommandParameterCallback));

```

W tym propertisie również reagujemy na przypisnie obiektu.Handler OnSetCustomCommandParameterCallback wygląda następująco

```
private static void OnSetCustomCommandParameterCallback(DependencyObject dep,DependencyPropertyChangedEventArgs e)
{
    var listBox = dep as Control;
    if (listBox != null)
    {
        MouseMoveCommandBehavior behavior = GetorCreateMouseMoveBehavior(listBox); ;
            behavior.CommandParameter = e.NewValue;
    }
}

```

Mając już zdefiniowane wszystkie niezbędne właściwości możemy użyć ich w XAML-u. Po pierwsze musimy dodać alias do namespaca gdzie znajduje się nasza statycza klasa MouseMove. W moim przypadku wygląda to następująco:

```
xmlns:AttachedCommands="clr-namespace:MainModule.Commands"

```

Następnie bindujemy jakąś kontrolkę do naszego attached property Command. Wygląda to w następujący sposób:

Od teraz za każdym razem jak najedziemy na txtButton wywoła się komenda SomeCommandFromViewModel. Podsumowując trzeba się całkiem sporo napisać żeby zmusić do działania CommandBehaviors . W następnym poście przedstawię dwa sposoby na osiągnięcie tego samego efektu mniejszym kosztem.
