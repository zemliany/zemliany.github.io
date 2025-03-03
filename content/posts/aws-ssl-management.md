
---
author: "Maksym Zemlianyi"
title: "How to upload SSL certificate to IAM or ACM"
date: "2024-04-29"
description: "Quick guide how to check consistency of ssl certificate and upload it to AWS IAM or ACM"
tags:
- Cloud Computing
- AWS
- SSL
- IAM
- ACM
- OpenSSL
---

During the work from time to time we need to upload SSL certificates for Load Balancer to AWS accounts into Amazon Certificate Manager (ACM) or AWS Identity and Access Management (IAM). How to achieve that and on what we need to pay attention, I'll be follow up onto this article
<!--more-->

## How to verify SSL certificate before uploading it to AWS

Before uploading certificate, we need to make sure certificate consistency: when private key match with root certificate, when intermediate chain match root certificate, check end date of certificate and make all data to PEM format. For working with
SSL certificates you should have openssl lib pre-installed in your OS[^1].

Once you have openssl installed on your OS, reporter gives you appropriate SSL certificate stuff, you can verify MD5 hashes of that files to make sure, that private key fit to the root certificate

{{< alert type=tip title="TIP: PRIVATE KEY IS ENCRYPTED" >}}
if you received **private key** as **encrypted**, you can **decrypt** it via openssl tool. So if your key is encrypted, you can decrypt it by following command: `openssl rsa -in encrypted.key -out decrypted.key`
{{< /alert >}}


{{< alert type=tip title="TIP: CHECK SSL VALIDITY FOR DOMAIN FROM CLI" >}}
if you want to check **SSL certificate for validity** that already installed on webserver level, you can use **openssl** tool by special: `openssl s_client -connect` command. Full command example located below
{{< /alert >}}

{{< codeblock lang="bash">}}
openssl s_client -connect {fqdn}:443 </dev/null 2>/dev/null | openssl x509 -inform pem -text
{{< /codeblock >}}
</br>

Get MD5 hash for **private key**:
{{< codeblock lang="bash">}}
openssl rsa -noout -modulus -in server.key | openssl md5
{{< /codeblock >}}

Get MD5 hash for **root certificate**:
{{< codeblock lang="bash">}}
openssl x509 -noout -modulus -in server.crt | openssl md5
{{< /codeblock >}}

by running commands above you should get something like this[^2]:

```bash
> openssl x509 -noout -modulus -in server.crt | openssl md5

66efee91c62456e0559c7b24bd77000f

> openssl rsa -noout -modulus -in server.key | openssl md5

66efee91c62456e0559c7b24bd77000f
```

Then you can verify subject and issuer of root certificate:

{{< codeblock lang="bash">}}
openssl x509 -text -in server.crt | grep -E '(Subject|Issuer):' | sed 's/^ *//g'
{{< /codeblock >}}


by running command above you can get Issuer info for root certificate

```bash
~(root) openssl x509 -text -in server.crt | grep -E '(Subject|Issuer):' | sed 's/^ *//g'

Issuer: C=LT, O=GlobalSign nv-sa, CN=GlobalSign RSA OV SSL CA
Subject: C=US, ST=Illinois, L=Chicago, O=My Company, CN=my.awesome.domain.example.com
```

Then you should check end date of the certificate, to make sure, that they woudn't expire soon(1-2 month)

{{< codeblock lang="bash">}}
openssl x509 -enddate -noout -in server.crt
{{< /codeblock >}}


example of command output:

```bash
> openssl x509 -enddate -noout -in 78ce6c96-ea3d-485b-9d75-abc133b1b434.pem

notAfter=Jun  5 18:16:12 2023 GMT
```

Last stage to verify if intermediate chain fit to root certificate by running command:

{{< codeblock lang="bash">}}
openssl verify -untrusted intermediate.pem server.crt
{{< /codeblock >}}

Should be like this:

```bash
> openssl verify -untrusted OV_SSL_CA_2018_R3.pem server.crt

server.crt: OK
```


