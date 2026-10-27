---
title: "Azure - connecting to Windows 10 virtual machine"
published: 2015-03-11T19:15:00.000Z
categories:
  - "devops"
tags: 
  - "azure"
  - "windows-10"
---

Today just a quick tip, which may save you some time. If you want to connect to virtual machine with `Windows 10 Technical Preview`, make sure that you include `DNS` name in user name field.
So instead of default combination of username and password


[![Azure](images/failed.png)](http://tpodolak.com/blog/wp-content/uploads/2015/03/azure-connecting-to-windows-10-virtual-machine/failed.png)

which worked for me for every virtual machine (except for the one with Windows 10). You should use something like that

[![Azure](images/dns.png)](http://tpodolak.com/blog/wp-content/uploads/2015/03/azure-connecting-to-windows-10-virtual-machine/dns.png)

If You don't know the `DNS` name for virtual machine, you can easily check it in `Virtual Machines` pane

[![Azure](images/VirtualMachineList.png)](http://tpodolak.com/blog/wp-content/uploads/2015/03/azure-connecting-to-windows-10-virtual-machine/VirtualMachineList.png)
