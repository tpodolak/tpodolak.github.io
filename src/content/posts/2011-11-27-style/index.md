---
title: "Style"
published: 2011-11-27T17:41:00.000Z
categories:
  - "dotnet"
tags: 
  - "silverlight"
  - "styles"
  - "wpf"
---

Style jest to mechanizm wprowadzony w `WPF-ie`, a następnie w `Silverlighcie`, dzięki któremu w łatwy sposób można ujednolicić wygląd elementów naszej aplikacji.
Style z reguły definiowane są w zasobach.
Mogą to być zarówno zasoby całej aplikacji, danego okna lub nawet wybranej kontrolki.
Przykładowy styl może wyglądać w następujący sposób:

```xml
<Style x:Key="przycisk">
    <Setter Property="Button.FontSize" Value="22" />
    <Setter Property="Button.Background" Value="Orange" />
    <Setter Property="Button.Width" Value="60" />
</Style>
```

Każdy styl jest rozpoznawany dzięki unikalnemu kluczowi - parametr `x:Key`.
Możliwe jest pominięcie klucza, w przypadku gdy ustawiona zostanie właściwść `TargetType`.
Jednakże zdefiniowanie właściwości `TargetType` spowoduje, że dany styl będzie automatycznie zastosowany do wszystkich kontrolek danego typu.
W przypadku gdybyśmy jednak chcieli wyłączyć dany styl dla pojedynczej kontrolki możemy zawsze przypisać mu wartość `x:Null`.

Jak widać styl posiada kolekcję obiektów typu `Setter`. Najważniejszymi propertisami każdego `Settera` są:

- `Property` - określa nazwę właściwości, którą dany styl będzie modyfikować,
- `Value` - określa wartość właściwości określonej w elemencie `Property`

Dla przykładu - następujący styl:

```xml

<Style x:Key="przycisk">
    <Setter Property="Button.FontSize" Value="22" />
</Style>
```

ustawi rozmiar czcionki na buttonie na `22 pkt`.
Jako, że nie została ustawiona właściwość `TargetType` dla stylu, musimy podawać pełną nazwę właściwości(czyli nazwę klasy oraz nazwę właściwości).
Oczywiście możemy również ustawiać bardziej skomplikowane właściwości

```xml
<Style TargetType{x:Type Button}>
    <Setter Property="RenderTransform">
        <Setter.Value>
            <SkewTransform CenterX=".5" CenterY=".5" AngleX="-10" AngleY="15" />
        </Setter.Value>
    </Setter>
</Style>
```

W przypadku gdybyśmy pisali w `Silverlighcie` właściwość `TargetType` ustawia się troszeczkę inaczej.
Mianowicie zamiast `TargetType{x:Type Button}` piszemy `TargetType{Button}`

Właściwość `TargetType` określa nam dla jakiego typu obiektów(kontrolek) dany typ jest przeznaczony.
Styl z pierwszego przykładu można zapisać następująco:

```xml
<Style  TargetType={x:Type Button}>
    <Setter Property="FontSize" Value="22" />
</Style>
```

Dzięki użyciu właściwości `TargetType`, kompilator wie, że dany styl jest przeznaczony dla `Buttona`, dlatego też możemy w `Setterze` użyć skróconej nazwy właściwości(`FontSize` zamiast `Button.FontSize`).
Ponadto dzięki użyciu `TargetType`, możemy pominąć definiowanie klucza po jakim nasz styl będzie rozpoznawany.
Od tej chwili wszystkie buttony będą renderowane z użyciem powyższego stylu (oczywiście jeżeli styl ten będzie w resourcach danej kontrolki).

**Dziedziczenie styli**

Style mogą być dziedziczone. Oznacza to tyle, że styl pochodny będzie rozszerzał styl bazowy.
W przypadku gdy styl bazowy ma zdefiniowany `TargetType`, styl dziedziczący nie może go zmienić.
W celu zdefiniowania dziedziczenia używa się właściwości BasedOn.
Przykładowe dziedziczenie styli pokazano poniżej

```xml
<Style x:Key="baseStyle">
    <Setter Property="FontSize" Value="12" />
    <Setter Property="Background" Value="Orange" />
</Style>
<Style x:Key="boldStyle" BasedOn="{StaticResource baseStyle}">
    <Setter Property="FontWeight" Value="Bold" />
</Style>
```

W stylu dziedziczącym można przesłaniać właściwości ze stylu bazowego.
W przypadku gdy nie zostaną one przesłonięte, użyte zostaną propertisy ze stylu bazowego.
W celu zaaplikowania stylu do jakiejś kontrolki posługujemy się następującą składnią

```xml
<Button Style="{StaticResource myStyle}"></Button>
```

`myStyle` - klucz stylu zdefiniowanego w zasobach.
