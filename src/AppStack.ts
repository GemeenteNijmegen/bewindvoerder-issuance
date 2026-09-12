import { PermissionsBoundaryAspect } from '@gemeentenijmegen/aws-constructs';
import { Aspects, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { DomainName } from 'aws-cdk-lib/aws-apigatewayv2';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { Api } from './app/Api';
import { Auth } from './app/auth/Auth';
import { Clients } from './app/clients/Clients';
import { Issue } from './app/issue/Issue';
import { Statics } from './Statics';

export interface AppStackProps extends StackProps {
  apiDomainName: DomainName;
  hostname: string;
  applicationSecrets: ISecret;
}

export class AppStack extends Stack {

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);
    Tags.of(this).add('Project', Statics.projectName);
    Aspects.of(this).add(new PermissionsBoundaryAspect());

    const sessionsTable = this.sessionsTable();

    const api = new Api(this, 'api', {
      apiDomainName: props.apiDomainName,
    });

    new Clients(this, 'clients', {
      httpApi: api.httpApi,
      sessionsTable,
    });

    new Auth(this, 'auth', {
      httpApi: api.httpApi,
      hostname: props.hostname,
      applicationSecrets: props.applicationSecrets,
      sessionsTable,
    });

    new Issue(this, 'issue', {
      httpApi: api.httpApi,
      applicationSecrets: props.applicationSecrets,
      sessionsTable,
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
