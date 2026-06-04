declare module "passport-linkedin-oauth2" {
  import { Strategy as OAuth2Strategy } from "passport-oauth2";
  export class Strategy extends OAuth2Strategy {
    constructor(
      options: {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
        scope?: string[];
      },
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: {
          id: string;
          displayName?: string;
          emails?: { value: string }[];
          photos?: { value: string }[];
        },
        done: (error: unknown, user?: unknown) => void
      ) => void
    );
  }
}
