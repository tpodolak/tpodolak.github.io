---
title: "MVVM i okna modalne"
published: 2011-11-30T17:10:00.000Z
categories: 
  - "modalwindow"
  - "mvvm"
tags: 
  - "modalwindow"
  - "mvvm"
---

Często podczas użytkowania programów zachodzi konieczność pokazania dodatkowego okna, służącego do interakcji z użytkownikiem.
Najczęściej okno takie należy pokazać w określonym przypadku.
Jak już wcześniej zostało wspomniane cała logika powinna być umieszczona w `ViewMoedlu`, zatem nasuwa się pytanie, w jaki sposób z ViewModelu pokazać okno modalne - przecież `ViewModel` nie powinien mieć żadnych informacji o widoku.
Rozwiązanie tego problemu polega na oddelegowaniu pokazywania widoków lub `MessageBox-ów` do wyspecjalizowanych klas tzw. serwisów.
Ponadto w przypadku gdy chcemy pokazywać proste komunikaty możemy również skorzystać z `Interaction`/`Interactivity` oraz klasy `Prisma` `InteractionRequest`.

### 1\. InteractionRequest

Jak już wcześniej wspomniano klasa `InteractionRequest` odpowiedzialna jest za pokazywanie komunikatów użytkownikowi - koordynuje ona działanie pomiędzy `ViewModelem` a widokiem.
W celu skorzystania z klasy `InteractionRequest` w `ViewModelu` tworzymy publiczną właściwość udostpęniającą obiekt typu `InteractionRequest` na zewnątrz

```csharp
public InteractionRequest<Confirmation> Request { get; set; }
Request = new InteractionRequest<Notification>();
```

Jak widać za generyczny typ `T` została podstawiona klasa `Notification`. Parametr `T` może przyjmować klasy dziedziczące po klasie `Notification`.
Domyślnie w `Prismie` są dwie takie klasy:

- `Notification` \- wspomniana już wcześniej, służy do powiadomienia użytkownika o jakimś zdarzeniu
- `Confirmation` \- również służy powiadominiu użytkownika o jakiś zdarzeniu, ale zwraca ona reakcję użytkownika (czy potwierdził daną akcję czy nie - coś jak `MessageBox YesNo`)

W celu wywołania okienka należy odpalić funkcję `Raise` na przykład w taki sposób:

```csharp
Request.Raise(new Notification { Content = "Info dla użytkownika", Title = "sth" }, confirmation => AfterMessageAction());
```

Funkcja `Raise` przyjmuje jeden lub dwa parametry.
Przedstawy bardziej zaawansowaną wersję tej funkcji - tą z dwoma parametrami.
W pierwszym parametrze podajemy obiekt typu `Notification`, w którym przekazujemy informacje do przekazania użytkownikowi (`Content`) oraz tytuł okna (`Title`).
Drugim parametrem jest delegat `Action` , który określa co mamy zrobić po zamknięciu okna przez użytkownika.
Ostatnią rzeczą jaką musimy zrobić, żeby wykorzystać `NotificationRequest` jest zdefiniowanie triggera w widoku, który będzie reagował na odpalenie funkcji `Raise`.
Robimy to w następujący sposób:

- definiujemy w XAML-u alias do namespaca interactivity
    
    ```xml
   xmlns:i="http://schemas.microsoft.com/expression/2010/interactivity" 
    ```
    
- tworzymy `InteractionRequestTrigger`
   ```xml
   <i:Interaction.Triggers>
      <prism:InteractionRequestTrigger SourceObject="{Binding Request}">
          <prism:PopupChildWindowAction></prism:PopupChildWindowAction>
      </prism:InteractionRequestTrigger>
    </i:Interaction.Triggers>

   ``` 

### 2\. MessageBoxService

