# FLAGS

Improvement register for this repository. Documentation handover only - do not treat Open rows as bugs fixed in the docs PR.

Status: **Open** (actionable later) or **Accepted** (known limitation).

| ID | Severity | Finding | Evidence | Suggested next step | Status |
| --- | --- | --- | --- | --- | --- |
| F1 | High | `ADMIN_PASSWORD` defaults to `admin` if unset. Unsafe if production env omits the variable. | [docs/state.md](docs/state.md) env table; [AGENTS.md](AGENTS.md) Environment Variables | Require `ADMIN_PASSWORD` in production (Vercel); rotate if ever deployed with default. | Open |
| F2 | Medium | In-memory rate limiting on generate-cert remains commented out. | [docs/state.md](docs/state.md) Ops notes; [AGENTS.md](AGENTS.md) Security Notes | Re-enable durable rate limiting (or edge/WAF) before high-traffic events. | Open |
| F3 | Low | `docs/sql/schema/full-schema.sql` is a stale / non-authoritative platform snapshot (missing live `cert_config` truth). | [docs/state.md](docs/state.md) SQL section; [docs/README.md](docs/README.md) Known stale areas | Prefer migrations + live Supabase; refresh or demote schema snapshot. | Open |
