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
    '@gemeentenijmegen/apigateway-http',
    '@gemeentenijmegen/session',
    '@gemeentenijmegen/utils',
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
