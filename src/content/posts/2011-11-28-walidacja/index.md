---
title: "Walidacja"
published: 2011-11-28T19:03:00.000Z
categories: 
  - "idataerrorinfo"
  - "inotifyerrorinfo"
  - "silverlight"
  - "walidacja"
  - "wpf"
tags: 
  - "silverlight"
  - "validation"
  - "wpf"
---

Walidacja jest to technika sprawdzająca, czy dany obiekt spełnia pewne założenia poprawności danych.
W `WPF-ie` oraz `Silverlighcie` istnieją trzy sposoby walidacji obiektów:

- walidacja poprzez rzucanie wyjątków,
- walidacja z użyciem interfejsu `IDataErrorInfo`,
- walidacja z użyciem interfejsu `INotifyDataErrorInfo`

### 1\. Walidacja poprzez rzucanie wyjątków

Walidacja poprzez rzucanie wyjątków odbywa się w następujący sposób.
W seterze danej właściwości dodajemy warunek sprawdzający czy wpisane dane są poprawne.
Jeżeli nie to najzwyczajniej w świecie rzucamy wyjątek, w którym podajemy komunikat błędu.
Przykładowy properties z walidacją może wyglądać w ten sposób:

```csharp
private string _name;
public string Name
{
    get { return _name; }
    set
    {
        _name = value;
        if (string.IsNullOrEmpty(_name))
            throw new Exception("Nazwa nei może być pusta");
    }
}
```

W celu "wyłapania" tego wyjątku i pokazania odpowiedniego komunikatu, w bindingu musimy ustawić właściwość `ValidatesOnExceptions` na wartość `true`.
```xml
<TextBox Text="{Binding Name, ValidatesOnExceptions=True, Mode=TwoWay}" />

```
Taki sposób walidowania jest jednak rzadko stosowany i wielu programistów twierdzi, że rzucanie wyjątków powinno się odbywać tylko w przypadku nieprawidłowego działania aplikacji.
Ponadto walidowane propertisy nie mogą być autopropertisami, co dodatkowo wydłuża czas tworzenia klas.

### 2\. Walidacja z użyciem interfejsu `IDataErrorInfo`

```csharp
public interface IDataErrorInfo
{
    string this[string columnName] { get; }
    string Error { get; }
}
```

W celu wyłapywania błędów w widoku, należy w bindingu ustawić `ValidatesOnDataError = true`
```xml
<TextBox Text="{Binding Name, ValidatesOnDataError=True, Mode=TwoWay}" />
```

Przykładowa klasa implementująca interfejs `IDataErrorInfo` może wyglądać następująco:

```csharp
public class Customer : IDataErrorInfo
{
    public string Name { get; set; }
    
    public string Error
    {
        get { return string.Empty; }
    }
    
    public string this[string propertyName]
    {
        get 
        {
            string result = string.Empty;
            if (propertyName == "Name")
            {
                if (string.IsNullOrEmpty(Name))
                    result = "Wartość nie moż być pusta";
            }
            
            return result;
        }
    }
}
```

Najważniejszą metodą w powyższej klasie jest indekser

```csharp
string this[string propertyName]
```

to właśnie tutaj mogą zostać sprawdzone wszystkie właściwości danego obiektu - `propertyName` oznacza nazwę propertisu, który walidujemy.
W przypadku, gdy wartość jakiejś właściwości jest nieprawidłowa, w pole `result` wpisujemy komunikat błędu.
Komunikaty te "wyłapywane" są przez widok, a następnie wyświetlane w postaci komunikatów przy odpowiednich kontrolkach.
Jeżeli wszystko jest `OK` zwracamy `string.Empty`. Walidacje przy pomocy interfejsu `IDataErrorInfo` idealnie nadają się do walidowania modelu.

### 3\. Walidacja z użyciem interfejsu `INotifyDataErrorInfo`

Interfejs `INotifyDataErrorInfo` prezentuje się w następujący sposób:

```csharp
public interface INotifyDataErrorInfo
{
     bool HasErrors { get; }
     event EventHandler<DataErrorsChangedEventArgs> ErrorsChanged;
     IEnumerable GetErrors(string propertyName);
}
```

