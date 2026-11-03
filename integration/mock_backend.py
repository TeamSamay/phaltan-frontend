#!/usr/bin/env python3
"""
SUTRA Mission Control - Local Backend Mock & Integration Verification Server
Zero external dependencies (uses standard python3 library).

Use this to test the dashboard backend integration or verify contracts
before merging the external backend code.

Run:
    python integration/mock_backend.py
"""

import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
import datetime

PORT = 8000

MOCK_EXPERIMENTS = [
    {
        "id": "EXP-2417",
        "name": "BAS Test Run",
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
]

MOCK_DEVICES = [
    {
        "id": "AI-01",
        "type": "ai",
        "name": "AI Vision Engine",
        "status": "healthy",
        "connection_status": "connected",
        "host": "192.168.1.101",
        "last_heartbeat": "2026-11-03T10:15:39Z",
        "last_event": "activity.detected",
        "health": "Inference nominal"
    },
    {
        "id": "BK-01",
        "type": "backend",
        "name": "Backend Service",
        "status": "healthy",
        "connection_status": "connected",
        "host": "192.168.1.102",
        "last_heartbeat": "2026-11-03T10:15:38Z",
        "last_event": "experiment.updated",
        "health": "API nominal"
    },
    {
        "id": "CAM-07",
        "type": "camera",
        "name": "Primary Camera",
        "status": "warning",
        "connection_status": "degraded",
        "host": "192.168.1.104",
        "last_heartbeat": "2026-11-03T10:15:03Z",
        "last_event": "frame_loss",
        "health": "2 dropped frames"
    }
]

MOCK_EVENTS = [
    {
        "eventId": "evt-1001",
        "type": "activity.detected",
        "experimentId": "EXP-2417",
        "stepId": "step-3",
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
        "eventId": "evt-1002",
        "type": "step.transition",
        "experimentId": "EXP-2417",
        "stepId": "step-4",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "confidence": 0.81,
        "source": "experiment-engine",
        "status": "inferred",
        "payload": {
            "transition": "step_3_to_4",
            "action": "tool transfer"
        }
    }
]

MOCK_ALERTS = [
    {
        "id": "AL-001",
        "level": "warning",
        "title": "Skipped step detected",
        "message": "Operator action bypassed expected completed step. Awaiting confirmation.",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "acknowledged": False,
        "experimentId": "EXP-2417",
        "stepId": "step-4"
    }
]

MOCK_PERFORMANCE = {
    "fps": 24,
    "inferenceLatencyMs": 92,
    "eventDeliveryDelayMs": 48,
    "memoryUsagePct": 73,
    "cpuUsagePct": 62,
    "droppedFrames": 2,
    "eventThroughput": 128,
    "backendHealth": "Nominal"
}

MOCK_TELEMETRY = [
    {"name": "00:00", "fps": 24, "latency": 92, "throughput": 126},
    {"name": "00:10", "fps": 25, "latency": 90, "throughput": 129},
    {"name": "00:20", "fps": 24, "latency": 96, "throughput": 124},
    {"name": "00:30", "fps": 23, "latency": 104, "throughput": 119},
    {"name": "00:40", "fps": 22, "latency": 112, "throughput": 118},
    {"name": "00:50", "fps": 24, "latency": 94, "throughput": 124}
]


class Handler(BaseHTTPRequestHandler):
    def _send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')

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

        # Remove /api prefix if present
        clean_path = path[4:] if path.startswith('/api') else path

        if clean_path in ('/health', '/api/health', ''):
            self._send_json({"status": "healthy", "ok": True})
        elif clean_path == '/experiments':
            self._send_json({"experiments": MOCK_EXPERIMENTS})
        elif clean_path.startswith('/experiments/'):
            exp_id = clean_path.split('/')[-1]
            found = next((e for e in MOCK_EXPERIMENTS if e["id"] == exp_id), MOCK_EXPERIMENTS[0])
            self._send_json(found)
        elif clean_path == '/devices':
            self._send_json({"devices": MOCK_DEVICES})
        elif clean_path == '/events':
            self._send_json({"events": MOCK_EVENTS})
        elif clean_path == '/alerts':
            self._send_json({"alerts": MOCK_ALERTS})
        elif clean_path == '/performance':
            self._send_json(MOCK_PERFORMANCE)
        elif clean_path == '/telemetry':
            self._send_json({"telemetry": MOCK_TELEMETRY})
        else:
            self._send_json({"status": "healthy", "path": path, "ok": True})

    def do_POST(self):
        clean_path = self.path.split('?')[0].rstrip('/')
        if clean_path.startswith('/api'):
            clean_path = clean_path[4:]

        if '/acknowledge' in clean_path:
            self._send_json({"ok": True, "acknowledged": True})
        elif '/start' in clean_path:
            self._send_json({"ok": True, "status": "running"})
        elif '/complete' in clean_path:
            self._send_json({"ok": True, "status": "completed"})
        else:
            self._send_json({"ok": True})

    def log_message(self, format, *args):
        # Concise logging
        sys.stderr.write(f"[Mock Backend] {self.address_string()} - {format % args}\n")


if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), Handler)
    print(f"🚀 SUTRA Mission Control Mock Backend active on http://0.0.0.0:{PORT}")
    print(f"   Health check: http://localhost:{PORT}/health")
    print(f"   Experiments:  http://localhost:{PORT}/api/experiments")
    print(f"   Devices:      http://localhost:{PORT}/api/devices")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping mock backend.")
        server.server_close()

