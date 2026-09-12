import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import { environmentVariables } from '@gemeentenijmegen/utils';
import { assertIssuanceV1JwtPayload, VeridIssuanceClient } from '@ver-id/node-client';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { VerIdCache } from './verid/VerIdCache';
import { getVerIdClientSecret, getVerIdConfig } from './verid/VerIdConfiguration';
import { logStep } from '../../shared/logStep';
import { Statics } from '../../Statics';

const dynamoDBClient = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(dynamoDBClient);
const logger = new Logger({ serviceName: Statics.projectName });

export async function handler(event: APIGatewayProxyEventV2) {
  logger.info('Issuance-callback ontvangen', {
    path: event.rawPath,
    queryKeys: Object.keys(event.queryStringParameters ?? {}),
  });

  const env = environmentVariables(['SESSION_TABLE']);
  const cookies = event.cookies?.join(';') ?? '';
  const session = new Session(cookies, dynamoDBClient);
  await session.init();
  const clientId = session.getValue('pendingIssuanceClientId');

  if (event.queryStringParameters?.error) {
    logger.info('Ver.ID callback met foutmelding ontvangen', {
      error: event.queryStringParameters.error,
      errorDescription: event.queryStringParameters.error_description,
    });
    return Response.redirect('/?issueError=1');
  }

  try {
    const config = await getVerIdConfig();
    const cache = new VerIdCache(documentClient, env.SESSION_TABLE);
    const issuanceClient = new VeridIssuanceClient({
      issuerUri: config.issuerUri,
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      options: { cacheManager: cache },
    });

    const callbackUrl = new URL(`${config.redirectUri}?${event.rawQueryString}`);
    logger.info('Ver.ID callback ontvangen, start finalize', { callbackUrl: callbackUrl.toString() });

    const clientSecret = await getVerIdClientSecret();
    const issuanceResponse = await logStep(
      logger, 'Ver.ID finalize', { callbackUrl: callbackUrl.toString() },
      () => issuanceClient.finalize({
        callbackParams: callbackUrl,
        clientAuth: { client_secret: clientSecret },
      }),
    );
    logger.info('Ver.ID finalize geslaagd', {
      tokenType: issuanceResponse.token_type,
      scope: issuanceResponse.scope,
      expiresIn: issuanceResponse.expires_in,
    });

    // finalize() slagen is het echte bewijs dat de wallet de machtiging heeft ontvangen.
    // decode() is alleen voor een logregel (wij kennen de mapping toch al, wij zijn de issuer),
    // dus een decode-fout mag de al geslaagde uitgifte niet alsnog als mislukt tonen.
    try {
      const jwt = await issuanceClient.decode(issuanceResponse, assertIssuanceV1JwtPayload);
      logger.info('Ver.ID issuance afgerond', { clientId, uuid: jwt.payload.uuid });
    } catch (decodeErr) {
      logger.warn('Ver.ID decode mislukt na geslaagde finalize, uitgifte is desondanks voltooid', {
        clientId,
        errorMessage: decodeErr instanceof Error ? decodeErr.message : String(decodeErr),
      });
    }

    return Response.redirect(`/?issued=${encodeURIComponent(clientId ?? '')}`);
  } catch (err) {
    logger.error('Ver.ID issuance afronden mislukt', {
      clientId,
      name: err instanceof Error ? err.name : undefined,
      errorMessage: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      type: (err as { type?: string }).type,
      typeDescription: (err as { type_description?: string }).type_description,
    });
    return Response.redirect('/?issueError=1');
  }
}
