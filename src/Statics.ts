export class Statics {

  static readonly projectName = 'bewindvoerder-issuance';

  static readonly accountHostedzoneName = '/gemeente-nijmegen/account/hostedzone/name';
  static readonly accountHostedzoneId = '/gemeente-nijmegen/account/hostedzone/id';

  static readonly applicationSecretsName = `${Statics.projectName}/applicationsecrets`;

  static readonly signicatConfigParameter = `/${Statics.projectName}/signicat/config`;
  static readonly veridConfigParameter = `/${Statics.projectName}/verid/config`;

}
