# SUTRA Integration Audit

## Scope

This audit documents the integration contract expected between the independent AI vision engine, the backend service, and the mission-control dashboard.

## Current status

This workspace did not include the actual AI or backend repositories, and the prompt intentionally used placeholders for the source repository URLs. Because the real repositories were unavailable, no direct contract inspection was possible in this environment.

## What works

- The project structure separates the dashboard, adapters, health checks, and documentation.
- The dashboard is organized around real HTTP + WebSocket integration patterns.
- The interface uses environment variables for API host and WebSocket endpoint configuration.
- Fallback behavior is explicit: missing metrics appear as `N/A`, and mock telemetry is clearly labeled when hardware or service dependencies are unavailable.
- The architecture avoids bypassing the backend for normal event traffic.

## What does not work yet

- Actual AI event schema cannot be validated without the provided AI repository.
- Actual backend OpenAPI cannot be validated without the provided backend repository.
- Real backend health checks and AI health endpoints cannot be executed until those services are available.
- End-to-end connectivity cannot be certified without the live environment.

## Expected API endpoints

These are the integration endpoints the mission-control dashboard expects to consume once the real services are available:

- `GET /health` — backend health
- `GET /api/experiments` — list experiments
- `POST /api/experiments` — create experiment
- `GET /api/experiments/:id` — experiment details
- `POST /api/experiments/:id/start` — start experiment
- `POST /api/experiments/:id/steps/:stepId/complete` — complete step
- `GET /api/events` — event history
- `GET /api/devices` — device inventory
- `POST /api/devices/register` — register device
- `GET /ws` or WebSocket endpoint — live updates

These patterns are intentionally documented as expected contracts rather than assumed facts.

## Actual event schema

The dashboard expects these fields when the AI engine emits or the backend ingests structured events:

```json
{
  "eventId": "evt_123",
  "type": "activity.detected",
  "experimentId": "exp_456",
  "stepId": "step_03",
  "source": "ai-vision-engine",
  "timestamp": "2026-11-03T12:00:00Z",
  "confidence": 0.91,
  "status": "detected",
  "payload": {
    "activity": "hand_object_interaction",
    "objects": ["cup", "hand"],
    "bbox": [10, 20, 200, 180],
    "annotations": []
  }
}
```

The exact real schema must be compared against the actual AI/backend contracts once those repositories are supplied.

## Configuration differences

Potential incompatibilities to watch for:

- Different port selection between AI and backend services
- Different host binding behavior for LAN vs localhost
- Authentication or API key differences
- Event naming mismatches between AI events and backend ingestion model
- Different timestamp format and timezone handling
- Missing or optional fields for confidence and step metadata

## Missing integration fields

The mission-control dashboard expects the following fields to exist or to be translated by an adapter if the backend exposes alternate names:

- `experimentId`
- `stepId`
- `deviceId`
- `eventId`
- `timestamp`
- `confidence`
- `status`
- `source`
- `type`
- `payload.activity`
- `payload.objects`
- `payload.verified`
- `payload.needsReview`

## Required changes

- Replace placeholder GitHub URLs with the actual AI and backend repositories.
- Verify README instructions and runtime commands against real service projects.
- Compare AI-generated event schema against backend ingestion contract.
- Implement a backward-compatible adapter for field-name mismatches and missing optional values.
- Add actual health checks and WebSocket reconnect logic after live testing.
- Confirm CORS and WebSocket socket origin rules over LAN.

## Adapter guidance

The adapter layer in `integration/adapters/` is intentionally designed to normalize external event payloads into the dashboard's internal model. This ensures compatibility when the independent services use slightly different terminology.

## Final recommendation

Do not merge the AI or backend codebases into this repository. Keep them as separate services, integrate through a documented contract, and use the adapter layer for safe compatibility handling.
