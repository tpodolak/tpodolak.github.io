---
title: "INotifyPropertyChanged oraz Expresssion Trees"
published: 2011-11-27T10:24:00.000Z
categories: 
  - "expressiontree"
  - "inotifypropertychanged"
tags: 
  - "expression-trees"
  - "inotifypropertychanged"
  - "lambda-expressions"
---

Interfejs `INotifyPropertyChangedPropertyChanged` znany jest prawdopodobnie każdemu programiście `C#`.
Interfejs ten zawiera jedynie jedno zdarzenie

```csharp
public event PropertyChangedEventHandler PropertyChanged;
```

które powinniśmy odpalić w momencie gdy dana właściwość zostanie przez nas zmieniona.
Dzięki temu dowolny obiekt, który będzie nasłuchiwał zmian danej właściwości zostanie o tym poinformowany.
Przykładowa klasa implementująca ten interfejs może wyglądać w następujący sposób:

```csharp
public class ViewModelBase : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler PropertyChanged;
    public void NotifyPropertyChanged(string propertyName)
    {
        if (PropertyChanged != null)
            PropertyChanged(this, new PropertyChangedEventArgs(propertyName));
    }
    
    private string viewModelName;
    public string ViewModelName
    {
        get { return viewModelName; }
        set
        {
            viewModelName = value;
            NotifyPropertyChanged("ViewModelName");
        }
    }
}
```

Jak widać została stworzona funkcja pomocniczna

```csharp
public void NotifyPropertyChanged(string propertyName)
```

którą wywołujemy w setterze danej właściwości, podając w parametrze nazwę tej właściwości.
Niestety podejście takie jest bardzo podatne na błędy.
Po pierwsze bardzo łatwo można przekręcić nazwę właściwości, a co gorsze rozwiązanie takie nie jest uwzględniane podczas refactoringu.
Dlatego też w celu poprawienia naszego rozwiązania skorzystamy z mechanizmów dostarczanych przez `Expression Trees`.
Po pierwsze zmieniamy funkcję

```csharp
public void NotifyPropertyChanged(string propertyName)
```

na

```csharp
public void NotifyPropertyChanged(Expression<Func<object>> propertyExpression)
{
    if(PropertyChanged == null) return;
    
    PropertyChanged(this, new PropertyChangedEventArgs(GetPropertyName(propertyName)));
}
```

funkcja pomocnicza `GetPropertyName` ma następującą postać

```csharp
private string GetPropertyName(Expression<Func<object>> propertyExpression)
{
    var unaryExpression = propertyExpression.Body as UnaryExpression;
    var memberExpression = unaryExpression == null ? (MemberExpression)propertyExpression.Body : (MemberExpression)unaryExpression.Operand;
    var propertyName = memberExpression.Member.Name;
    return propertyName;
}
```

Teraz wystarczy prosty zapis

```csharp
NotifyPropertyChanged(()=> ViewModelName)
```

który odwołuje się bezpośrednio do właściwości a nie jej nazwy.
Dzięki temu kod w całości zostanie zrefaktoryzowany.
Rozwiązanie to jest teoretycznie odrobinę wolniejsze od używania stringów, jednak w praktyce jest to niezauważalne.
Można również funkcję

```csharp
string GetPropertyName(Expression<Func<object>> propertyExpression)
```

wyciągnąc do osobnej klasy i zrobić z tej funkcji extension method.

```csharp
public static string GetPropertyName(this object obj, Expression<Func<object>> propertyExpression)
{
    var unaryExpression = propertyExpression.Body as UnaryExpression;
    var memberExpression = unaryExpression == null ? (MemberExpression)propertyExpression.Body : (MemberExpression)unaryExpression.Operand;
    var propertyName = memberExpression.Member.Name;
    return propertyName;
}
```

Od teraz wystarczy, że zaimportujemy odpowiedni namespace i możemy wykorzystać naszą funkcję w każdej klasie.
