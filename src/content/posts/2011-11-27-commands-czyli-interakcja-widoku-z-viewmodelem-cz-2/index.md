---
title: "Commands - czyli interakcja widoku z ViewModelem cz.2"
published: 2011-11-27T16:05:00.000Z
categories:
  - "dotnet"
tags: 
  - "commands"
  - "silverlight"
  - "wpf"
---

Tak jak wspomniałem w poprzednim wpisie, tym razem zajmiemy się tworzeniem własnej klasy implantującej interfejs `ICommand`.

### 1\. Implementacja interfejsu `ICommand` - `WPF`

Klasa implementująca `ICommand` może wyglądać w następujący sposób

```csharp
public class DelegateCommand : ICommand
{
    private Action<object> execute;
    private Func<object, bool> canExecute;
    
    public event EventHandler CanExecuteChanged
    {
        add
        {
            CommandManager.RequerySuggested += value;
        }
        remove
        {
            CommandManager.RequerySuggested -= value;
        }
    }
    
    public DelegateCommand(Action<object> execute, Func<object, bool> canExecute)
    {
        this.execute = execute;
        this.canExecute = canExecute;
    }
    
    public bool CanExecute(object parameter)
    {
        if (canExecute == null) return true;
        return canExecute(parameter);
    }
    
    public void Execute(object parameter)
    {
        if (execute == null) return;
        execute((object)parameter);
    }
}
```

Klasa `DelegateCommand` przyjmuje w konstruktorze dwa parametry - delegaty do funkcji.
Pierwszy z nich jest to delegat do funkcji, która ma się wykonać, gdy komenda może zostać wykonana.
Drugi natomiast jest to delegat do funkcji, która sprawdza czy dana komenda może zostać wykonana.
Ważnym elementem jest tutaj następujący kawałek kodu:

```csharp
public event EventHandler CanExecuteChanged
{
    add
    {
        CommandManager.RequerySuggested += value;
    }
    remove
    {
        CommandManager.RequerySuggested -= value;
    }
}
```

który podłącza naszą klasę do `WPF-owego` systemu komend.

Teraz wystarczy w ViewModelu stworzyć obiekt typu DelegateCommand przekazać do niego odpowiednie funkcje, a następnie zbindować go do widoku.
Może to wyglądać w następujący sposób:

- `ViewModel`
    ```csharp
    public ICommand AddCommand { get; set;}

    public WatchListViewModel()
    {
        AddCommand = new DelegateCommand(val => Add(), val => CanAdd());
    }
    ```

- Widok (`XAML`)
    ```xml
    <Button Command="{Binding AddCommand}"/>
    ```

### 2. Implementacja interfejsu `ICommand` `Silverlight`
Przedstawiony powyżej przykład skompiluje się jedynie w aplikacji `WPF-owej`.
`Silverlight` niestety nie posiada `CommandManagera`, dlatego też gdy chcemy używać komend właśnie w tej technologii musimy zmodyfikować nasz kod na następujący:
```csharp
public class DelegateCommand : ICommand
{
    public event EventHandler CanExecuteChanged;
    private Action<object> execute;
    private Func<object, bool> canExecute;
    private bool previousState;
    
    public DelegateCommand(Action<object> execute, Func<object, bool> canExecute)
    {
        this.execute = execute;
        this.canExecute = canExecute;
    }
    
    public DelegateCommand(Action<object> execute)
    {
        this.execute = execute;
    }
    
    public bool CanExecute(object parameter)
    {
        if (canExecute == null) return true;
        bool currentState = canExecute((object)parameter);
        if (currentState != previousState)
        {
            previousState = currentState;
            if (CanExecuteChanged != null)
                CanExecuteChanged(this, EventArgs.Empty);
            return currentState;
        }
        return currentState;
    }
    
    public void Execute(object parameter)
    {
        if (execute == null) return;
        execute((object)parameter);
    }
    
    public void RaiseCanExecute()
    {
        if (CanExecuteChanged != null)
            CanExecuteChanged(this, EventArgs.Empty);
    }
}
```

Jak widać w funkcji

```csharp
public bool CanExecute(object parameter)
```

sami musimy zadbać o wywołanie zdarzenie

```csharp
public event EventHandler CanExecuteChanged;

```
Ponadto dopisana została funkcja 

```csharp
public void RaiseCanExecute()
```

funkcję tą musimy wywoływać zawsze gdy zmieni się jakaś właściwość, która ma mieć wpływ na stan przycisku zbindowanego do naszej komendy.

### 3. Przykład
Załóżmy, że na widoku mamy przycisk edytuj, który powinien być aktywny tylko i wyłącznie wtedy, gdy zaznaczono jakiś element na gridzie.
Przycisk ten jest zbindowany do komendy `EditCommand`.
Jak już wcześniej wspomniano, z powodu braku w `Silverlighcie` `CommandManagera` sami musimy wywołać zdarzenie informujące o potrzebie zmiany stanu przycisku.
Dlatego też, w `ViewModelu` została stworzona właściwość `SelectedItem`

```csharp
public Department SelectedItem
{
    get { return selectedItem; }
    set
    {
        selectedItem = value;
        NotifyPropertyChanged(() => SelectedItem);
        EditCommand.RaiseCanExecute();
    }
}
```

która reaguje na zmiany zaznaczenia na gridzie.
W chwili, gdy zaznaczenie się zmienia, wywoływany jest seter z tej właściwości, w którym to wywołujemy funkcję `EditCommand.RaiseCanExecute`.
Dzięki czemu informujemy kontrolkę o ewentualnej potrzebie zmiany jej stanu.

### 4. Podsumowanie
Komendy w bardzo prosty i wygodny sposób pozwalają nam wywoływać metody bezpośrednio z `ViewModelu`.
Niestety mają one również swoje ograniczenia:

- reagują jedynie na zdarzenie `Click`,
- można je wykorzystać jedynie na kontrolkach dziedziczących po klasie `ButtonBase` oraz kontrolkach typu `MenuItem`
