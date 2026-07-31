# Implementation

## Build Order

1. Backend foundation and authentication
2. Protected dashboard and daily briefing shell
3. Calendar read and write
4. Offline data and synchronization
5. Guided planning and focused ask experience
6. Study context and notes
7. Optional external project context
8. PWA and interaction polish

Build one trustworthy vertical slice before broadening the feature set.

## Delivery Standard

Every phase must include:

- Complete loading, empty, success and failure states
- Intentional desktop and mobile behavior
- Accessible keyboard and touch interaction
- Plain-language status and errors
- Honest handling of stale or offline information
- No broken placeholders or unfinished controls

## Product Guardrails

- Keep business logic and system-of-record access in the backend.
- Keep model, tool and synchronization details out of normal product UI.
- Use direct controls for common actions; do not require chat for everything.
- Treat integrations as supporting capabilities, not the product's identity.
- Do not optimize visual density to make an early product look more complete.
- Do not add AI, calendar, project context or offline sync before its scheduled
  phase has a reliable foundation.
