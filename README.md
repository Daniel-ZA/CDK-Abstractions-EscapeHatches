# CDK-Abstractions-EscapeHatches
CDK Training Material for Abstractions and Escape hatches concepts

## Learning Outcomes

* Illustrate varying levels of abstraction for CDK constructs
* Apply usage of Escape/Unescape hatches to modify underlying properties otherwise not present in the higher level constructs
* Demonstrate usage of raw overrides to modify a construct's properties

## Prerequisites:

* Setup VSCode or IDE for deploying CDK
* Recommended: Installing CDK Snippets extension in VsCode (if you have)
* Clone this repository
* CDK Version 2.60.0 
  
> Note: The stack in the example below uses the `2.60.0` CDK library version, if you have a version different than this, you can install `npx` with `npm install -g npx`. Once installed you can run a local CLI 2.60.0 version for this project by prefixing the cdk commands with `npx aws-cdk@2.60.0` without changing the global version of your CDK CLI. If you wish to change it globally anyways just run `npm install -g aws-cdk@2.60.0`. For more information regarding the installation check [here](https://docs.aws.amazon.com/cdk/v2/guide/cli.html).

## Abstraction
  
[Abstraction](https://www.educative.io/answers/what-is-abstraction-in-programming) is used to hide background details or any unnecessary implementation about the data so that users only see the required information.

> A prime example of abstraction is the [VPC](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html) construct:

    const vpc = new ec2.Vpc(this, 'TheVPC', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      availabilityZones: ["us-east-1a"]
    })

### Levels of Abstraction

* Level 1 (CloudFormation resource types)
  * Directly represent AWS CloudFormation resources
  * These constructs can be identified via a name beginning with "Cfn," so they are also referred to as "Cfn constructs." 
  * If a resource exists in AWS CloudFormation, it exists in the CDK as a L1 construct.

> Example using [CfnVPC](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-ec2.CfnVPC.html) construct. Equivalent to [AWS::EC2::VPC](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-vpc.html) resource type.
```
    const vpc = new ec2.CfnVPC(this, 'TheVPC', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true
    })
```
 
* Level 2   
  * Define additional supporting resources, such as IAM policies, Amazon SNS topics, or AWS KMS keys. 
  * Provide sensible defaults, best practice security policies, and ergonomic.

> Example using [PublicSubnet](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-ec2.PublicSubnet.html) construct:

```
    const publicSubnet = new ec2.PublicSubnet(this, 'MyPublicSubnet', {
      availabilityZone: 'us-east-1a',
      cidrBlock: '10.0.0.0/24',
      vpcId: 'vpc-0623fb81d9e354694',
    });
```

* Level 3 
  * Define entire collections of AWS resources or an architecture for us.
  * Help to stand up a build pipeline, an Amazon ECS application, or one of many other types of common deployment scenarios.
  * They are built around a particular approach toward solving the problem.
  * "opinionated."

```
    const vpc = new ec2.Vpc(this, 'TheVPC', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      availabilityZones: ["us-east-1a"]
    })
```

#### Finding children of a L2/L3 construct:

> Iterate through Children constructs of L3 VPC (L2 and L1) using the construct's [Node](https://docs.aws.amazon.com/cdk/api/v2/docs/constructs.Node.html) property.

```
    // Iterate through Children constructs of L3 VPC

    for (const child in vpc.node.findAll()) {
        const obj = vpc.node.findAll()[child].node.id
        console.log(obj)
    }

```

> Iterate through Children constructs of L2 PublicSubnet (L2 and L1)

```
    // Iterate through Children constructs of L2 Public Subnet

    // Need to Find the PublicSubnet Child first
    const l2PublicSubnet = vpc.node.findChild('PublicSubnet1')

    for (const child in l2PublicSubnet.node.findAll()) {
      const obj = l2PublicSubnet.node.findAll()[child].node.id
      console.log(obj)
    }
```

### There's a difficulty with using high level constructs...

* Since higher level constructs are at a higher level of abstraction, some properties otherwise present in a L1 construct (CFN) are in most cases hidden.

> Example [Bucket L2 ](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html) construct vs [AWS::S3::Bucket](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket.html) Or [CfnBucket](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.CfnBucket.html):

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

The basic approach to get access to the L1 class is to use [construct.node.defaultChild](https://docs.aws.amazon.com/cdk/api/v2/docs/constructs.Node.html#findwbrallorder) (Python: default_child), cast it to the right type (if necessary), and modify its properties. Again, let's take the example of a Bucket.

> TypeCast L2 construct to a L1 Construct [CfnBucket](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.CfnBucket.html)

```
    // Node represents the construct node in the scope tree. The `defaultChild` method returns the child construct
    const CfnBucket = myBucket.node.defaultChild as bucket.CfnBucket 
    
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

> Note: The as keyword is a Type Assertion in TypeScript which tells the compiler to consider the object as another type than the type the compiler infers the object to be.

### VPC Example:

> Use case: I want to modify the CIDR block for a route in a public subnet, how can I do that?

```
    // Find child "PublicSubnet1" first
    const L2PublicSubnet = vpc.node.findChild("PublicSubnet1")

    // Find child L1 route of Public Subnet
    var L1Route = L2PublicSubnet.node.findChild("DefaultRoute") as ec2.CfnRoute

    L1Route.destinationCidrBlock = '1.0.0.0/0'
```

> L3 VPC -> L2 PublicSubnet -> L3 [CfnRoute](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-ec2.CfnRoute.html) OR [AWS::EC2::Route](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-route.html
)

### UnEscape Hatches

* Provides the capability to go up an abstraction level.
* Helpful when you want to use convenience methods like .addObjectCreatedNotification() that aren't available on the L1 construct.

```
    const CfnBucket = new s3.CfnBucket(this, 'MyBucket', {
    })

    const l2Bucket = s3.Bucket.fromCfnBucket(CfnBucket)

    l2Bucket.addObjectCreatedNotification(...)
```

### Raw overrides

* If there are properties that are missing from the L1 construct, you can bypass all typing using raw overrides. This also makes it possible to delete synthesized properties.

> Using previous example of modifying L1 Route

```
    // Find child "PublicSubnet1" first
    const L2PublicSubnet = vpc.node.findChild("PublicSubnet1")

    // Find child L1 route of Public Subnet
    var L1Route = L2PublicSubnet.node.findChild("DefaultRoute") as ec2.CfnRoute

    // Using Raw override to override property.
    L1Route.addPropertyOverride('DestinationCidrBlock', '2.0.0.0/0')

    OR

    // Using Raw override to override property using `addOverride`
    L1Route.addOverride('Property.DestinationCidrBlock', '2.0.0.0/0')

    // Delete Route
    L1Route.addPropertyDeletionOverride('DestinationCidrBlock')
```

> Note: using `addPropertyOverride` you don't have to specify the 'Property'.

&nbsp;

**Most concepts and definitions above are taken from the official AWS [Abstractions and escape hatches](https://docs.aws.amazon.com/cdk/v2/guide/cfn_layer.html) documentation.**


## Helpful Resources

* [What are Constructs in AWS CDK - Complete Guide](https://bobbyhadz.com/blog/cdk-constructs-tutorial)
* [How to use escape hatches in AWS CDK](https://bobbyhadz.com/blog/escape-hatch-aws-cdk)

## Learning Outcomes

* Illustrate varying levels of abstraction for CDK constructs
* Apply usage of Escape/Unescape hatches to modify underlying properties otherwise not present in the higher level constructs
* Demonstrate usage of raw overrides to modify a construct's properties

## Survey

https://survey.fieldsense.whs.amazon.dev/survey/d9fad38f-b467-4b12-8e24-6a2862475722

Resources:

[1] What is abstraction - https://www.educative.io/answers/what-is-abstraction-in-programming

[2] VPC - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html

[3] CFNVPC - https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-ec2.CfnVPC.html

[4] PublicSubnet - https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-ec2.PublicSubnet.html

[5] Bucket - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html

[6] AWS::S3::Bucket - https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket.html

[7] CfnBucket - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.CfnBucket.html
