import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const DOMAIN = 'cjscloud.city';
const SUB = 'app';

const bucketV2 = new aws.s3.BucketV2("bucketV2", {
    bucket: `${SUB}.${DOMAIN}`,
    tags: {
        Name: `${SUB}.${DOMAIN}`,
    }
});
const bAcl = new aws.s3.BucketAclV2("bAcl", {
    bucket: bucketV2.id,
    acl: "private",
});

// ACM SSL Cert for CloudFront Distrbution
const appCertificate = new aws.acm.Certificate("cert", {
    domainName: `${SUB}.${DOMAIN}`,
    tags: {
        Environment: pulumi.getStack(),
    },
    validationMethod: "DNS",
});

// Route53 records
const selected = aws.route53.getZone({
    name: `${DOMAIN}.`,
    privateZone: false,
});

const hostedZoneId = aws.route53.getZone(
    { name: DOMAIN }, 
    { async: true }
).then(zone => zone.zoneId);

const certRecord = new aws.route53.Record("cert", {
    zoneId: selected.then((selected: { zoneId: any; }) => selected.zoneId),
    name: appCertificate.domainValidationOptions[0].resourceRecordName,
    type: appCertificate.domainValidationOptions[0].resourceRecordType,
    ttl: 300,
    records: [appCertificate.domainValidationOptions[0].resourceRecordValue],
});

const certificateValidation = new aws.acm.CertificateValidation("certificateValidation", {
    certificateArn: appCertificate.arn,
    validationRecordFqdns: [certRecord.fqdn],
});

// CloudFront
const oai = new aws.cloudfront.OriginAccessIdentity("example", {
    comment: "Some comment",
});

const s3OriginId = "myS3Origin";
const s3Distribution = new aws.cloudfront.Distribution("s3Distribution", {
    origins: [{
        domainName: bucketV2.bucketRegionalDomainName,
        originId: s3OriginId,
        s3OriginConfig: {
            originAccessIdentity: oai.cloudfrontAccessIdentityPath,
        }
    }],
    enabled: true,
    isIpv6Enabled: true,
    comment: "ESP32 Wifi Config PWA",
    defaultRootObject: "index.html",
    aliases: [
        `${SUB}.${DOMAIN}`,
    ],
    defaultCacheBehavior: {
        allowedMethods: [
            "GET",
            "HEAD",
            "OPTIONS",
        ],
        cachedMethods: [
            "GET",
            "HEAD",
        ],
        targetOriginId: s3OriginId,
        forwardedValues: {
            queryString: false,
            cookies: {
                forward: "none",
            },
        },
        viewerProtocolPolicy: "allow-all",
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
    },
    orderedCacheBehaviors: [
        {
            pathPattern: "/*",
            allowedMethods: [
                "GET",
                "HEAD",
                "OPTIONS",
            ],
            cachedMethods: [
                "GET",
                "HEAD",
            ],
            targetOriginId: s3OriginId,
            forwardedValues: {
                queryString: false,
                cookies: {
                    forward: "none",
                },
            },
            minTtl: 0,
            defaultTtl: 3600,
            maxTtl: 86400,
            compress: true,
            viewerProtocolPolicy: "redirect-to-https",
        },
    ],
    priceClass: "PriceClass_All",
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
    tags: {
        Environment: pulumi.getStack(),
    },
    viewerCertificate: {
        acmCertificateArn: appCertificate.arn,
        cloudfrontDefaultCertificate: false,
        minimumProtocolVersion: 'TLSv1.2_2021',
        sslSupportMethod: 'sni-only'
    },
});

// DNS record for CloudFront distribution
const appRecord = new aws.route53.Record("app", {
    zoneId: hostedZoneId, // selected.then((selected: { zoneId: any; }) => selected.zoneId),
    name: appCertificate.domainValidationOptions[0].domainName, // selected.then((selected: { name: any; }) => `${SUB}.${selected.name}`),
    type: "CNAME",
    ttl: 300,
    records: [s3Distribution.domainName],
});


const s3Policy = aws.iam.getPolicyDocumentOutput({
    statements: [{
        actions: ["s3:GetObject"],
        resources: [
            bucketV2.arn,
            pulumi.interpolate`${bucketV2.arn}/*`,
        ],
        principals: [{
            type: "AWS",
            identifiers: [oai.iamArn],
        }],
    }],
});
const example = new aws.s3.BucketPolicy("example", {
    bucket: bucketV2.id,
    policy: s3Policy.apply(s3Policy => s3Policy.json),
});