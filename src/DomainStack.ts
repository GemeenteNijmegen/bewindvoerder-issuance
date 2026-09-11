import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { DomainName } from 'aws-cdk-lib/aws-apigatewayv2';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { ARecord, HostedZone, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayv2DomainProperties } from 'aws-cdk-lib/aws-route53-targets';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { Configurable } from './Configuration';
import { Statics } from './Statics';

export interface DomainStackProps extends StackProps, Configurable { }

export class DomainStack extends Stack {

  readonly apiDomainName: DomainName;
  readonly hostname: string;

  constructor(scope: Construct, id: string, props: DomainStackProps) {
    super(scope, id, props);
    Tags.of(this).add('Project', Statics.projectName);

    const zone = this.importHostedZone();
    this.hostname = `${props.configuration.subdomain}.${zone.zoneName}`;

    const certificate = new Certificate(this, 'bewindvoerder-certificate', {
      domainName: this.hostname,
      validation: CertificateValidation.fromDns(zone),
    });

    this.apiDomainName = new DomainName(this, 'bewindvoerder-api-domain', {
      domainName: this.hostname,
      certificate,
    });

    new ARecord(this, 'bewindvoerder-api-domain-alias', {
      zone,
      recordName: props.configuration.subdomain,
      target: RecordTarget.fromAlias(new ApiGatewayv2DomainProperties(
        this.apiDomainName.regionalDomainName,
        this.apiDomainName.regionalHostedZoneId,
      )),
    });
  }

  private importHostedZone(): IHostedZone {
    const hostedZoneId = StringParameter.valueForStringParameter(this, Statics.accountHostedzoneId);
    const zoneName = StringParameter.valueForStringParameter(this, Statics.accountHostedzoneName);
    return HostedZone.fromHostedZoneAttributes(this, 'zone', {
      hostedZoneId,
      zoneName,
    });
  }
}
