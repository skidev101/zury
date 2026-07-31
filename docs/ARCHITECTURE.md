# Architecture

```text
Next.js 16 consumer experience
             |
        Express API
             |
   Application services
       /           \
Better Auth      Intelligence layer
       \           /
        SQLite + integrations
```

## Boundaries

- The Express backend is the system of record and owns authentication, business
  rules, persistence and external integrations.
- The Next.js frontend communicates only with Express APIs. It never accesses
  SQLite or provider credentials directly.
- SQLite is the local source of truth.
- Google Calendar is a synchronization target, not the product database.
- Intelligence and tool execution are internal capabilities. Their technical
  structure should not determine the consumer navigation or vocabulary.
- External services enrich student-facing concepts such as schedules,
  assignments and projects; they do not become the product's visual identity.
- Calendar routes call a provider-neutral application service. Google SDK types
  and API calls remain isolated to the Google Calendar adapter, while normalized
  event snapshots and encrypted credentials remain backend-owned in SQLite.

## Experience Boundary

The frontend translates technical state into calm consumer language. Internal
terms such as cache, queue, tool, model and provider error belong in logs and
diagnostics, not in primary user flows.
