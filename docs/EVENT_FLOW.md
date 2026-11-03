# SUTRA Event Flow

```text
Camera
  ↓
AI Vision Engine
  ↓
Structured AI Event
  ↓
Backend Event Ingestion
  ↓
Database / Experiment Engine
  ↓
WebSocket
  ↓
Mission Control Dashboard
```

## Contract requirements

- The AI engine must provide structured events to the backend.
- The backend is the authoritative ingestion layer.
- The dashboard should listen via the documented WebSocket stream rather than directly connecting to the AI service for experiment events.
- Diagnostics may use a direct AI health endpoint when explicitly supported.

## Integration principle

The mission-control dashboard should not bypass the backend for normal experiment data. This preserves consistency, event persistence, and auditability.
