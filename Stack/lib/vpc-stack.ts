import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { IpAddresses } from 'aws-cdk-lib/aws-ec2';
import { KeyExportOptions } from 'crypto';
import { IConstruct } from 'constructs';
import { CfnResource } from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks'

// import * as sqs from 'aws-cdk-lib/aws-sqs';
declare const vpc: ec2.Vpc;

export class VpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'TheVPC', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      availabilityZones: ["us-east-1a"]
    })
  }
}
