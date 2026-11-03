# SUTRA Network Setup

## Goal

Support local experimentation across multiple laptops on the same Wi-Fi or LAN while keeping localhost support available for single-machine development.

## Host configuration

Example settings:

```env
AI_HOST=192.168.1.101
BACKEND_HOST=192.168.1.102
DASHBOARD_HOST=192.168.1.103
```

Use the actual addresses assigned to each machine on your LAN.

## Required ports

- AI service: `5000` (example)
- Backend API: `8000` (example)
- Backend WebSocket: `8001` (example)
- Dashboard dev server: `5173` (Vite default)

## Firewall guidance

- Allow inbound TCP and WebSocket traffic on the required service ports for the local LAN subnet.
- Keep the system private; do not expose ports to the public internet without explicit authorization.
- On Windows, configure rules in Windows Defender Firewall.
- On Linux, use `ufw` or firewall-cmd with the appropriate subnet allow-list.

## CORS

The backend should allow the dashboard host and LAN subnet origin, e.g.:

```text
http://192.168.1.103:5173
http://localhost:5173
```

## WebSocket over LAN

The WebSocket endpoint must be served with the correct host binding and origin policy.

Recommended patterns:

- `ws://BACKEND_HOST:8001`
- `wss://` only when TLS is configured and authorized

## Localhost mode

For single-machine use:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8001
```

## Deployment note

The final deployment must remain reproducible and explicit. Do not assume the AI, backend, and dashboard run on the same machine.
