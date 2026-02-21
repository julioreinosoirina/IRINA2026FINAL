interface TokenResponse {
  access_token: string;
  error?: string;
  error_description?: string;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  hosted_domain?: string;
  callback: (response: TokenResponse) => void;
}

interface TokenClient {
  requestAccessToken(options?: { prompt?: string }): void;
}

interface OAuth2 {
  initTokenClient(config: TokenClientConfig): TokenClient;
  revoke(token: string, callback: () => void): void;
}

interface Accounts {
  oauth2: OAuth2;
}

interface Google {
  accounts: Accounts;
}

declare global {
  interface Window {
    google: Google;
  }
}

export {};
