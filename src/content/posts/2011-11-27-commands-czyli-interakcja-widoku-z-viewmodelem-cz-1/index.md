---
title: "Commands  - czyli interakcja widoku z ViewModelem cz.1"
published: 2011-11-27T15:21:00.000Z
categories: 
  - "bindingcommand"
  - "commands"
  - "viewmodel"
  - "wpf"
tags: 
  - "bindingcommand"
  - "commands"
  - "viewmodel"
  - "wpf"
---

### 1\. Wstęp

Każdy programista, który napisał chociaż parę linijek kody w WinFormsach wie, że kontrolki używają eventów do powiadamiania o zmianach swojego stanu. W przypadku, gdy interesuje nas odpowiednia reakcja na zdarzenie, podpinamy się do niego odpowiednią funkcją i wykonujemy założone przez nas operację. W analogiczny sposób można postępować w WPF-ie oraz w Silverlighcie, jednakże podejście takie niejako mija się z modelem MVVM. Posiadanie event handlerów w kodzie, ściśle wiąże nam widok (XAML) z code behind lub nawet z samym ViewModelem danego widoku. Ponadto używanie eventów jest problematyczne (a właściwie niemożliwe), gdy widoki zostaną zdefiniowane w Resourcach. Dodatkową wadą używania event handlerów jest fakt, że aplikacje w których widok jest mocno związany z codebehind nie należą do aplikacji, które w łatwy sposób można poddać testom automatycznym.

### 2\. Interfejs ICommand

W celu rozluźnienia połączenia między widokiem a ViewModelem wprowadzono interfejs

```
public interface ICommand
{  
    event EventHandler CanExecuteChanged;    
    bool CanExecute(object parameter);    
    void Execute(object parameter);
}

```

Funkcja

```
public bool CanExecute(object parameter)

```

ma za zadanie sprawdzić, czy daną komendę można wykonać. Jeżeli nie,funkcja zwraca false i kontrolka zbindowana do danej komendy jest wygaszana (właściwość IsEnabled danej kontrolki ustawiana jest na false). Z kolei funkcja

```
public void Execute(object parameter)

```

jest to odpowiednik event handlera podłączonego do zdarzenia. Zdarzenie

```
public event EventHandler CanExecuteChanged;

```

informuje widok o tym czy dana komenda może się wykonać czy też nie - dzięki temu kontrolka wie kiedy się odświeżyć(zmienić wartość właściwości IsEnabled).

### 3\. Sposób użycia

Załóżmy, że mamy okno na którym znajduje się przycisk. Po naciśnięciu przycisku chcielibyśmy aby wykonała się jakaś czynność. Każdy obiekt typu Window oraz Control posiada kolekcję CommandBindings, która przechowuje wszystkie komendy danego okna. W celu dodania nowej komendy należy zrobić następującą rzecz. Po pierwsze musimy stworzyć nową komendę. Robimy to przy pomocy następującego kodu:

```
private static RoutedCommand AddCommand = new RoutedCommand();

```

W celu dodania komendy do danego okna/kontrolki wykonujemy następującą operację

```
this.CommandBindings.Add(new CommandBinding(AddCommand,ExecuteAddCommand,CanExecuteAddCommand));

```

Funkcja Add z klasy CommandBindingCollection przyjmuje w parametrze obiekt typu CommandBinding. Konstruktor takiego obiektu składa się z trzech parametrów:

- RoutedCommand - obiekt typu RoutedCommand
- delegat typu ExecutedRoutedEventHandler \- jest to delegat do funkcji, która ma się wykonać w przypadku gdy dana komenda spełnia warunki do “uruchomienia”
- delegat typu CanExecuteRoutedEventHandler \- jest to delegat do funkcji, która sprawdza czy daną komendę można wykonać. W celu zabronienia wykonania komendy należy ustawić argument ExecutedRoutedEventArgs CanExecute na false.

Na koniec należy jeszcze zbindować naszą komendę z przyciskiem. Przykładowy kod dodawania komendy może wyglądać w następujący sposób.

```
public partial class WatchList : Window
{
    private static RoutedCommand AddCommand = new RoutedCommand();
    
    public WatchListViewModel viewModel = new WatchListViewModel();
    
    public WatchList()
    {  
        InitializeComponent();
        this.CommandBindings.Add(new CommandBinding(AddCommand, ExecuteAddCommand, CanExecuteAddCommand));
    }
    
    private void CanExecuteAddCommand(object sender, CanExecuteRoutedEventArgs e)
    {
        e.CanExecute = viewModel.CanAdd();
    }
    
    private void ExecuteAddCommand(object sender, ExecutedRoutedEventArgs args)
    {
        viewModel.Add();
    }
}

```

Bindowanie w przycisku do komendy może wyglądać w następujący sposób (XAML)

gdzie local jest aliasem na namespace, w którym znajduje się okno.

### 4\. Podsumowanie

Użycie komend w pewnym stopniu oddzieliło nam widok od codebehind-a, jednakże wciąż nie jest to rozwiązanie idealne. Z codebehind-a wywołujemy metody ViewModelu, więc niejako ciągle jesteśmy bezpośrednio zależni od widoku. W części drugiej zaprezentuję w jaki sposób można stworzyć własny obiekt implementujący interfejs ICommand, dzięki czemu ograniczymy do minimum ilość kodu pisanego w codebehind.
