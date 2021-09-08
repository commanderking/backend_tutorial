type Identity = {
  provider: string;
  access_token: string;
  expires_in: number;
  user_id: string;
  connection: string;
  isSocial: boolean;
};

export type UserInfo = {
  // On Auth0 token we add namespaced attributes including information about user's identity
  // https://auth0.com/docs/configure/apis/scopes/sample-use-cases-scopes-and-claims#add-custom-claims-to-a-token
  "https://parsewise.com/email": string;
  "https://parsewise.com/identities": Identity[];
  iss: string;
  sub: string;
  aud: string[];
  iat: number;
  exp: number;
  azp: string;
  scope: string;
};
