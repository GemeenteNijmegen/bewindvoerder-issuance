import { randomUUID } from 'crypto';
import * as oidc from 'openid-client';

export interface OpenIDConnectConfiguration {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  clientOptions?: Partial<oidc.ClientMetadata>;
}

export interface OpenIDConnectResult {
  claims: oidc.IDToken;
  scopes: string[];
}

export class OpenIDConnect {

  private readonly configuration: OpenIDConnectConfiguration;
  private oidcConfiguration?: oidc.Configuration;

  constructor(configuration: OpenIDConnectConfiguration) {
    this.configuration = configuration;
  }

  /**
   * Get the login url for the OIDC-provider.
   * @param state a string parameter that gets returned in the auth callback, check it before accepting the login response
   * @param scope requested scope
   * @param additionalOptions extra authorization request parameters, e.g. acr_values
   */
  async getLoginUrl(state: string, scope: string, additionalOptions?: Record<string, string>): Promise<string> {
    const oidcConfiguration = await this.getOidcConfiguration();
    const redirectUrl = this.configuration.redirectUrl;

    const parameters: Record<string, string> = {
      redirect_uri: redirectUrl,
      response_type: 'code',
      scope,
      state,
      ...additionalOptions,
    };
    const authUrl = oidc.buildAuthorizationUrl(oidcConfiguration, parameters);
    return authUrl.toString();
  }

  /**
   * Use the returned code from the OIDC-provider and stored state param to complete the login flow.
   * @param url the requested callback url (includes code and state)
   * @param expectedState the state stored in the session
   * @param expectedNonce the nonce stored in the session, if a nonce was sent with the login request
   */
  async authorize(url: URL, expectedState: string, expectedNonce?: string): Promise<OpenIDConnectResult> {
    const oidcConfiguration = await this.getOidcConfiguration();
    const authorized = await oidc.authorizationCodeGrant(oidcConfiguration, url, {
      expectedState,
      ...(expectedNonce ? { expectedNonce } : {}),
    });

    if (!authorized.access_token) {
      throw new Error('No access token returned from idp');
    }

    const claims = authorized.claims();
    if (!claims || !authorized.scope) {
      throw new Error('No ID token or scope found in idp response');
    }

    return {
      scopes: authorized.scope.split(' '),
      claims,
    };
  }

  generateState() {
    return randomUUID();
  }

  private async getOidcConfiguration(): Promise<oidc.Configuration> {
    if (!this.oidcConfiguration) {
      const issuer = new URL(this.configuration.issuer);
      this.oidcConfiguration = await oidc.discovery(issuer, this.configuration.clientId, {
        client_secret: this.configuration.clientSecret,
        client_id: this.configuration.clientId,
        ...this.configuration.clientOptions,
      });
    }
    return this.oidcConfiguration;
  }

}