Alternatywą dla `InteractionRequest` jest stworzenie własnej klasy, do której zostałyby oddelegowane wszystkie prośby o pokazania `MessageBoxa`.
Przykładowa implementacja takiego serwisu może wyglądać w następujący sposób.
Po pierwsze stwórzmy interfejs z funkcjami potrzebnymi do pokazania `MessageBoxa`

```csharp
public interface IMessageBoxService
{      
    MessageBoxResult ShowMessageBox (string info, string caption,MessageBoxButton buttons);      
}
```

Następnie zaimplementujmy ten interfejs w klasie `MessageBoxService` \- właśnie do tej klasy będą oddelegowywane wszystkie prośby o pokazanie `MessageBoxa`

```csharp
public class MessageBoxService : IMessageBoxService
{
    public MessageBoxResult ShowMessageBox(string info, string caption, MessageBoxButton buttons)
    {
        return MessageBox.Show(info, caption, buttons);
    }
}
```

Taki serwis musimy następnie przekazać do każdego `ViewModelu` , w którym będzie potrzeba pokazania `MessageBoxa`.
Jako, że ręczne przekazywanie tego obiektu może być nużące, możemy skorzystać z dobrodziejstw `Inversion of Control`.
Ja skorzystałem z kontenera z `Unity`.
Po pierwsze musimy zarejestrować nasz typ w kontenerze

```csharp
_container.RegisterType<IMessageBoxService, MessageBoxService>();
```

następnie `MessageBoxService` może zostać wstrzyknięty do każdego `ViewModelu` przy np. przy pomocy wstrzykiwania właściwości.

```csharp
[Dependency]
public IMessageBoxService MessageBoxService
{
  get { return  messageBoxService; }
  set { messageBoxService = value; }
}
```

Oczywiście żeby nasza właściwość została wstrzykniętai, nasz `ViewModel` musi zostać stworzony przy użycia kontenera `IO`.
ii
Zauważmy, że właściwość `MessageBoxService` nie jest konkretnym typem, lecz interfejsem.
Dzięki takiemu podejściu nasza aplikacja wciąż jest w łatwy sposób testowalna oraz `ViewModel` nie ma nic wspólnego z klasami widoku.

### 3\. ModalWindowService

Do pokazywania widoków(jako okien) z poziomu `ViewModelu` posłużmy się podobnym mechanizmem jak w przypadku pokazywania `MessageBox-ów`.
Zasada działania klasy, która stworzymy będzie taka sama, jednakże będziemy musieli odrobinę poszerzyć jej funkcjonalność.
Po pierwsze tak jak poprzednio stwórzmy odpowiedni interfejs - `IModalWindowService`. 

:::warning[UWAGA]
Przykład `ModalWindowServicu` zostanie zaprezentowany dla `Silverlight-a`, gdyż okna modalne w `silverlighcie` to tak naprawdę okna semi-modalne. Główny wątek się nie zatrzymuje, jednakże użytkownik nie ma możliwości interakcji z oknami będącymi pod aktualnie widocznym oknem. 
:::

```csharp
public interface IModalDialogService
{
    void ShowDialog<TViewModel>(IModalView<TViewModel> view,Action<TViewModel> CloseAction) where TViewModel : ViewModelBase;       
}
```

Zauważmy, że funkcja `ShowDialog` w parametrze nie przyjmuje konkretnego widoku, lecz interfejs, który każde okno modalne powinno implementować - `IModalView`.
Interfejs ten może wyglądać w następujący sposób:

```csharp
public interface IModalView<TViewModel> where TViewModel : ViewModelBase
{
    /// 
    /// ViewModel odpowiedzialny za dane okno
    /// 
    TViewModel ViewModel { get; set; }
    /// 
    /// DialogResult po zamknieciu okna
    /// 
    bool? DialogResult { get; set; }
    /// 
    /// zamkniecie okna
    /// 
    void Close();
    /// 
    /// Pokazanie okna
    /// 
    void Show();
    /// 
    /// Zdarzenie wywoływane w momencie zamkniecia okna modalnego
    /// 
    event EventHandler Closed;
    /// 
    /// Zdarzenie wywoływane w chwli zamykania widoku 
    /// 
    event EventHandler<CancelEventArgs> Closing;
}
```

