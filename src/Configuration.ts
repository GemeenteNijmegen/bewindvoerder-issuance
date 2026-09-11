import { Environment } from 'aws-cdk-lib';

export interface Configurable {
  configuration: Configuration;
}

export interface Configuration {
  env: Required<Environment>;
  subdomain: string;
}

export const configuration: Configuration = {
  env: {
    account: '590184009539',
    region: 'eu-central-1',
  },
  subdomain: 'bewindvoerder-issuance',
};
