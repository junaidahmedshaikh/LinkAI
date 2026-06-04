import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { env } from "./env";
import { User } from "../models/User.model";
import { authService } from "../services/auth.service";

export function configurePassport(): void {
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: env.GOOGLE_CALLBACK_URL ?? "http://localhost:5000/api/auth/google/callback",
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const user = await authService.findOrCreateOAuthUser({
              provider: "google",
              providerId: profile.id,
              email: profile.emails?.[0]?.value ?? "",
              fullName: profile.displayName ?? "Google User",
              avatar: profile.photos?.[0]?.value,
            });
            done(null, user);
          } catch (error) {
            done(error as Error, undefined);
          }
        }
      )
    );
  }

  if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
    passport.use(
      new LinkedInStrategy(
        {
          clientID: env.LINKEDIN_CLIENT_ID,
          clientSecret: env.LINKEDIN_CLIENT_SECRET,
          callbackURL: env.LINKEDIN_CALLBACK_URL ?? "http://localhost:5000/api/auth/linkedin/callback",
          scope: ["r_emailaddress", "r_liteprofile"],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const user = await authService.findOrCreateOAuthUser({
              provider: "linkedin",
              providerId: profile.id,
              email: profile.emails?.[0]?.value ?? "",
              fullName: profile.displayName ?? "LinkedIn User",
              avatar: profile.photos?.[0]?.value,
            });
            done(null, user);
          } catch (error) {
            done(error as Error, undefined);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => {
    done(null, (user as InstanceType<typeof User>)._id.toString());
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}