In some specific cases Issuer could be differ, so command above could produce some errors, that intermediate chain doesn't match with root certificate.
In that case you should follow download appropriate **CAfile** and **Intermediate chain** and run verify command below:


{{< codeblock lang="bash">}}
openssl verify -CAfile cafile.crt -untrusted intermediate.pem server.crt
{{< /codeblock >}}

As a result you'll get the same outout like described above

```bash
> openssl verify -CAfile cafile.crt -untrusted RootIntermediateCACert.pem server.crt

server.crt: OK
```


Optional stage: save certificate and private key in PEM format

Certificate:

{{< codeblock lang="bash">}}
openssl rsa -in server.key -out server-key.pem -outform PEM
{{< /codeblock >}}

Private Key:

{{< codeblock lang="bash">}}
openssl x509 -in server.crt -out server.pem -outform PEM
{{< /codeblock >}}

## How to upload SSL certificate to AWS IAM

As a first step before uploading new certificate, we need to check if this certificate already exists in IAM. You can do that by using one of these following commands:

{{< codeblock lang="bash">}}
aws iam list-server-certificates --query "ServerCertificateMetadataList[]" | jq '.[] | select(.ServerCertificateName | contains("some.awesome.url.example.com"))'
{{< /codeblock >}}

OR

{{< codeblock lang="bash">}}
aws iam list-server-certificates --query "ServerCertificateMetadataList[]" | jq '.[] | select(.Arn | contains("some.awesome.url.example.com"))'
{{< /codeblock >}}

by using command above you'll get something like this (e.g for `unifiedcommunications.me`):

```bash
> aws iam list-server-certificates --query "ServerCertificateMetadataList[]" | jq '.[] | select(.ServerCertificateName | contains("unifiedcommunications.me"))'
{
  "Path": "/",
  "ServerCertificateName": "unifiedcommunications.me",
  "ServerCertificateId": "ABCDEFGAHJIK09753FD",
  "Arn": "arn:aws:iam::012345678910>:server-certificate/unifiedcommunications.me",
  "UploadDate": "2023-07-12T14:18:57+00:00",
  "Expiration": "2023-11-18T12:16:01+00:00"
}
```

First you should authorize in AWS account by saml2aws. Then you can upload certificate to AWS by using following command and set name for cert

{{< codeblock lang="bash">}}
aws iam upload-server-certificate --server-certificate-name some-url.example.com --certificate-body file://server.pem --private-key file://server-key.pem --certificate-chain file://intermediate.pem
{{< /codeblock >}}

by using command above you'll get something like this:

```bash
{
    "ServerCertificateMetadata": {
        "Path": "/",
        "ServerCertificateName": "some-url.example.com",
        "ServerCertificateId": "ABCDEFGAHJIK1234FDBSD",
        "Arn": "arn:aws:iam::xxxxxxxxxxxx:server-certificate/some-url.example.com",
        "UploadDate": "2022-05-06T14:11:32+00:00",
        "Expiration": "2023-06-05T18:16:12+00:00"
    }
}
```

## How to upload SSL certificate to AWS ACM

ACM is known as AWS Certificate Manager that handles the complexity of creating, storing, and renewing public and private SSL/TLS X.509 certificates and keys that protect your AWS websites and applications. By using ACM instead of IAM you're able to manage SSL certificates on the fly and re-import them if they already exists in ACM, which would update SSL listeners for all LoadBalancers what bind to the particular certificate deployed in ACM.

So, after all necessary checks described above if you're going ACM (or requestor asked for that), firstly you need to check if certificate for target domain already presented in ACM. You can do that by using following command:

{{< codeblock lang="bash">}}
aws acm list-certificates --query "CertificateSummaryList[]" | jq '.[] | select(.DomainName == "some.awesome.url.example.com")'
{{< /codeblock >}}

by using command above you'll get something like this (e.g for `unifiedcommunications.me`):

