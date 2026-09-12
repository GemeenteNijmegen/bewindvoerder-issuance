import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import clientsTemplate from './clients.mustache';
import { findClientById, representedClients } from '../../shared/fixtures/clients';
import { htmlResponse } from '../../shared/html';
import { render } from '../../shared/layout/render';
import { resultPage } from '../../shared/resultPage';
import { Statics } from '../../Statics';

const dynamoDBClient = new DynamoDBClient({});
const logger = new Logger({ serviceName: Statics.projectName });

function buildAlert(event: APIGatewayProxyEventV2): { type: string; role: string; message: string } | undefined {
  const issuedClientId = event.queryStringParameters?.issued;
  if (issuedClientId) {
    const client = findClientById(issuedClientId);
    const name = client ? `${client.initials} ${client.familyName}` : 'De cliënt';
    return { type: 'success', role: 'status', message: `Machtiging voor ${name} is toegevoegd.` };
  }
  if (event.queryStringParameters?.issueError) {
    return {
      type: 'error',
      role: 'alert',
      message: 'Het is niet gelukt om de machtiging uit te geven. Probeer het opnieuw.',
    };
  }
  return undefined;
}

export async function handler(event: APIGatewayProxyEventV2) {
  const cookies = event.cookies?.join(';') ?? '';
  const session = new Session(cookies, dynamoDBClient);
  await session.init();

  if (!session.isLoggedIn()) {
    logger.info('Niet ingelogd, redirect naar login');
    return Response.redirect('/login');
  }

  try {
    const kvkNumber = session.getValue('kvkNumber');
    const organisationName = session.getValue('organisationName');
    const matchingClients = representedClients(organisationName);
    const alert = buildAlert(event);
    logger.info('Cliënten opgehaald', { kvkNumber, clientCount: matchingClients.length, alert });

    const html = render(clientsTemplate, {
      organisationName,
      kvkNumber,
      alert,
      clients: matchingClients.map((client) => ({
        id: client.id,
        displayName: `${client.initials} ${client.familyName}`,
        typeLabel: client.type,
      })),
    });
    return htmlResponse(html);
  } catch (err) {
    logger.error('Cliëntenlijst ophalen mislukt', {
      name: err instanceof Error ? err.name : undefined,
      errorMessage: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return resultPage('Er ging iets mis', 'De cliëntenlijst kon niet worden geladen. Probeer het opnieuw.', 500);
  }
}
