import { Aspects, SecretValue, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { Statics } from './Statics';
import { PermissionsBoundaryAspect } from '@gemeentenijmegen/aws-constructs';

export class ParametersStack extends Stack {

  readonly applicationSecrets: ISecret;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    Aspects.of(this).add(new PermissionsBoundaryAspect());
    Tags.of(this).add('Project', Statics.projectName);

    this.applicationSecrets = new Secret(this, 'bewindvoerder-application-secrets', {
      secretName: Statics.applicationSecretsName,
      description: 'Bewindvoerder. Secrets voor bewindvoerder-issuance (JSON: signicatClientSecret, verIdClientSecret), handmatig in te vullen na deploy',
      secretObjectValue: {
        signicatClientSecret: SecretValue.unsafePlainText(''), // Voor demo prima om zo samen te zetten, scheelt weer kosten
        verIdClientSecret: SecretValue.unsafePlainText(''),
      },
    });

    new StringParameter(this, 'bewindvoerder-signicat-config', {
      parameterName: Statics.signicatConfigParameter,
      description: `Bewindvoerder. Signicat OIDC configuratie voor bewindvoerder-issuance, handmatig in te vullen na deploy
                    Kan gemakkelijk in param gewijzigd worden indien nodig`,
      stringValue: JSON.stringify({ issuer: '', clientId: '' }),
    });

    new StringParameter(this, 'bewindvoerder-verid-config', {
      parameterName: Statics.veridConfigParameter,
      description: `Bewindvoerder. Ver.ID OAuth configuratie voor bewindvoerder-issuance.
                    Kan gemakkelijk in param gewijzigd worden indien nodig`,
      stringValue: JSON.stringify({
        issuerUri: '',
        clientId: '',
        redirectUri: '',
      }),
    });
  }
}
