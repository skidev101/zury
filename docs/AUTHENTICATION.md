# Authentication and Identity

## Philosophy

Authentication identifies the current user. Offline access protects locally
available data. These concerns are intentionally separate.

Signing into Zury should feel like a short consumer onboarding step, not account
administration. Ask for the minimum information required and move quickly into
the student's personal daily briefing.

## Provider

- Better Auth
- Google sign-in as the primary method
- Email and password as the secondary method

Better Auth manages sessions, cookies, OAuth providers and account lifecycle.
Do not implement custom JWT handling or store authentication tokens manually.

## User Flow

```text
Welcome -> Continue with Google -> Today
                  or
          Continue with email
```

- Use "Continue" rather than developer-oriented authorization language.
- Explain why Google is useful without implying that Calendar is connected
  automatically.
- Keep email and password available but visually secondary.
- Preserve the session after refresh using Better Auth's recommended cookies.
- Redirect unauthenticated users from protected screens to sign in.
- Return signed-in users from authentication screens to Today.

## Connected Apps

Identity and connected apps are separate:

- Signing in with Google identifies the user.
- Connecting Google Calendar later grants calendar access.
- Connecting GitHub later grants optional project context.
- Disconnecting an app must never sign the user out of Zury.

The product UI should call these "Connected apps." OAuth, scopes and token
details belong in consent explanations or advanced settings, not the main flow.

## Database

SQLite contains Better Auth-managed authentication tables. Application tables
are introduced only in the phase that owns their feature.

## Environment

```text
DATABASE_URL=./db/zury.sqlite
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Future phases may add model and connected-app credentials when those
capabilities are implemented.

Google Calendar uses a separate OAuth client and callback state. Its credentials
are application data encrypted by the backend, not Better Auth identity tokens.
Calendar connection and disconnection do not change the Better Auth session.
