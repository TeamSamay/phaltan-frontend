# SUTRA Runbook

## Required software

- Node.js 18+
- npm or pnpm
- Access to the AI and backend repositories
- A local camera source or recorded sample video

## Quick start

1. Copy `.env.example` to `.env`.
2. Set the AI host, backend host, and dashboard host.
3. Start the AI service on its laptop.
4. Start the backend service on its laptop.
5. Start the dashboard with the project in `dashboard/`.
6. Confirm backend health and AI device registration.
7. Create and start an experiment.
8. Observe live event delivery through the WebSocket.

## Health checks

- AI heartbeat: ensure the vision engine is reporting as online.
- Backend health: verify `GET /health` returns healthy.
- WebSocket connectivity: confirm bidirectional event stream.
- Dashboard data refresh: confirm event-driven updates render automatically.

## Demo sequence

1. Register AI device.
2. Create DEMO experiment.
3. Start experiment.
4. Feed sample video or camera stream.
5. Trigger protocol steps.
6. Observe event history and confidence metrics.
7. Trigger skipped-step deviation.
8. Acknowledge alert if backend supports it.
9. Complete experiment and review timeline.

## Troubleshooting

- If the dashboard cannot reach the backend, verify the `VITE_API_BASE_URL` value.
- If WebSocket fails, confirm the same protocol and port are configured on both sides.
- If the AI service is not registered, confirm the backend allows device registration.
- If event delivery is delayed, review the backend ingestion and queue configuration.
- If metrics are blank, confirm the service exposes those values or use the explicit `N/A` path.
