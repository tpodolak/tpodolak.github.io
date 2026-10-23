---
title: "Windows Phone - własny DataTemplateSelector"
published: 2012-06-09T22:55:00.000Z
categories: 
  - "datatemplate"
  - "windows-phone"
tags: 
  - "datatemplate"
  - "windows-phone"
---

Pisząc moją małą aplikację pod Windows Phone po raz kolejny natknąłem się na problem. Pod WP7 nie ma tak przydatnej rzeczy jaką jest DataTemplateSelector znany nam bardziej, lub mniej z Silverlighta oraz WPF-a.Na szczęście napisane własnego DataTemplateSelector-a nie jest specjalnie skomplikowane. Jak zwykle w takich przypadkach liczy się pomysł - jak dobrze, że jest Google. Nasz customowy DataTemplateSelector zostanie oparty o kontrolkę ContentControl. Po pierwsze stwórzmy klasę bazową DataTemplateSelectora dziedziczącą po ContentControl,w której przeciążamy funkcję OnContentChanged,

```
public abstract class AbstractDataTemplateSelector : ContentControl
{
    public abstract DataTemplate SelectTemplate(object item, DependencyObject container);
    
    protected override void OnContentChanged(object oldContent, object newContent)
    {
        base.OnContentChanged(oldContent, newContent);
        ContentTemplate = SelectTemplate(newContent, this);
    }
}

```

Klasa ta będzie klasą z której będą wywodzić się wszystkie nasze TemplateSelectory. Załóżmy, że chcemy zbudować DataTemplateSelector, który będzie obsługiwał aplikację chata. Powinien on zatem reagować na dwa typy elementów:

- wiadomości przychodzące
- wiadomości wychodzące

Stwórzmy zatem "wyspecjalizowany" DataTemplateSelector, który w zależności od typu wiadomości zwróci odpowiedni DataTemplate.

```
public class ChatMessageTemplateSelector : AbstractDataTemplateSelector
{
    public DataTemplate Out { get; set; }
    public DataTemplate In { get; set; }

    public override DataTemplate SelectTemplate(object item, DependencyObject container)
    {
        ChatMessage message = item as ChatMessage;
        if (message != null)
        {
            switch (message.MessageDirection)
            {
                case MessageDirection.In:
                    return In;
                case MessageDirection.Out:
                    return Out;
                default:
                    return Out;
            }
        }
        return In;
    }
}

```

W klasie ChatMessageTemplateSelector przeciążyliśmy metodę SelectTemplate. W metodzie tej, na podstawie zbindowanego obiektu (parametr item) określamy jaki template powinniśmy zwrócić. Templaty do wiadomości przychodzących oraz wychodzących zostały zdefiniowane jako propertisy.

- Out - template wiadomości wychodzącej
- In - template wiadomości przychodzącej

Pozostaje nam tylko zdefiniować wymienione wyżej templaty. Nie będziemy robić tego w kodzie, ale w XAML-u. Nasz nowo stworzony DataTemplateSelector wykorzytamy w ListBox-ie

Jako, że nasz ChatMessageTemplateSelector jest tak naprawdę obiektem typu ContentControl, zatem możemy go zbindować do właściwości ItemTemplate ListBox-a. Zasób GeneralChatMessageTemplate wygląda w następujący sposób

Jak widać jest to obiekt typu ChatMessageTemplateSelector, którego właściwość Content jest zbindowana do aktualnego kontekstu (pojedyncze słowo kluczowe Binding). Widzimy również, że ustawiliśmy wartości właściwości odpowiadających za templaty poszczególnych wiadomości (In="{StaticResource IncomingChatMessageTemplate}" Out="{StaticResource OutcomingChatMessageTemplate}"). Wspomniane templaty wyglądają w następujący sposób

```

            
                
                    
                        
                        
                    
                    
                        
                        
                    
                    
                        
                            
                        
                        
                    
                    
                    
                
            

```

```

            
                
                    
                        
                        
                    
                    
                        
                        
                    
                    
                        
                            
                        
                        
                    
                    
                    
                
            

```

Od teraz gdy do ListBox-a zostanie dodany nowy item, pierwszą rzeczą jaka się odpali będzie funkcja OnContentChanged. W funkcji tej AbstractDataTemplateSelector na podstawie nowo przybyłego itemu ustawi właściwość ContentTemplate, na taki template jaki zwróci mu funkcja SelectTemplate. Wynik działania ChatMessageTemplateSelector wygląda w następujący sposób [![DataTemplateSelector](images/Result.jpg)](http://tpodolak.com/blog/wp-content/uploads/2012/06/windows-phone-wlasny-datatemplateselector/Result.jpg)