Jako, że okna modalne w `Silverlighcie` są tak naprawdę oknami semi-modalnymi musimy wiedzieć kiedy dane okno zostanie zamknięte.
Dlatego, też interfejs ten zawiera zdarzenie

```csharp
event EventHandler Closed;
```

ponadto wypadałoby sprawdzić czy dane wpisane w oknie są poprawne, dlatego też dodano zdarzenie

```csharp
event EventHandler<CancelEventArgs> Closing;
```

w przypadku gdy dane wpisane w oknie nie będą poprawne, nasz `ModalDialogService` zapobiegnie zamknięciu okna.
Ostatecznie nasza klasa ModalDialogService może wyglądać w następujący sposób:

```csharp
public class ModalDialogService : IModalDialogService
{
    private EventHandler<CancelEventArgs> ClosingEventHandler;
    private EventHandler CloseEventHandler;
    public void ShowDialog<TViewModel>(IModalView<TViewModel> view, Action<TViewModel> CloseAction) where TViewModel : ViewModelBase
    {
        view.Closing += ClosingEventHandler = (sender, args) =>
        {
            if (view.DialogResult.HasValue && view.DialogResult.Value)
            {
                if (!(args.Cancel = !view.ViewModel.Validate())) // jezeli mozna zamknac okno to odczepiamy handler
                    view.Closing -= ClosingEventHandler;
            }
        };
        if (CloseAction != null)
        {
            view.Closed += CloseEventHandler = (sender, args) =>
                {
                    CloseAction(view.ViewModel);
                    view.Closed -= CloseEventHandler;
                };
        }
        view.Show();
    }
}
```

Nasz serwis podobnie jak w przypadku `MessageBoxServicu` rejestrujemy w kontenerze, a następnie wstrzykujemy go do `ViewModelu`

```csharp
_container.RegisterType<IModalDialogService, ModalDialogService>();
[Dependency]
public IMessageBoxService MessageBoxService
{
 get { return  messageBoxService; }
 set { messageBoxService = value; }
}
```

Pozostaje nam jedynie kwestia wyjaśnienia w jaki sposób wywołać nasze okno. Nie powinniśmy tworzyć okna w `ViewModelu`, gdyż łamie to zasadę `MVVM-a`.
Dlatego też po raz kolejny skorzystamy z kontenera `IoC`. W kontenerze `IoC` rejestrujemy sobie nasz widok

```csharp
_container.RegisterType<IModalView<AddPersonViewModel>,AddPersonView>()
```

jako, że `ViewModel` jest wstrzykiwany do `View` poprzez `Dependency Injection` należy również w kontenerze zarejestrować odpowiedni typ `ViewModelu` - czyli w tym przypadku `AddPersonViewModel`

```csharp
_container.RegisterType<AddPersonView>()
```

Mając już zarejestrowane w kontenerze wszystkie niezbędne typu możemy wywołać okno z `ViewModelu` w następujący sposób:

```csharp wrap=false
ModalDialogService.ShowDialog<EditAllPlayersViewModel>(_container.Resolve<IModalView<AddPersonViewModel>>(), model => {//tutaj jakas logika });
```

Obiekt widoku otrzymujemy z kontenera `IoC` wykorzystując funkcję `Resolve`, w miejsce `LambdaExpression` wstawiamy nasze wyrażenie w którym określamy co zrobimy po poprawnym zamknięciu okna. Zauważmy, że ViewModel nie ma żadnych informacji o widoku - kontener nie zwraca nam konkretnego typu lecz interfejs. Dzięki takiemu podejściu nasza aplikacja może być w łatwy sposób testowalna.
