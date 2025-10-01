
---
author: "Maksym Zemlianyi"
title: "Scale DaemonSet to zero in Kubernetes"
date: "2025-10-01"
description: "Quick guide how to scale-down and back DaemonSet in Kubernetes"
tags:
- Kubernetes (K8s)
- kubectl
- DaemonSet
- Tips&Tricks
---

Sometimes we need to scale-down and up daemonset for debugging or any other purposes. Natively Kubernetes does not allow to do it via standard method using kubectl due to design of DaemonSet itself
<!--more-->

## What is DaemonSet in Kubernetes

Official Kubernetes documentation says: A *DaemonSet* ensures that all (or some) Nodes run a copy of a Pod. **As nodes are added to the cluster**, Pods are added to them. As nodes are removed from the cluster, those Pods are garbage collected. Deleting a DaemonSet will clean up the Pods it created.

So if simplify in Kubernetes, a *DaemonSet* is a special type of workload that ensures a copy of a specific Pod runs on all (or selected) nodes in the cluster, which leads to conclusion that for deployment of *DaemonSet* workload we need to set selector where such workload should be deployed. This means that if we will put dummy nodeSelector for daemonset which does not exists our *DaemonSet* will be scaled-down do 0, because there is no nodes with selector which is not exists

## Managing scale manually of DaemonSet in Kubernetes

Based on the definition of *DaemonSet*, we can get straight-forward understand that we need manage of nodeSelector and put dummy value for it, so we can do something like that:

{{< codeblock lang="bash">}}
kubectl patch daemonset <{daemonset-name}> -p '{"spec": {"template": {"spec": {"nodeSelector": {"dummy-selector-non-exists": "true"}}}}}'
{{< /codeblock >}}

with defining namespace you can use `--namespace (-n)` flag:

{{< codeblock lang="bash">}}
kubectl -n <{namespace-name}> patch daemonset <{daemonset-name}> -p '{"spec": {"template": {"spec": {"nodeSelector": {"dummy-selector-non-exists": "true"}}}}}'
{{< /codeblock >}}

where:

+ `<{daemonset-name}>` - *DaemonSet* name what we want to scale to 0
+ `<{namespace-name}>` - namespace name where *DaemonSet* located

But when we scaling *DaemonSet* to 0, how we can make opposite operation and scale it back? Answer is simple - dummy nodeSelector should be removed.


{{< codeblock lang="bash">}}
kubectl patch daemonset <{daemonset-name}> --type json -p='[{"op": "remove", "path": "/spec/template/spec/nodeSelector/dummy-selector-non-exists"}]'
{{< /codeblock >}}

with defining namespace you can use `--namespace (-n)` flag:

{{< codeblock lang="bash">}}
kubectl -n <{namespace-name}> patch daemonset <{daemonset-name}> --type json -p='[{"op": "remove", "path": "/spec/template/spec/nodeSelector/dummy-selector-non-exists"}]'
{{< /codeblock >}}