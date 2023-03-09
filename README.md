# CDK-Abstractions-EscapeHatches
CDK Training Material for Abstractions and Escape hatches concepts

## Learning Outcomes

* Understand varying levels of abstraction for CDK constructs
* Understand usage of Escape/Unescape hatches to modify underlying properties otherwise not present in the higher level constructs
* Understand usage of raw overrides to modify a construct's properties

## Abstraction
  
Abstraction is used to hide background details or any unnecessary implementation about the data so that users only see the required information [1].

> A prime example of abstraction is the VPC construct [2]:

    const vpc = new ec2.Vpc(this, 'TheVPC', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      availabilityZones: ["us-east-1a"]
    })

### Levels of Abstraction

* Layer 1 (CloudFormation resource types)
  * Directly represent AWS CloudFormation resources
  * These constructs can be identified via a name beginning with "Cfn," so they are also referred to as "Cfn constructs." 
  * If a resource exists in AWS CloudFormation, it exists in the CDK as a L1 construct.

> Example using CFNVPC construct [3]
```
    const vpc = new ec2.CfnVPC(this, 'TheVPC', {
      attrCidrBlock: IpAddresses.cidr('10.0.0.0/16'),
      enableDnsHostnames: true
    })
```
 
* Layer 2   
  * Define additional supporting resources, such as IAM policies, Amazon SNS topics, or AWS KMS keys. 
  * Provide sensible defaults, best practice security policies, and ergonomic.

> Example using PublicSubnet [4] construct:

```
const publicSubnet = new ec2.PublicSubnet(this, 'MyPublicSubnet', {
  availabilityZone: 'availabilityZone',
  cidrBlock: 'cidrBlock',
  vpcId: 'vpcId',

  // the properties below are optional
  mapPublicIpOnLaunch: false,
});
```

* Layer 3 
  * Define entire collections of AWS resources
  * Help to stand up a build pipeline, an Amazon ECS application, or one of many other types of common deployment scenarios.
  * They are built around a particular approach toward solving the problem.
  * "opinionated."

```
    const vpc = new ec2.Vpc(this, 'TheVPC', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      availabilityZones: ["us-east-1a"]
    })
```

### There's a difficulty with using high level constructs...

* Since higher level constructs are at a higher level of abstraction, some properties otherwise present in a L1 construct (CFN) are most of the time hidden.

> Example Bucket L2 [5] construct vs AWS::S3::Bucket [6]:

```
    const myBucket = new bucket.Bucket(this, 'Bucket', {
      blockPublicAccess: bucket.BlockPublicAccess.BLOCK_ALL,
      encryption: bucket.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
```

### Escape Hatches

Escape hatches allow you to "break out" of the construct model to either move to a lower level of abstraction to access certain properties only visible in the low levels.

If an L2 construct is missing a feature or you're trying to work around an issue, you can modify the L1 construct that's encapsulated by the L2 construct.

```
    const myBucket = new bucket.Bucket(this, 'Bucket', {
      blockPublicAccess: bucket.BlockPublicAccess.BLOCK_ALL,
      encryption: bucket.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
```

The basic approach to get access to the L1 class is to use construct.node.defaultChild (Python: default_child), cast it to the right type (if necessary), and modify its properties. Again, let's take the example of a Bucket.

> TypeCast L2 construct to a L1 Construct CfnBucket [7]

```
    // Node represents the construct node in the scope tree. The `defaultChild` method returns the child construct
    const CfnBucket = myBucket.node.defaultChild as s3.CfnBucket 
    
    CfnBucket.analyticsConfigurations = [
      {
        id: 'Config',
        storageClassAnalysis: {
          dataExport: {
            destination: {
              bucketArn: 'bucketArn',
              format: 'format',
      
              // the properties below are optional
              bucketAccountId: 'bucketAccountId',
              prefix: 'prefix',
            },
            outputSchemaVersion: 'outputSchemaVersion',
          },
        },
      }
    ]
```

### UnEscape Hatches

Provides the capability to go up an abstraction level.

> Most CDK cases are opened with the issue above.

Resources:

[1] What is abstraction - https://www.educative.io/answers/what-is-abstraction-in-programming

[2] VPC - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html

[3] CFNVPC - https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-ec2.CfnVPC.html

[4] PublicSubnet - https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-ec2.PublicSubnet.html

[5] Bucket - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html

[6] AWS::S3::Bucket - https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket.html

[7] CfnBucket - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.CfnBucket.html