- `bool HasErrors` - określa czy dany obiekt zawiera błędy
- `event EventHandler ErrorsChanged` - zdarzenie informujące o zmienie ilości błędów w obiekcie
- `IEnumerable GetErrors(string propertyName)` - funkcja pobierająca kolekcję błędów dla danego propertisa

W celu "wyłapania" błędów przez widok należy w bindingu ustawić properties `NotifyOnValidationError = true`
```xml
<TextBox Text="{Binding Name, NotifyOnValidationError=True, Mode=TwoWay}" />
```
Jak już wcześniej wspomniano funkcja `GetErrors(string propertyName)` zwraca kolekcję błędów dla danej właściwości.
Zatem do klasy, która będzie implementowała interfejs `INotifyDataErrorInfo` należy dodać kolekcję przechowującą obiekty typu `ValidationResult`.
Przykładowa implementacja interfejsu może wyglądać w następujący sposób:

```csharp
public class BaseViewModel : INotifyDataErrorInfo
{
    private ICollection<ValidationResult> _validationResults;
    public IEnumerable GetErrors(string propertyName)
    {
        return _validationResults.Where(result => result.MemberNames.Contains(propertyName));
    }
 
    public bool HasErrors
    {
        get { return _validationResults.Count > 0; }
    }
 
    public event EventHandler<DataErrorsChangedEventArgs> ErrorsChanged;
    
    private void NotifyErrorsChanged(string propertyName)
    {
        if(ErrorsChanged!=null)
            ErrorsChanged(this, new DataErrorsChangedEventArgs(propertyName));
    }

    protected void Validate()
    {
        _validationResults.Clear();
        Validator.TryValidateObject(this, new ValidationContext(this, null, null), _validationResults, true);
     
        foreach (var result in _validationResults)
            NotifyErrorsChanged(result.MemberNames.First());
    }
    
    protected void Validate(string propertyName)
    {
        var validationResults = _validationResults.Where(result => result.MemberNames.Contains(propertyName)).ToList();
        foreach (var result in validationResults)
               _validationResults.Remove(result);
        
        Validator.TryValidateProperty(value, new ValidationContext(this, null, null) { MemberName = propertyName }, _validationResults);
           NotifyErrorsChanged(propertyName);
     }
}
```

Funkcja `Validate()` najpierw czyści wszystkie poprzednie wyniki walidacji, a następnie przy pomocy klasy `Validator` oraz funkcji `TryValidateObject` waliduje wszystkie właściwości, które zostały oznaczone atrybutem dziedziczącym po klasie `ValidationAttribute`.
Z kolei funkcja `Validate(string propertyName)` waliduje tylko konkretną właściwość.
Przykładowe walidowanie właściwości przy pomocy atrybutów może wyglądać w następujący sposób:

```csharp
[Required(ErrorMessage = "Pole nie może być puste")]
public string Subject
{
    get { return _subject; }
    set
    {
        _subject = value;
         Validate(“Subject”)
    }
}
```

W celu stworzenia własnych regół walidacji, nie uwzględnionych w zapewnionych przez framework atrybutach należy stworzyć własną klasę dziedziczącą po klasie `ValidationAttribute`, a następnie przeciążyć metodę `IsValid`.
Przykładowa klasa może wyglądać w następujący sposób:

```csharp
public class IntValidation : ValidationAttribute
{
    private bool allowNull;
    public IntValidation(bool allowNull)
    {
        this.allowNull = allowNull;
    }
    
    protected override ValidationResult IsValid(object value, ValidationContext validationContext)
    {
        if (value != null)
        {
            int resul;
            if (int.TryParse(value.ToString(), out resul))
                return ValidationResult.Success;
            else
                return new ValidationResult(ErrorMessage, new List{validationContext.MemberName });
        }
        
        return allowNull ? ValidationResult.Success : new ValidationResult(ErrorMessage);
    }
}
```

Walidacja przy użyciu interfejsu `INotifyDataErrorInfo` idealnie nadaje się (wg mnie) do walidowaniu całych `ViewModeli`.
Przy zamykaniu okna wystarczy wywołać funkcję `Validate` z bazowego `ViewModelu`, a w przypadku gdy zwróci ona `false` zatrzymać zamykanie okna.
Jako, że walidacja zostanie przeprowadzona na wszystkich wybranych przez nas propertisach, widok automatycznie się zaktualizuje i pokaże komunikaty błędów na odpowiednich kontrolkach okna.
