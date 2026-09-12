import { GemeenteNijmegenCdkApp } from '@gemeentenijmegen/projen-project-type';

const project = new GemeenteNijmegenCdkApp({
  cdkVersion: '2.1.0',
  name: 'bewindvoerder-issuance',
  description: 'Demo app to issue machtigingen to a bewindvoerder. Eherkenning login and choice of clients issues the data through ver.ID. Setup for local deployment.',
  repository: 'https://github.com/GemeenteNijmegen/bewindvoerder-issuance',
  defaultReleaseBranch: 'main',
  projenrcTs: true,
  makeSampleFiles: false,
  release: false,
  depsUpgrade: false,
  enableAutoMergeDependencies: false,
  enableEmergencyProcedure: false,
  enableRepositoryValidation: false,
  auditDeps: true,
  jest: false,
  gitignore: [
    'workdocs/',
  ],
  deps: [
    '@aws-lambda-powertools/logger',
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb',
    '@gemeentenijmegen/apigateway-http',
    '@gemeentenijmegen/design-tokens',
    '@gemeentenijmegen/semantic-html',
    '@gemeentenijmegen/session',
    '@gemeentenijmegen/utils',
    '@utrecht/alert-css',
    '@utrecht/button-css',
    '@utrecht/document-css',
    '@utrecht/heading-1-css',
    '@utrecht/heading-2-css',
    '@utrecht/heading-3-css',
    '@utrecht/link-css',
    '@utrecht/page-body-css',
    '@utrecht/paragraph-css',
    '@ver-id/node-client',
    'mustache',
    'openid-client',
    'zod',
  ],
  devDeps: [
    '@types/aws-lambda',
    '@types/mustache',
    'esbuild',
  ],
  bundlerOptions: {
    loaders: {
      css: 'text',
      mustache: 'text',
    },
  },
  tsconfig: {
    compilerOptions: {
      isolatedModules: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    },
  },
});

project.synth();
