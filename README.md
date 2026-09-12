# bewindvoerder-issuance
Fieldlab demo repo om credentials uit te geven aan een bewindvoerder.

`npm ci`
`npx projen build`
Log in gn-mijn-nijmegen-dev-ep in de cli
`npx cdk synth`
`npx cdk list`
`npx cdk deploy bewindvoerder-issuance-parameters`
`npx cdk deploy bewindvoerder-issuance-domain`
`npx cdk deploy bewindvoerder-issuance-app`

Alleen appstack zonder dependencies (exclusively)
`npx cdk deploy bewindvoerder-issuance-app --exclusively --require-approval never`

`npx cdk destroy <stackname>`
Bijv:
`npx cdk destroy bewindvoerder-issuance-app --exclusively`
Domein en params blijven dan staan.
