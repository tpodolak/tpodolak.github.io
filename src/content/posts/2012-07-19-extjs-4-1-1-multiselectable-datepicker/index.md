---
title: "Extjs 4.1.1 - multiselectable datepicker"
published: 2012-07-19T21:31:00.000Z
categories:
  - "web-development"
tags: 
  - "datepicker"
  - "extjs"
---

Recently, I have been given a task to make extjs datepicker allowing for selection of multiple dates.
Unfortunately afters hours of searching for some build-in function, it turned out that this kind of functionality is not supported by default.
Finaly, I decided to extend datepicker by creating component called `highlightableDatePicker`.
I started from creating a class which inhierits from `Ext.picker.Date`.
First draft of class looked this way

```javascript
Ext.define('HighlightableDatePicker', {
    extend: 'Ext.picker.Date',
    selectedDates:{},
    clsHighlightClass:'x-datepicker-selected',
    initComponent: function(){
        var me = this;
        me.callParent(arguments);
    },

    highlightDates: function(){
        var me = this;
    }
})
```

In this class I created additional function `highlightDates` which is responsible for highlighting dates.
Moreover, I added some additional config elements:

- `selectedDates` - object keeping track of dates which should be selected
- `clsHighlightClass` - `CSS` class defining selected cell style

The most important part of `HighlightableDatepicker` class is function `highlightDates` which is responsible for highlighting dates.
The body of this method looks like this

```javascript
highlightDates: function(){
      var me = this;
       if(!me.cells)
           return;
       me.cells.each(function(item){
           var date = new Date(item.dom.firstChild.dateValue).toDateString();
           if(me.selectedDates[date]){
               if(item.getAttribute('class').indexOf(me.clsHighlightClass)=== -1){
                   item.addCls(me.clsHighlightClass)
               }
           }else{
               item.removeCls(me.clsHighlightClass);
           }
       })
}
```

As You can see, this function simply compares date in cell with dates stored in selectedDates.
If there is a match, cell style is modified by adding extra `CSS` class into `class` attribute of cell (see addCls function of Extjs), otherwise `CSS` class responsible for highlighting is removed.
Having defind `highlightDates` function,I also had to attach an event handler to `select` event, in order to modify collection of selected dates.
This handler looks this way

```javascript
handleSelectionChanged: function(cmp, date){
   var me = this;
       if(me.selectedDates[date.toDateString()])
           delete me.selectedDates[date.toDateString()]
       else
           me.selectedDates[date.toDateString()] = date;
       me.highlightDates();
}
```

The final step to make this control work is to attach event handlers and call `highlightDates` function during initialization of component.

```javascript
initComponent: function() {
        var me = this;
        me.callParent(arguments);
        me.on('select',me.handleSelectionChanged,me);
        me.on('afterrender',me.highlightDates,me);
}
```

Please, notice that `highlightDates` is called after component is rendered, because there is no rendered cells before that moment.
Entire code listing is presented below

```javascript
Ext.define('HighlightableDatePicker', {
    extend: 'Ext.picker.Date',
    selectedDates : {},
    clsHighlightClass :'x-datepicker-selected',
    
    initComponent: function(){
        var me = this;
        me.callParent(arguments);
        me.on('select',me.handleSelectionChanged,me);
        me.on('afterrender',me.highlightDates,me);

    },
    
    highlightDates: function(){
        var me = this;
        if(!me.cells)
            return;
        me.cells.each(function(item){
            var date = new Date(item.dom.firstChild.dateValue).toDateString();
            if(me.selectedDates[date]){
                if(item.getAttribute('class').indexOf(me.clsHighlightClass)=== -1){
                    item.addCls(me.clsHighlightClass)
                }
            }else{
                item.removeCls(me.clsHighlightClass);
            }
        })
    },

    handleSelectionChanged: function(cmp, date){
        var me = this;
        if(me.selectedDates[date.toDateString()])
            delete me.selectedDates[date.toDateString()]
        else
            me.selectedDates[date.toDateString()] = date;
        me.highlightDates();
    }
})
```

and the result

[![multiselectable datepicker](images/datepicker.jpg)](http://tpodolak.com/blog/wp-content/uploads/2012/09/extjs-4-1-1-multiselectable-datepicker-as-plugin/datepicker.jpg)

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/ExtjsMultiselectableDatePicker)
