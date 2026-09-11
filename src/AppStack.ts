import { Aspects, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { DomainName, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { Api } from './app/Api';
import { applyPageLambdaDefaults, createLambdaLogGroup } from './app/PageLambda';
import { StatusFunction } from './app/status/status-function';
import { Statics } from './Statics';
import { PermissionsBoundaryAspect } from '@gemeentenijmegen/aws-constructs';

export interface AppStackProps extends StackProps {
  apiDomainName: DomainName;
}

export class AppStack extends Stack {

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);
    Tags.of(this).add('Project', Statics.projectName);
    Aspects.of(this).add(new PermissionsBoundaryAspect());

    this.sessionsTable();

    const api = new Api(this, 'api', {
      apiDomainName: props.apiDomainName,
    });

    const statusFunction = new StatusFunction(this, 'status-function', {
      description: 'Status endpoint voor bewindvoerder-issuance',
      tracing: Tracing.ACTIVE,
      logGroup: createLambdaLogGroup(this, 'status-function'),
    });
    applyPageLambdaDefaults(statusFunction);

    api.httpApi.addRoutes({
      path: '/',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('status-integration', statusFunction),
    });
  }

  // sessionid en ttl zijn vaste namen die @gemeentenijmegen/session verwacht.
  private sessionsTable(): Table {
    return new Table(this, 'sessions', {
      partitionKey: { name: 'sessionid', type: AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
