# SUTRA Mission Control - Backend Merge Guide

This document outlines everything needed to merge and integrate your incoming backend repository with this frontend dashboard.

---

## 1. Quick Integration Overview

The frontend dashboard is designed to connect seamlessly with any Python (FastAPI / Flask / Django), Node.js, or Go backend service.

- **Vite Proxy Built-in**: All requests to `/api` are automatically proxied to `VITE_API_BASE_URL` (default: `http://localhost:8000`).
- **Flexible Field Normalization**: The dashboard's adapter (`src/services/adapter.ts`) automatically normalizes both **`snake_case`** (e.g. `experiment_id`, `current_step`, `completed_steps`) and **`camelCase`** (`experimentId`, `currentStep`), as well as unwrapping responses formatted as `{ "data": [...] }` or `{ "experiments": [...] }`.
- **Zero-Downtime Fallback**: If the backend is temporarily offline or rebooting, the UI gracefully falls back to demo mode without crashing and automatically re-syncs once the backend is live.

---

## 2. Expected REST Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check endpoint. Returns `{"status": "healthy", "ok": true}`. |
| `GET` | `/api/experiments` | List of experiment runs. |
| `GET` | `/api/experiments/:id` | Detailed state of a specific experiment. |
| `POST` | `/api/experiments/:id/start` | Trigger/resume experiment run. |
| `POST` | `/api/experiments/:id/steps/:stepId/complete` | Complete protocol step. |
| `GET` | `/api/devices` | List of registered devices & hardware nodes. |
| `GET` | `/api/events` | List of recent vision/orchestrator events. |
| `GET` | `/api/alerts` | Active operational deviations & alerts. |
| `POST` | `/api/alerts/:id/acknowledge` | Acknowledge an alert. |
| `GET` | `/api/performance` | System CPU, memory, latency, and FPS statistics. |
| `GET` | `/api/telemetry` | Time-series telemetry points for the chart. |

*(Note: If your backend serves endpoints without the `/api` prefix, the Vite dev proxy handles it automatically).*

---

## 3. Real-Time WebSocket Interface

The dashboard connects to `VITE_WS_URL` (default: `ws://localhost:8001`) with automatic reconnection and exponential backoff.

### Supported Event Types:
1. **Experiment updates**:
   ```json
   {
     "type": "experiment.updated",
     "payload": {
       "id": "EXP-2417",
       "progress": 72,
       "current_step": "Step 04 - Tool transfer"
     }
   }
   ```

2. **Activity recognition events**:
   ```json
   {
     "type": "activity.detected",
     "payload": {
       "eventId": "evt-1004",
       "activity": "tool_transfer",
       "objects": ["pipette", "rack"],
       "confidence": 0.96,
       "timestamp": "2026-11-03T18:30:00Z"
     }
   }
   ```

3. **Device heartbeat / status**:
   ```json
   {
     "type": "device.heartbeat",
     "payload": {
       "id": "CAM-07",
       "status": "healthy",
       "connection_status": "connected",
       "health": "Inference nominal"
     }
   }
   ```

4. **Telemetry data stream**:
   ```json
   {
     "type": "telemetry.tick",
     "payload": {
       "fps": 25,
       "latency": 88,
       "throughput": 132
     }
   }
   ```

---

## 4. How to Merge Incoming Backend Code

### Option A: Monorepo Placement (Recommended)
Place the incoming backend code inside `sutra-mission-control/backend/`:
```text
sutra-mission-control/
  ├── dashboard/        # React + TypeScript + Vite Frontend (White Theme)
  ├── backend/          # <-- Place your incoming backend code here
  ├── integration/      # Health checks & adapters
  └── docs/
```

### Option B: Separate Running Service
Keep the backend in its own directory or repository, and run it on port `8000`:
1. In `sutra-mission-control/dashboard/.env`:
   ```bash
   VITE_API_BASE_URL=http://localhost:8000
   VITE_WS_URL=ws://localhost:8001
   ```
2. Start your backend:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
3. Start the dashboard:
   ```bash
   cd dashboard
   npm run dev
   ```
   The dashboard will automatically detect the backend and switch the top pill to **`Backend: Connected`**!

---

## 5. Testing the Merge Before Real Backend Arrival

A zero-dependency local mock server is included to test end-to-end integration:

```bash
# In one terminal, run the mock backend:
python integration/mock_backend.py

# In another terminal, run the dashboard:
cd dashboard
npm run dev
```

The dashboard will connect immediately to the running server, demonstrating live synchronization.

