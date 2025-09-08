
---
author: "Maksym Zemlianyi"
title: "Jenkins Global Security: verify LDAP credentials before the rotation"
date: "2025-08-05"
description: ""
tags:
- CI/CD
- Jenkins
- Groovy
- Java
- LDAP
---

Quite often, different companies have different security policies, one of which may be the rotation of credentials for accounts that have access to LDAP. This article will shortly guide you how to verify that account really has LDAP access before applying any changes against real configuration
<!--more-->

{{< alert type=info title="INFO" >}}
**BEFORE START**: First of all, please be sure, that for avoid service disruption such like as Jenkins with LDAP config to have ability normally to get access to Jenkins, **my recommendation using two service accounts that you can swap when you need to reset the password of one of them**.

{{< /alert >}}

## LDAP Overview

An open, vendor-neutral, industry-standard application protocol for gaining access to and managing distributed directory information services via an Internet Protocol (IP) network is called Lightweight Directory Access Protocol, or LDAP.  Consider it a phone book for the digital assets of your company. It offers a standardized and centralized method for managing groups, user accounts, and other directory data.

Here's a breakdown of key aspects of **LDAP**:

+ **Directory Service**: **LDAP** is a directory service protocol. A directory service is a database optimized for read-heavy operations, making it ideal for authentication and authorization.

+ **Hierarchical Structure**: **LDAP** directories are organized in a hierarchical, tree-like structure. This structure allows for efficient searching and retrieval of information. The top of the tree is called the root, and entries are organized into organizational units (OUs) and containers.

+ **Entries**: Each entry in an **LDAP** directory represents an object, such as a user, group, computer, or printer. Each entry has a unique **distinguished name (DN)** that identifies its location in the directory tree.

+ **Attributes**: Each entry consists of attributes, which are key-value pairs that describe the object. For example, a user entry might have attributes like **CN (common name)**, **SN (surname)**, **uid (user ID)**, **mail (email address)**, and **memberOf (group memberships)**

+ **Authentication and Authorization**: **LDAP** is commonly used for authentication and authorization. Applications can authenticate users by verifying their credentials against the LDAP directory. Once authenticated, the application can use the user's attributes and group memberships to determine their authorization level.

+ **Standard Protocol**: **LDAP** is a standard protocol, which means that different LDAP servers and clients can interoperate. Popular LDAP server implementations include OpenLDAP, Microsoft Active Directory, and Apache Directory Server.

Benefits of using LDAP:

1. **Centralized User Management:** LDAP provides a central repository for user accounts, simplifying user management and reducing administrative overhead.

2. **Single Sign-On (SSO):** LDAP can be used to implement SSO, allowing users to authenticate once and access multiple applications without re-entering their credentials.

3. **Improved Security:** LDAP can improve security by providing a centralized and secure way to manage user credentials and access control.

4. **Scalability:** LDAP is designed to be scalable, making it suitable for large organizations with many users.

5. **Standardization:** LDAP is a standard protocol, which ensures interoperability between different systems and applications.

## Project-based Matrix Authorization Strategy

**Jenkins** has a strong access control feature called the **Project-based Matrix Authorization Strategy** that lets you specify permissions for individual projects. This implies that you can assign varying degrees of access to various Jenkins projects to particular users or groups. In large organizations, where different teams work on different projects and need different levels of access, this is especially helpful.

Here's a breakdown of key aspects of the **Project-based Matrix Authorization Strategy**:

**Granular Control**: This strategy provides fine-grained control over who can do what within each project. You can specify permissions for individual users or groups for each project.

**Matrix-based**: Permissions are defined in a matrix format, where rows represent users or groups, and columns represent permissions. Each cell in the matrix indicates whether the corresponding user or group has the corresponding permission for that project.

**Project-Specific**: Permissions are defined at the project level, meaning that different projects can have different permission sets. This allows you to tailor access control to the specific needs of each project.

**Inheritance**: Permissions can be inherited from parent folders or global settings. This simplifies administration and ensures consistency across projects.

In a short, the **Project-based Matrix Authorization Strategy** is a versatile and effective access control method that lets you specify permissions for individual projects. It is a useful tool for controlling access to Jenkins projects in businesses of all sizes because it offers granular control, streamlines administration, and improves security.

## Manage LDAP credentials check via Jenkins

As part of the exercise to determine if your 2nd account for swap is capable to perform requests to LDAP, we can utilize some special scrit for **Script Console**.

In order to perform checking for particular account, you need to go to **Jenkins** => **Manage Jenkins** => **Script Console**

{{< codeblock lang="groovy">}}
import jenkins.model.Jenkins
import org.acegisecurity.Authentication
import org.acegisecurity.AuthenticationException
import org.acegisecurity.providers.UsernamePasswordAuthenticationToken

def username = "{ldap-user}" // username/account for LDAP connect
def password = "{ldap-user-password}" // password for username/account for LDAP connect

def realm   = Jenkins.instance.getSecurityRealm()
def manager = realm.getSecurityComponents().manager

def token = new UsernamePasswordAuthenticationToken(username, password)

try {
    Authentication result = manager.authenticate(token)
    if (result?.isAuthenticated()) {
        println "VALID: principal=${result.principal}, authorities=${result.authorities}"
    } else {
        println "INVALID: not authenticated"
    }
} catch (AuthenticationException e) {
    println "INVALID: ${e.class.simpleName}: ${e.message}"
}

{{< /codeblock >}}
</br>

Result will return to you principal information (meta) LDAP user with which you're trying to connect to LDAP to perform lookup of users for auth

```groovy
Result: VALID: principal=org.acegisecurity.userdetails.UserDetails$1@f531092, authorities=[ROLE_XXX_XXX_SERVICE-ACCOUNTS, authenticated, foo-bar-svc-accounts, bar-foo-svc-accounts, ROLE_XXXX-XXXX-SVC-ACCOUNTS, XXX_YYY_Service-Accounts, ROLE_FOO-BAR-SVC-ACCOUNTS]
```