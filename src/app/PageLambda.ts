import { RemovalPolicy } from 'aws-cdk-lib';
import { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Statics } from '../Statics';

export function createLambdaLogGroup(scope: Construct, id: string): LogGroup {
  return new LogGroup(scope, `${id}-log-group`, {
    retention: RetentionDays.FIVE_DAYS,
    removalPolicy: RemovalPolicy.DESTROY,
  });
}

export function applyPageLambdaDefaults(fn: LambdaFunction) {
  fn.addEnvironment('POWERTOOLS_SERVICE_NAME', Statics.projectName);
}
