---
title: "Azure - connecting to Windows 10 virtual machine"
pubDate: 2015-03-11
slug: "azure-connecting-to-windows-10-virtual-machine"
categories: 
  - "azure"
  - "windows-10"
tags: 
  - "azure"
  - "windows-10"
---

Today just a quick tip, which may save you some time. If you want to connect to virtual machine with _Windows 10 Technical Preview_, make sure that you include _DNS_ name in user name field. So instead of default combination of username and password [![Azure](images/failed.png)](http://tpodolak.com/blog/wp-content/uploads/2015/03/azure-connecting-to-windows-10-virtual-machine/failed.png) which worked for me for every virtual machine (except for the one with Windows 10). You should use something like that [![Azure](images/dns.png)](http://tpodolak.com/blog/wp-content/uploads/2015/03/azure-connecting-to-windows-10-virtual-machine/dns.png) If You don't know the _DNS_ name for virtual machine, you can easily check it in _Virtual Machines_ pane [![Azure](images/VirtualMachineList.png)](http://tpodolak.com/blog/wp-content/uploads/2015/03/azure-connecting-to-windows-10-virtual-machine/VirtualMachineList.png)
