---
title: "Extjs 4.1.1 - multiselectable datepicker as plugin"
published: 2012-09-02T12:32:00.000Z
categories:
  - "web-development"
tags: 
  - "datepicker"
  - "extjs"
---

A couple of weeks ago I wrote a post about creating a mutiselectable datepicker.
The idea of creating this component was to use the object inheritance.
Today, I would like to show how to create a multiselectable datepicker as a plugin to `Ext.date.Picker`.
The code responsible for selecting dates is almost the same, the only thing which must be changed is the component initialization and access to the datepicker component.
In order to make a plugin to any `Ext.Component` class, you must implement the `init` method which takes as argument a reference to the component - so let's change the existing code to meet this requirement.
We need to rename `initComponent` function to `init`.
In addition to, we should delete the `extend` property from our code. After these changes the `init` function looks like this:

```javascript
init:function(datePicker){
        var me = this;
        me.datePicker = datePicker;
        // me.callParent(arguments);
        me.datePicker.on('select',me.handleSelectionChanged,me);
        me.datePicker.on('afterrender',me.higlighDates,me);
}
```

Please notice, that the `init` function takes as an argument the datepicker component - and from now on this is our only way to access this component.
The rest of the code also requires some modifications - it's necessary to change all references to the `datepicker` (from the variable `me` to `me.datePicker`).
The entire code listing is presented below.

```javascript
Ext.define('Multiselect', {
    selectedDates : {},
    clsHigligthClass :'x-datepicker-selected',
    datePicker:null,
    init:function(datePicker){
        var me = this;
        me.datePicker = datePicker;
       // me.callParent(arguments);
        me.datePicker.on('select',me.handleSelectionChanged,me);
        me.datePicker.on('afterrender',me.higlighDates,me);
    },
    
    higlighDates: function(){
        var me = this;
        if(!me.datePicker.cells)
            return;
        me.datePicker.cells.each(function(item){
            var date = new Date(item.dom.firstChild.dateValue).toDateString();
            if(me.selectedDates[date]){
                if(item.getAttribute('class').indexOf(me.clsHigligthClass)=== -1){
                    item.addCls(me.clsHigligthClass)
                }
            }else{
                item.removeCls(me.clsHigligthClass);
            }
        })
    },

    handleSelectionChanged:function(cmp,date){
        var me = this;
        if(me.selectedDates[date.toDateString()])
            delete me.selectedDates[date.toDateString()]
        else
            me.selectedDates[date.toDateString()] = date;
        me.higlighDates();
    }
})
```

Here is example of usage;

```javascript
var picker = Ext.create('Ext.picker.Date', {
                    plugins: [Ext.create('Multiselect')]
                });
```

and the result

[![multiselectable datepicker](images/datepicker.jpg)](http://tpodolak.com/blog/wp-content/uploads/2012/09/extjs-4-1-1-multiselectable-datepicker-as-plugin/datepicker.jpg)

Source code for this post can be found [here](https://github.com/tpodolak/Blog/tree/master/ExtjsMultiselectableDatePickerAsPlugin)
