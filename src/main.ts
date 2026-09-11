import { App } from 'aws-cdk-lib';
import { AppStack } from './AppStack';
import { configuration } from './Configuration';
import { DomainStack } from './DomainStack';
import { ParametersStack } from './ParametersStack';

const app = new App();

new ParametersStack(app, 'bewindvoerder-issuance-parameters', {
  env: configuration.env,
});

const domainStack = new DomainStack(app, 'bewindvoerder-issuance-domain', {
  env: configuration.env,
  configuration,
});

new AppStack(app, 'bewindvoerder-issuance-app', {
  env: configuration.env,
  apiDomainName: domainStack.apiDomainName,
});

app.synth();
