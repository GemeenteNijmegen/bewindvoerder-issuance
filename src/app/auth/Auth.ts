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
import { AuthFunction } from './auth-function';

export interface AuthProps {
  httpApi: HttpApi;
  hostname: string;
  applicationSecrets: ISecret;
  sessionsTable: ITable;
}

export class Auth extends Construct {

  constructor(scope: Construct, id: string, props: AuthProps) {
    super(scope, id);

    const authFunction = new AuthFunction(this, 'auth-function', {
      description: 'Login en callback voor bewindvoerder-issuance',
      tracing: Tracing.ACTIVE,
      timeout: Duration.seconds(10),
      memorySize: 256,
      logGroup: createLambdaLogGroup(this, 'auth-function'),
      environment: {
        SIGNICAT_CONFIG_PARAMETER: Statics.signicatConfigParameter,
        APPLICATION_SECRETS_ARN: props.applicationSecrets.secretArn,
        REDIRECT_URL: `https://${props.hostname}/auth`,
        SESSION_TABLE: props.sessionsTable.tableName,
      },
    });
    applyPageLambdaDefaults(authFunction);

    props.sessionsTable.grantReadWriteData(authFunction);
    props.applicationSecrets.grantRead(authFunction);
    StringParameter.fromStringParameterName(this, 'signicat-config-ref', Statics.signicatConfigParameter)
      .grantRead(authFunction);

    const integration = new HttpLambdaIntegration('auth-integration', authFunction);
    props.httpApi.addRoutes({
      path: '/login',
      methods: [HttpMethod.GET],
      integration,
    });
    props.httpApi.addRoutes({
      path: '/auth',
      methods: [HttpMethod.GET],
      integration,
    });
  }
}
