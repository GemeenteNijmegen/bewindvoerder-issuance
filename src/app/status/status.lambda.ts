import { Logger } from '@aws-lambda-powertools/logger';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Context } from 'aws-lambda';
import { Statics } from '../../Statics';

const logger = new Logger({ serviceName: Statics.projectName });

export async function handler(_event: unknown, context: Context) {
  logger.addContext(context);
  try {
    logger.info('Statusroute opgevraagd');
    return Response.ok(200, 'bewindvoerder-issuance: de infrastructuurbasis werkt.');
  } finally {
    logger.resetKeys();
  }
}
