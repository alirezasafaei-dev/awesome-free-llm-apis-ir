#!/usr/bin/env python3
"""Minimal Cohere chat example using only Python's standard library."""

import json
import os
import urllib.error
import urllib.request


api_key = os.environ.get("COHERE_API_KEY")
if not api_key:
    raise SystemExit("Missing COHERE_API_KEY")

payload = json.dumps({
    "model": os.environ.get("COHERE_MODEL", "command-a-03-2025"),
    "messages": [{"role": "user", "content": "در یک جمله کوتاه سلام کن."}],
    "max_tokens": 64,
    "temperature": 0,
}).encode()
request = urllib.request.Request(
    "https://api.cohere.com/v2/chat",
    data=payload,
    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    method="POST",
)

try:
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.load(response)
        print(result["message"]["content"][0]["text"])
except urllib.error.HTTPError as error:
    raise SystemExit(f"API request failed with HTTP {error.code}") from None

