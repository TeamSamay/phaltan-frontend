# SUTRA Mission Control

SUTRA is a mission-control dashboard for monitoring AI-driven human activity recognition and experiment orchestration for BAS field trials.

This repository provides the integration-ready dashboard and operational tooling for the AI engine and backend developed independently on other machines. The system is intended to connect to those services through documented interfaces without replacing their codebases.

## Repository purpose

- `dashboard/` contains the React + TypeScript + Vite mission-control interface.
- `integration/` contains adapters, health checks, and orchestration helpers.
- `docs/` contains integration audit, network setup, runbook, and event flow documentation.
- `tests/` contains simulated integration and end-to-end test coverage.

## Required external repositories

The prompt references two independent repositories:

- AI repository: `https://github.com/REPLACE_WITH_AI_REPOSITORY`
- Backend repository: `https://github.com/REPLACE_WITH_BACKEND_REPOSITORY`

These URLs were not provided in the current workspace, so the implementation here is intentionally adapter-first and contract-aware. The dashboard and tooling are designed to integrate with the real services once those repositories are supplied.

## Run locally

1. Copy `.env.example` to `.env` and configure hosts/ports.
2. Install Node.js 18+ and npm.
3. `cd dashboard` and run `npm install`.
4. `npm run dev -- --host 0.0.0.0`.

## Environment variables

See `.env.example`.

## Documentation

- `docs/INTEGRATION_AUDIT.md`
- `docs/NETWORK_SETUP.md`
- `docs/RUNBOOK.md`
- `docs/EVENT_FLOW.md`

## Important note

This repository does not fabricate AI or backend data. If the external repositories are not available, the dashboard uses clearly labeled mock telemetry, safe fallback states, and explicit `N/A` values where metrics are unavailable.
