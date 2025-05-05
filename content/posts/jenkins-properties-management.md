
---
author: "Maksym Zemlianyi"
title: "Jenkins system properties management without restart"
date: "2025-05-05"
description: "Quick guide how to manage Jenkins system properties without restart"
tags:
- CI/CD
- Jenkins
- Groovy
- Java
---

What can be done if Jenkins already up and running and it's production, and we cannot put it into maintenance mode for restart, but we need to implement some changes for system properties right now? What can be done in some cases, I'll be follow up onto this article
<!--more-->

## How to manage Jenkins System Properties via Script Console 

Most often, engineers encounter problems when the system is already configured and working, but some settings were missed for some reason.

As part of this, we can change some settings directly in the runtime using a console script.

In order to implement certain settings using this approach, you need to go to **Jenkins** => **Manage Jenkins** => **Script Console**

{{< alert type=tip title="TIP: CHECK ALL SYSTEM PROPERTIES BEFORE ANY CHANGES" >}}
Before putting any configuration changes in the runtime, check existing settings. You can check settings that already applied in runtime by following command: `System.getProperties()`
{{< /alert >}}

{{< codeblock lang="groovy">}}
System.getProperties()
{{< /codeblock >}}
</br>

Result should be as following

```groovy
Result: {awt.toolkit=sun.awt.X11.XToolkit, java.specification.version=11, sun.cpu.isalist=, sun.jnu.encoding=UTF-8, java.class.path=/usr/share/jenkins/jenkins.war, pid=...
```

So let's say that we need to configure [Content Security Policy (CSP)](https://www.jenkins.io/doc/book/security/configuring-content-security-policy/) and allow formatted HTML pages to be published, for that we need to uset the header, so we need to execute:

{{< codeblock lang="groovy">}}
System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "")
{{< /codeblock >}}
</br>

After that we can check if settings was really applied by execute `System.getProperties()` and expected result would be:

```groovy
Result: {awt.toolkit=sun.awt.X11.XToolkit, java.specification.version=11, sun.cpu.isalist=, sun.jnu.encoding=UTF-8, java.class.path=/usr/share/jenkins/jenkins.war, hudson.model.DirectoryBrowserSupport.CSP="", pid=... 
```