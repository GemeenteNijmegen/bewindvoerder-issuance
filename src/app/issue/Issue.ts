import { Duration } from 'aws-cdk-lib';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { Statics } from '../../Statics';
import { applyPageLambdaDefaults, createLambdaLogGroup } from '../PageLambda';
import { IssueCallbackFunction } from './issue-callback-function';
import { IssueStartFunction } from './issue-start-function';

export interface IssueProps {
  httpApi: HttpApi;
  applicationSecrets: ISecret;
  sessionsTable: ITable;
}

export class Issue extends Construct {

  constructor(scope: Construct, id: string, props: IssueProps) {
    super(scope, id);

    const veridConfigRef = StringParameter.fromStringParameterName(this, 'verid-config-ref', Statics.veridConfigParameter);
    const environment = {
      VERID_CONFIG_PARAMETER: Statics.veridConfigParameter,
      APPLICATION_SECRETS_ARN: props.applicationSecrets.secretArn,
      SESSION_TABLE: props.sessionsTable.tableName,
    };

    const startFunction = new IssueStartFunction(this, 'issue-start-function', {
      description: 'Start de Ver.ID machtiging-uitgifte voor bewindvoerder-issuance',
      tracing: Tracing.ACTIVE,
      timeout: Duration.seconds(10),
      memorySize: 256,
      logGroup: createLambdaLogGroup(this, 'issue-start-function'),
      environment,
    });
    applyPageLambdaDefaults(startFunction);
    props.sessionsTable.grantReadWriteData(startFunction);
    props.applicationSecrets.grantRead(startFunction);
    veridConfigRef.grantRead(startFunction);

    const callbackFunction = new IssueCallbackFunction(this, 'issue-callback-function', {
      description: 'Verwerkt de Ver.ID machtiging-uitgifte callback voor bewindvoerder-issuance',
      tracing: Tracing.ACTIVE,
      timeout: Duration.seconds(10),
      memorySize: 256,
      logGroup: createLambdaLogGroup(this, 'issue-callback-function'),
      environment,
    });
    applyPageLambdaDefaults(callbackFunction);
    props.sessionsTable.grantReadWriteData(callbackFunction);
    props.applicationSecrets.grantRead(callbackFunction);
    veridConfigRef.grantRead(callbackFunction);

    props.httpApi.addRoutes({
      path: '/clients/{id}/issue',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('issue-start-integration', startFunction),
    });
    props.httpApi.addRoutes({
      path: '/issuance/callback',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('issue-callback-integration', callbackFunction),
    });
  }
}
