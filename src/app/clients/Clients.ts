import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { applyPageLambdaDefaults, createLambdaLogGroup } from '../PageLambda';
import { ClientsFunction } from './clients-function';

export interface ClientsProps {
  httpApi: HttpApi;
  sessionsTable: ITable;
}

export class Clients extends Construct {

  constructor(scope: Construct, id: string, props: ClientsProps) {
    super(scope, id);

    const clientsFunction = new ClientsFunction(this, 'clients-function', {
      description: 'Cliëntenoverzicht voor bewindvoerder-issuance',
      tracing: Tracing.ACTIVE,
      logGroup: createLambdaLogGroup(this, 'clients-function'),
      environment: {
        SESSION_TABLE: props.sessionsTable.tableName,
      },
    });
    applyPageLambdaDefaults(clientsFunction);
    props.sessionsTable.grantReadData(clientsFunction);

    props.httpApi.addRoutes({
      path: '/',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('clients-integration', clientsFunction),
    });
  }
}
