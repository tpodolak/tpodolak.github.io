---
title: "Resharper - localizable string literals"
published: 2014-08-17T13:17:00.000Z
categories: 
  - "globalization"
  - "localization"
  - "r"
  - "resharper"
tags: 
  - "globalization"
  - "localization"
  - "r"
  - "resharper"
---

Everyone who has ever tried to create multilingual application knows, that this is very tedious task. The most repetitive work is usually moving hard-coded strings to resource files. Fortunately with Resharper this is definitelly less painfull than usuall. 
In order to point out localizable parts of application , it is necessary to decorate classes with `System.ComponentModel.LocalizableAttribute`.

[![LocalizableAttribute](images/LocalizableAttribute.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/resharper-localizable-string-literals/LocalizableAttribute.png)

However, usually we want to localize an entire program, so more universal solution is to set appropriate project configuration in properties window. To bring up this window, select project file and then press `F4` button.

[![PropertiesWindow](images/PropertiesWindow.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/resharper-localizable-string-literals/PropertiesWindow.png)

From now on, Resharper shows warnings indicating that our hard-coded strings might be moved to resource file. Pressing `ALT+ENTER` on these strings will bring up the context menu action, where new option - `Move to resource` is available.

[![MoveToResourceContextAction](images/MoveToResourceContextAction.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/resharper-localizable-string-literals/MoveToResourceContextAction.png)

Choosing this option will bring up the `Move to Resource` window. However if we do not have any resource files in our project, we will get this message.

[![NoResourcesFound](images/NoResourcesFound.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/resharper-localizable-string-literals/NoResourcesFound.png)

In order to create these files, right click on project and choose `Add->New Item`. Now, select `Resource.resx` file and name it for example `LocalizableStrings.resx`.

[![AddingsResource](images/AddingsResource.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/resharper-localizable-string-literals/AddingsResource.png)

In this resource file we will store values for our `default language`. Supporting more languages require us to create additional `LocalizableString` files with appropriate `LETF` tags suffixes.

[![Allfiles](images/Allfiles.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/resharper-localizable-string-literals/Allfiles.png)

Now, we are able to move our hard-coded string to resource files.

[![MoveToResource](images/MoveToResource.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/resharper-localizable-string-literals/MoveToResource.png)
[![aftermove](images/aftermove.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/resharper-localizable-string-literals/aftermove.png)

By default Resharper adds hard-coded strings to default resource file, so we have to specify values for localizable string for other languages. In order to do that, first navigate to resource entry in `LocalizableStrings.resx` file by holding `CTRL` and clicking property `Program_Main_This_is_localizable_string`

[![GoToProperty](images/GoToProperty.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/resharper-localizable-string-literals/GoToProperty.png)

[![overriden](images/overriden.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/resharper-localizable-string-literals/overriden.png)

and then press `ALT+ENTER` and choose `Override 'PropertyName…'`. This operation brings up `Edit Resource` window where You can easily navigate between resource files and update given resource property

[![EditResourceDialog](images/EditResourceDialog.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/resharper-localizable-string-literals/EditResourceDialog.png)

Resharper not only is able to move strings to resource files but also can use existing ones. This basically means that if we use hard-coded string which already has been added to resource file, Resharper will suggest to use predefined resource

[![localizable string](images/useproperty.png)](http://tpodolak.com/blog/wp-content/uploads/2014/08/resharper-localizable-string-literals/useproperty.png)
