#!/usr/bin/env python3
"""
SUTRA Backend - FastAPI-Compatible Local Verification Server
Implements SUTRA (SIH26174) Backend specifications:
- Versioned endpoints under /api/v1
- Pagination format: items, total, limit, offset
- Event types: HEARTBEAT, STEP_STARTED, STEP_COMPLETED, DEVIATION_DETECTED, etc.
- Standard Python 3 standard library (no pip dependencies required)

Run:
    python integration/mock_backend.py
"""

import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
import datetime

PORT = 8000

MOCK_EXPERIMENT = {
    "id": "EXP-2417",
    "name": "BAS Wet-Lab Protocol",
    "status": "running",
    "current_step": "Step 03 - Tool transfer",
    "progress": 68,
    "completed_steps": 3,
    "pending_steps": 2,
    "deviation_count": 1,
    "started_at": "2026-11-03T10:12:00Z",
    "updated_at": "2026-11-03T10:15:40Z",
    "ai_status": "healthy",
    "backend_status": "healthy",
    "camera_status": "warning"
}

MOCK_DEVICES = [
    {
        "id": "AI-01",
        "type": "ai",
        "name": "AI Vision Engine",
        "status": "healthy",
        "connection_status": "connected",
        "host": "127.0.0.1",
        "last_heartbeat": "2026-11-03T10:15:39Z",
        "last_event": "STEP_STARTED",
        "health": "Inference nominal"
    },
    {
        "id": "BK-01",
        "type": "backend",
        "name": "FastAPI Backend Service",
        "status": "healthy",
        "connection_status": "connected",
        "host": "127.0.0.1:8000",
        "last_heartbeat": "2026-11-03T10:15:38Z",
        "last_event": "SYSTEM_STATUS",
        "health": "API v1 nominal"
    },
    {
        "id": "CAM-07",
        "type": "camera",
        "name": "Primary Camera Stream",
        "status": "warning",
        "connection_status": "degraded",
        "host": "192.168.1.104",
        "last_heartbeat": "2026-11-03T10:15:03Z",
        "last_event": "CAMERA_RECONNECTED",
        "health": "2 dropped frames"
    }
]

MOCK_EVENTS = [
    {
        "event_id": "evt-1001",
        "type": "STEP_STARTED",
        "experiment_id": "EXP-2417",
        "step_id": "step-3",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "confidence": 0.94,
        "source": "ai-vision-engine",
        "status": "verified",
        "payload": {
            "activity": "hand_object_interaction",
            "objects": ["cup", "hand", "pipette"],
            "confidence": 0.94
        }
    },
    {
        "event_id": "evt-1002",
        "type": "STEP_COMPLETED",
        "experiment_id": "EXP-2417",
        "step_id": "step-2",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "confidence": 0.93,
        "source": "experiment-engine",
        "status": "verified",
        "payload": {
            "transition": "step_2_to_3",
            "action": "specimen placement"
        }
    },
    {
        "event_id": "evt-1003",
        "type": "DEVIATION_DETECTED",
        "experiment_id": "EXP-2417",
        "step_id": "step-4",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "confidence": 0.58,
        "source": "backend",
        "status": "needs_review",
        "payload": {
            "message": "Skipped expected step",
            "reviewRequired": True
        }
    }
]

MOCK_DEVIATIONS = [
    {
        "id": "AL-001",
        "deviation_id": "dev-001",
        "level": "warning",
        "type": "DEVIATION_DETECTED",
        "title": "Skipped step detected",
        "message": "Operator action bypassed expected completed step. Awaiting confirmation.",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "acknowledged": False,
        "experiment_id": "EXP-2417",
        "step_id": "step-4"
    }
]

MOCK_METRICS = {
    "fps": 24,
    "inference_latency_ms": 92,
    "event_delivery_delay_ms": 48,
    "memory_usage_pct": 73,
    "cpu_usage_pct": 62,
    "dropped_frames": 2,
    "event_throughput": 128,
    "backend_health": "Nominal"
}


class FastAPIHandler(BaseHTTPRequestHandler):
    def _send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Device-Token')

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def _send_json(self, data, code=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self._send_cors()
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split('?')[0].rstrip('/')
        if not path:
            path = '/'

        # Health endpoints
        if path in ('/health', '/api/v1/system/status'):
            self._send_json({"status": "healthy", "ok": True, "service": "sutra-backend"})
        elif path == '/api/v1/system/metrics':
            self._send_json(MOCK_METRICS)
        elif path == '/api/v1/system/logs':
            self._send_json({"items": ["System boot complete", "FastAPI routes mounted", "SQLite session initialized"]})
        # Experiment endpoints
        elif path in ('/api/v1/experiments/current', '/experiments/current'):
            self._send_json(MOCK_EXPERIMENT)
        elif path in ('/api/v1/experiments', '/experiments'):
            self._send_json({"items": [MOCK_EXPERIMENT], "total": 1, "limit": 50, "offset": 0})
        # Devices endpoints
        elif path in ('/api/v1/devices', '/devices'):
            self._send_json({"items": MOCK_DEVICES, "total": len(MOCK_DEVICES), "limit": 50, "offset": 0})
        # Events endpoints
        elif path in ('/api/v1/events', '/events'):
            self._send_json({"items": MOCK_EVENTS, "total": len(MOCK_EVENTS), "limit": 50, "offset": 0})
        # Deviations endpoints
        elif path in ('/api/v1/deviations', '/deviations'):
            self._send_json({"items": MOCK_DEVIATIONS, "total": len(MOCK_DEVIATIONS), "limit": 50, "offset": 0})
        else:
            self._send_json({"status": "healthy", "path": path, "ok": True})

    def do_POST(self):
        path = self.path.split('?')[0].rstrip('/')
        if 'acknowledge' in path:
            self._send_json({"ok": True, "acknowledged": True})
        elif 'start' in path:
            self._send_json({"ok": True, "status": "running"})
        elif 'stop' in path:
            self._send_json({"ok": True, "status": "stopped"})
        elif 'heartbeat' in path:
            self._send_json({"ok": True, "status": "acknowledged"})
        elif 'register' in path:
            self._send_json({"ok": True, "device_id": "AI-01", "token": "dev_token_example"})
        else:
            self._send_json({"ok": True})

    def log_message(self, format, *args):
        sys.stderr.write(f"[SUTRA Backend] {self.address_string()} - {format % args}\n")


if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), FastAPIHandler)
    print(f"🚀 SUTRA Backend Mock Server active on http://127.0.0.1:{PORT}")
    print(f"   Health check:        http://127.0.0.1:{PORT}/health")
    print(f"   Current Experiment:  http://127.0.0.1:{PORT}/api/v1/experiments/current")
    print(f"   Devices:             http://127.0.0.1:{PORT}/api/v1/devices")
    print(f"   Events:              http://127.0.0.1:{PORT}/api/v1/events")
    print(f"   Deviations:          http://127.0.0.1:{PORT}/api/v1/deviations")
    print(f"   WebSocket:           ws://127.0.0.1:{PORT}/ws/dashboard")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping SUTRA backend.")
        server.server_close()
