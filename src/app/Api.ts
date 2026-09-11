import { DomainName, HttpApi, HttpStage } from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';
import { Statics } from '../Statics';

export interface ApiProps {
  apiDomainName: DomainName;
}

export class Api extends Construct {

  readonly httpApi: HttpApi;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    this.httpApi = new HttpApi(this, 'api', {
      description: `HTTP API for ${Statics.projectName}`,
      disableExecuteApiEndpoint: true,
      createDefaultStage: false,
    });

    new HttpStage(this, 'default-stage', {
      httpApi: this.httpApi,
      stageName: '$default',
      autoDeploy: true,
      domainMapping: {
        domainName: props.apiDomainName,
      },
      throttle: {
        rateLimit: 10,
        burstLimit: 10,
      },
    });
  }
}
