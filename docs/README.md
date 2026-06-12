# CertGen Documentation

Documentation for the GDG PUP Certificate Generator (`cert.gdgpup.org`).

## Product & Design

| Document | Description |
|----------|-------------|
| [PRD](prd.md) | Product requirements — users, goals, user stories, acceptance criteria |
| [SDD](sdd.md) | Software design — architecture, API, services, data model, deployment |
| [Design](design.md) | UI and certificate design system — colors, typography, templates |
| [QA](qa.md) | Manual test cases, release checklist, new-event launch QA |

## Agent & Contributor Guide

| Document | Description |
|----------|-------------|
| [AGENTS.md](../AGENTS.md) | Conventions for AI agents and developers working on this repo |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | PR checklist, local setup, new-event workflow |
| [API: generate-cert](api/generate-cert.md) | Request/response contract for certificate generation |
| [QA](qa.md) | Test plans, release checklist, new-event launch QA |
| [`.cursor/rules/`](../.cursor/rules/) | Cursor agent rules (auto-loaded by file scope) |

## Database (SQL)

SQL scripts live under [`sql/`](sql/README.md):

| Folder | Purpose |
|--------|---------|
| [`sql/migrations/`](sql/migrations/) | DDL — create and alter tables |
| [`sql/seeds/`](sql/seeds/) | Seed data for events and surveys |
| [`sql/schema/`](sql/schema/) | Full database schema snapshots |

**Quick start:** Run migrations first, then seeds. See [sql/README.md](sql/README.md) for order and notes.

## Related Repo Files

| Path | Purpose |
|------|---------|
| [`README.md`](../README.md) | Project overview and getting started |
| [`test/README.md`](../test/README.md) | Local test scripts |
