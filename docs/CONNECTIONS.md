# Connected Apps

## Purpose

Connected apps give Zury permission to use information from external services.
They are separate from authentication and should always feel optional,
understandable and reversible.

The consumer UI uses "Connected apps." Terms such as provider, OAuth, token and
scope are reserved for implementation documentation and consent details.

## Product Principles

- Ask for a connection only when its benefit is clear.
- Explain what Zury will read, what it may change and why.
- Never make a service appear connected before authorization succeeds.
- Let users disconnect without losing their Zury account.
- Keep previously saved information useful offline where policy permits.
- Describe failures in plain language and provide one recovery action.

## Google Calendar

Student benefit:

- See classes and commitments alongside study plans
- Create or update calendar events after confirmation

Permission boundary:

- Read calendar events
- Initial connections used `calendar.readonly`. Conversation-assisted event
  creation now requests `calendar.events`; existing read-only connections must
  reconnect before Zury can add an event.

Implementation flow:

1. The user chooses "Connect calendar."
2. Zury explains the benefit and requested access.
3. The user completes Google consent.
4. The backend exchanges the code and stores credentials securely.
5. The product returns to the relevant student-facing screen.

### Phase 2 implementation

- Calendar authorization uses its own Google client configuration and remains
  separate from Google sign-in.
- Express generates and consumes a short-lived, single-use state value before
  exchanging an authorization code.
- Calendar credentials are encrypted with AES-256-GCM before SQLite storage.
- Successful request-driven refreshes replace the saved event snapshot for the
  requested day. If refresh fails, the latest saved snapshot remains visible.
- The frontend sends an explicit date and IANA timezone; the backend defines the
  requested day in that timezone.

Required backend environment:

```text
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3001/api/calendar/callback
CALENDAR_TOKEN_ENCRYPTION_KEY=
```

Generate the encryption key with `openssl rand -base64 32`. In Google Cloud,
enable Google Calendar API, configure the OAuth consent screen and add the exact
redirect URI above to the Calendar OAuth client.

### Future write boundary

Calendar writes will be introduced as explicit backend commands, separate from
the read service used by Today and Planner. A future Conversation flow may
resolve a student's natural-language request into a typed event command, apply
the student's IANA timezone, request confirmation when needed and then invoke a
write-capable provider through the backend. Write scopes, command validation and
safe completion reporting must be added together; read-only credentials must
never be treated as write-capable, and the browser must never call Google
Calendar directly.

Conversation threads and pending Calendar actions are persisted in SQLite. A
pending action is claimed atomically before a write, so retries and double-clicks
cannot create the same event twice. Structured AI intent output is validated by
the backend before any Calendar read or write is performed.

## GitHub

GitHub is optional project context for students whose coursework uses it. It is
not a primary navigation item and should not shift Zury's identity toward a
developer product.

Student benefit:

- Understand coursework or group-project activity in context
- See relevant pull-request or repository updates when they affect a project

Permission boundary:

- Read repository metadata
- Read commit activity
- Read pull requests

### Read-only implementation

- GitHub connection remains separate from Better Auth and Google sign-in.
- The backend creates and consumes a short-lived, single-use OAuth state.
- Access tokens are encrypted with the same authenticated encryption used for
  connected-app credentials and are never sent to the browser.
- Students choose which course or group-project repositories Zury may use.
- Repository, commit and open pull-request context refreshes only when requested.
  If GitHub cannot be reached, Zury returns the latest saved snapshot with a
  clear saved status.

Required backend environment:

```text
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:3001/api/github/callback
```

Create a GitHub OAuth App with the callback URL above. Zury requests `read:user
repo` so the user can choose repositories visible to their account and read
commit and pull-request activity. No GitHub write operation is implemented.

Implementation flow:

1. The user connects GitHub from Connected apps or a relevant project flow.
2. Zury explains exactly what will be read.
3. The user completes consent.
4. The backend stores credentials securely.
5. Zury shows useful project context, not raw repository analytics.

## User-Facing States

| Internal state | Product language |
| --- | --- |
| Not connected | Connect |
| Connecting | Connecting... |
| Connected | Connected |
| Reauthorization required | Reconnect |
| Refresh failed | Couldn't update just now |

## Offline Behavior

- Existing local information remains available.
- Safe calendar changes wait quietly for connectivity.
- The interface says "Will update when you're online" rather than exposing a
  queue.
- Previously saved project context may remain visible with a clear "Saved for
  offline use" label.
- Restored connectivity updates status without interrupting the student's work.
