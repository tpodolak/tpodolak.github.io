---
title: "INotifyPropertyChange - notifying about change of all properties at once"
published: 2014-08-24T09:40:00.000Z
slug: "inotifypropertychange-notifying-about-change-of-all-properties-at-once"
categories: 
  - "inotifypropertychanged"
  - "mvvm"
  - "silverlight"
  - "wpf"
tags: 
  - "inotifypropertychanged"
  - "mvvm"
  - "silverlight"
  - "wpf"
---

Today, working on a new feature for my pet project, I realized that I have to notify the view, that all properties in view model have changed. The most obvious way to achieve that would, of course be to rise _PropertyChange_ event a bunch of times.

```
protected virtual void OnPropertyChanged(Expression> propertyExpression)
{
   //..
   //implementation
   //..
}

protected virtual void OnPropertyChanged(string propertyName)
{
   //..
   //implementation
   //..
}

public void Refresh()
{
   OnPropertyChanged(() => FirstProperty);
   OnPropertyChanged(() => SecondProperty);
   OnPropertyChanged(() => ThirdProperty);
   //and so on ...
}

```

This is good solution for one time usage, however I was interested in something more general, something which could be extracted to base view model. Fortunately, it turns out that there is a simple trick to do that. All You have to do is use an empty string or null as a property name. So in my case this comes down to this one-liner

```
public void Refresh()
{
   OnPropertyChanged(string.Empty);
}

```
