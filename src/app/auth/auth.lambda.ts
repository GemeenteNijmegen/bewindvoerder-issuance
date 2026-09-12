import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http';
import { Session } from '@gemeentenijmegen/session';
import { AWS, environmentVariables } from '@gemeentenijmegen/utils';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { IDToken } from 'openid-client';
import loginTemplate from './login.mustache';
import { htmlResponse } from '../../shared/html';
import { render } from '../../shared/layout/render';
import { logStep } from '../../shared/logStep';
import { OpenIDConnect } from '../../shared/OpenIDConnect';
import { resultPage } from '../../shared/resultPage';
import { Statics } from '../../Statics';

function firstClaim(claims: IDToken, names: string[]): string | undefined {
  for (const name of names) {
    const value = claims[name];
    if (typeof value === 'string') {
      return value;
    }
  }
  return undefined;
}

const eHerkenningKvkNummerClaims = [
  'chamber_of_commerce',
  'organisation_kvknr',
  'eherkenning_intermediate_kvknr',
  'eherkenning_vestigingsnr',
  'urn:etoegang:1.9:EntityConcernedID:KvKnr',
];
const eHerkenningCompanyNameClaims = [
  'organisation',
  'urn:etoegang:1.11:attribute-represented:CompanyName',
];
const signicatScope = 'openid eherkenning-extra eherkenning-complete';
const signicatAcrValues = 'idp:simulator';

const dynamoDBClient = new DynamoDBClient({});
const logger = new Logger({ serviceName: Statics.projectName });
const env = environmentVariables(['SIGNICAT_CONFIG_PARAMETER', 'APPLICATION_SECRETS_ARN', 'REDIRECT_URL']);

let oidc: OpenIDConnect | undefined;

async function initialize() {
  const signicatConfig = JSON.parse(await AWS.getParameter(env.SIGNICAT_CONFIG_PARAMETER));
  const secrets = JSON.parse(await AWS.getSecret(env.APPLICATION_SECRETS_ARN));
  logger.info('Signicat-config geladen', {
    issuer: signicatConfig.issuer,
    clientId: signicatConfig.clientId,
    redirectUrl: env.REDIRECT_URL,
    scope: signicatScope,
    acrValues: signicatAcrValues,
  });
  oidc = new OpenIDConnect({
    issuer: signicatConfig.issuer,
    clientId: signicatConfig.clientId,
    clientSecret: secrets.signicatClientSecret,
    redirectUrl: env.REDIRECT_URL,
  });
}

const init = initialize();

export async function handler(event: APIGatewayProxyEventV2) {
  logger.info('Auth-request ontvangen', {
    path: event.rawPath,
    method: event.queryStringParameters?.method,
    queryKeys: Object.keys(event.queryStringParameters ?? {}),
  });

  try {
    await init;
    if (!oidc) {
      throw new Error('Failed to initialize OpenIDConnect client');
    }

    if (event.rawPath === '/auth') {
      return await handleCallback(event, oidc);
    }
    return await handleLogin(event, oidc);
  } catch (err) {
    logger.error('Authenticatie mislukt', {
      name: err instanceof Error ? err.name : undefined,
      errorMessage: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      type: (err as { type?: string }).type,
      typeDescription: (err as { type_description?: string }).type_description,
    });
    return resultPage('Inloggen mislukt', 'Er ging iets mis bij het inloggen. Probeer het opnieuw.', 500);
  }
}

async function handleLogin(event: APIGatewayProxyEventV2, client: OpenIDConnect) {
  const method = event.queryStringParameters?.method;
  if (method !== 'eherkenning') {
    logger.info('Loginpagina getoond');
    const html = render(loginTemplate, { loginUrl: '/login?method=eherkenning' });
    return htmlResponse(html);
  }

  const cookies = event.cookies?.join(';') ?? '';
  const session = new Session(cookies, dynamoDBClient);
  await session.init();
  logger.info('Sessie geïnitialiseerd voor loginstart', { hadExistingSession: session.sessionId !== false });

  const state = client.generateState();
  const nonce = client.generateState();
  await session.createSession({
    loggedin: { BOOL: false },
    state: { S: state },
    nonce: { S: nonce },
    method: { S: method },
  });
  logger.info('Nieuwe sessie aangemaakt', { method, state, nonce, sessionId: session.sessionId });

  const loginUrl = await client.getLoginUrl(state, signicatScope, { acr_values: signicatAcrValues, nonce, prompt: 'login' });
  logger.info('Signicat-redirect gestart', { loginUrl });
  return Response.redirect(loginUrl, 302, session.getCookie());
}

async function handleCallback(event: APIGatewayProxyEventV2, client: OpenIDConnect) {
  if (event.queryStringParameters?.error) {
    logger.info('Signicat callback met foutmelding ontvangen', {
      error: event.queryStringParameters.error,
      errorDescription: event.queryStringParameters.error_description,
    });
    return Response.redirect('/login');
  }

  const cookies = event.cookies?.join(';') ?? '';
  const session = new Session(cookies, dynamoDBClient);
  await session.init();
  if (session.sessionId === false) {
    logger.info('Callback zonder geldige sessie ontvangen');
    return Response.redirect('/login');
  }

  const state = session.getValue('state');
  const nonce = session.getValue('nonce');
  const fullUrl = new URL(`${env.REDIRECT_URL}?${event.rawQueryString}`);
  logger.info('Callback ontvangen, start code-uitwisseling', {
    sessionId: session.sessionId,
    sessionState: state,
    sessionNonce: nonce,
    fullUrl: fullUrl.toString(),
  });

  const result = await logStep(
    logger, 'Signicat code-uitwisseling', { sessionId: session.sessionId },
    () => client.authorize(fullUrl, state, nonce),
  );
  logger.info('Code-uitwisseling geslaagd', { scopes: result.scopes });
  logger.info('Ontvangen claims', result.claims);

  const kvkNumber = firstClaim(result.claims, eHerkenningKvkNummerClaims);
  if (!kvkNumber) {
    logger.error('Geen KVK-claim in Signicat-response', { claimKeys: Object.keys(result.claims) });
    return Response.redirect('/login');
  }
  const organisationName = firstClaim(result.claims, eHerkenningCompanyNameClaims);
  logger.info('KVK-claim ontvangen', { kvkNumber, organisationName });

  await session.createSession({
    loggedin: { BOOL: true },
    method: { S: 'eherkenning' },
    kvkNumber: { S: kvkNumber },
    ...(organisationName ? { organisationName: { S: organisationName } } : {}),
  });

  logger.info('Signicat login geslaagd', { kvkNumber });
  return Response.redirect('/', 302, session.getCookie());
}
