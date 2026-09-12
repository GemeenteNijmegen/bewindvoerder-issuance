import { AWS, environmentVariables } from '@gemeentenijmegen/utils';
import { z } from 'zod';

const configSchema = z.object({
  issuerUri: z.string().min(1),
  clientId: z.string().min(1),
  redirectUri: z.string().min(1),
});

const secretSchema = z.object({
  verIdClientSecret: z.string().min(1),
});

export interface VerIdConfig {
  issuerUri: string;
  clientId: string;
  redirectUri: string;
}

export async function getVerIdConfig(): Promise<VerIdConfig> {
  const env = environmentVariables(['VERID_CONFIG_PARAMETER']);
  const value = await AWS.getParameter(env.VERID_CONFIG_PARAMETER);
  return configSchema.parse(JSON.parse(value));
}

export async function getVerIdClientSecret(): Promise<string> {
  const env = environmentVariables(['APPLICATION_SECRETS_ARN']);
  const value = await AWS.getSecret(env.APPLICATION_SECRETS_ARN);
  return secretSchema.parse(JSON.parse(value)).verIdClientSecret;
}
