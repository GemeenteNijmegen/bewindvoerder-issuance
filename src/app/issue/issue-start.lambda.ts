import { randomUUID } from 'crypto';
import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import { environmentVariables } from '@gemeentenijmegen/utils';
import { VeridIssuanceClient } from '@ver-id/node-client';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { VerIdCache } from './verid/VerIdCache';
import { getVerIdClientSecret, getVerIdConfig } from './verid/VerIdConfiguration';
import { findClientById, standardScopes } from '../../shared/fixtures/clients';
import { logStep } from '../../shared/logStep';
import { resultPage } from '../../shared/resultPage';
import { Statics } from '../../Statics';

const dynamoDBClient = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(dynamoDBClient);
const logger = new Logger({ serviceName: Statics.projectName });

export async function handler(event: APIGatewayProxyEventV2) {
  const clientId = event.pathParameters?.id;
  logger.info('Issuance-request ontvangen', { path: event.rawPath, clientId });

  const env = environmentVariables(['SESSION_TABLE']);
  const cookies = event.cookies?.join(';') ?? '';
  const session = new Session(cookies, dynamoDBClient);
  await session.init();

  if (!session.isLoggedIn()) {
    logger.info('Niet ingelogd, redirect naar login', { clientId });
    return Response.redirect('/login');
  }

  const client = clientId ? findClientById(clientId) : undefined;
  const kvkNumber = session.getValue('kvkNumber');

  if (!client) {
    logger.error('Onbekende cliënt', { clientId });
    return Response.redirect('/');
  }

  await session.setValue('pendingIssuanceClientId', client.id);

  try {
    const organisationName = session.getValue('organisationName');
    const scopes = client.scopes ?? standardScopes;
    const identifier = randomUUID();

    const config = await getVerIdConfig();
    const cache = new VerIdCache(documentClient, env.SESSION_TABLE);
    const issuanceClient = new VeridIssuanceClient({
      issuerUri: config.issuerUri,
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      options: { cacheManager: cache },
    });

    const { codeChallenge, state } = await logStep(
      logger, 'Ver.ID code challenge genereren', { clientId, identifier },
      () => issuanceClient.generateCodeChallenge(),
    );
    logger.info('Ver.ID code challenge gegenereerd', { clientId, identifier, state, codeChallenge });

    const clientSecret = await getVerIdClientSecret();
    const mapping = {
      machtiging_identifier: identifier,
      machtiging_representedBsn: client.bsn,
      machtiging_representedFamilyName: client.familyName,
      machtiging_representedInitials: client.initials,
      machtiging_type: client.type,
      machtiging_scopes: scopes,
      machtiging_representativeKvkNumber: kvkNumber,
      machtiging_representativeName: organisationName,
    };
    logger.info('Ver.ID issuance-intent aanmaken', { clientId, identifier, mappingKeys: Object.keys(mapping) });

    const { intent_id: intentId, issuance_run_uuid: issuanceRunUuid } = await logStep(
      logger, 'Ver.ID issuance-intent aanmaken', { clientId, identifier },
      () => issuanceClient.createIssuanceIntent({ payload: { mapping } }, codeChallenge, { client_secret: clientSecret }),
    );
    logger.info('Ver.ID issuance-intent aangemaakt', { clientId, identifier, intentId, issuanceRunUuid });

    const { issuanceUrl } = await logStep(
      logger, 'Ver.ID issuance-url genereren', { clientId, identifier, intentId },
      () => issuanceClient.generateIssuanceUrl({ intentId, state, codeChallenge }),
    );
    logger.info('Ver.ID issuance gestart', { clientId, identifier, intentId, issuanceUrl });

    return Response.redirect(issuanceUrl);
  } catch (err) {
    logger.error('Issuance starten mislukt', {
      clientId,
      name: err instanceof Error ? err.name : undefined,
      errorMessage: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      type: (err as { type?: string }).type,
      typeDescription: (err as { type_description?: string }).type_description,
    });
    return resultPage(
      'Machtiging niet gelukt',
      'Het is niet gelukt om de uitgifte te starten. Probeer het opnieuw.',
      500,
    );
  }
}
