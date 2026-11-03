#!/usr/bin/env python3

import json
import os
import sys
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

base_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
endpoint = os.getenv('BACKEND_HEALTH_PATH', '/health')

try:
    req = Request(base_url + endpoint, method='GET')
    with urlopen(req, timeout=10) as response:
        payload = response.read().decode('utf-8')
        status = response.status
        print(json.dumps({
            'status': status,
            'payload': payload,
            'ok': status == 200,
        }))
        sys.exit(0 if status == 200 else 1)
except (HTTPError, URLError, ValueError) as exc:
    print(json.dumps({
        'status': 'error',
        'message': str(exc),
        'ok': False,
    }))
    sys.exit(1)