```bash
> aws acm list-certificates --query "CertificateSummaryList[]" | jq '.[] | select(.DomainName == "unifiedcommunications.me")'
{
  "CertificateArn": "arn:aws:acm:eu-west-1:123456789123:certificate/3dc54c37-5ce5-4f46-aeb9-14228a14fbc5",
  "DomainName": "unifiedcommunications.me",
  "SubjectAlternativeNameSummaries": [
    "unifiedcommunications.me",
    "*.unifiedcommunications.me"
  ],
  "HasAdditionalSubjectAlternativeNames": false,
  "Status": "ISSUED",
  "Type": "IMPORTED",
  "KeyAlgorithm": "RSA-2048",
  "KeyUsages": [
    "DIGITAL_SIGNATURE",
    "KEY_ENCIPHERMENT"
  ],
  "ExtendedKeyUsages": [
    "TLS_WEB_SERVER_AUTHENTICATION",
    "TLS_WEB_CLIENT_AUTHENTICATION"
  ],
  "InUse": true,
  "RenewalEligibility": "INELIGIBLE",
  "NotBefore": "2023-06-06T09:11:29+03:00",
  "NotAfter": "2024-07-07T09:11:28+03:00",
  "CreatedAt": "2019-06-21T11:40:57+03:00",
  "ImportedAt": "2023-06-12T12:01:09.526000+03:00"
}
```

Then if certificate is already exists, what can be checked by command above, you able to re-import certificate with new one by following command:

{{< codeblock lang="bash">}}
aws acm import-certificate --certificate fileb://server.pem --private-key fileb://server-key.pem  --certificate-chain fileb://intermediate.pem --region {region} --certificate-arn {certificate_arn}
{{< /codeblock >}}

for our example, result would be:

```bash
aws acm import-certificate --certificate fileb://server.pem --private-key fileb://server-key.pem  --certificate-chain fileb://intermediate.pem --region eu-west-1 --certificate-arn arn:aws:acm:eu-west-1:123456789123:certificate/3dc54c37-5ce5-4f46-aeb9-14228a14fbc5
```

In case of it will be first upload certificate to ACM for particular domain, because you checked and commands above return to you empty response for target domain what you checked, you can easily import certificate initially for domain, by using following command:

{{< highlight bash >}}
aws acm import-certificate --certificate fileb://server.pem --private-key fileb://server-key.pem  --certificate-chain fileb://intermediate.pem --region eu-west-1
{{</highlight >}}

{{< alert type=info title="INFO" >}}
Please pay attention, that **ACM is regional-depended AWS service** with compare to **IAM**, which means, that you should upload/re-import certificates with pointing out correct **\<region\>**. So if you missed or put wrong region in the `aws-cli` command quite proable when you will try to use certificate ARN what you'll provide after the uploading in their services - it quite probable won't be work for their services, because certificate has been uploaded to wrong region.

{{< /alert >}}

<br/>

{{< alert type=warning title="IMPORTANT" >}}
You cannot install certificates with **4096-bit RSA keys** or **EC keys** on your Elastic Load Balancer (Classic) through integration with **ACM**. You **must** upload certificates with 4096-bit RSA keys or EC keys to IAM in order to use them with your load balancer.

More details: [**SSL/TLS certificates for Classic Load Balancers**](https://docs.aws.amazon.com/elasticloadbalancing/latest/classic/ssl-server-cert.html)
{{< /alert >}}

## Useful On-Topic Links

If you need to verify or determine corrent chain of your certificate, you can use [**WhatsMyChainCert**](https://whatsmychaincert.com/) resource, which quite simple and useful for these purposes


[^1]: How to install openSSL on Linux you can find [**here**](https://www.howtoforge.com/tutorial/how-to-install-openssl-from-source-on-linux/)

[^2]: Pay attention, that hashes is matched. If you'll get different hashes it will be means, that probably private key doesn't match with root certificate, so you cannot upload this files to AWS in that case. You should ask reporter to verify matching between certificate and private key
