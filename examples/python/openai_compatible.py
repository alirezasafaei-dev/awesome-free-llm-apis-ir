#!/usr/bin/env python3
"""Minimal OpenAI-compatible chat example using only Python's standard library."""

import json
import os
import sys
import urllib.error
import urllib.request


PROVIDERS = {
    "openrouter": ("https://openrouter.ai/api/v1/chat/completions", "OPENROUTER_API_KEY", "OPENROUTER_MODEL", "openrouter/free"),
    "groq": ("https://api.groq.com/openai/v1/chat/completions", "GROQ_API_KEY", "GROQ_MODEL", "llama-3.1-8b-instant"),
    "github-models": ("https://models.github.ai/inference/chat/completions", "GITHUB_MODELS_TOKEN", "GITHUB_MODELS_MODEL", "openai/gpt-4.1-mini"),
    "google-gemini": ("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", "GEMINI_API_KEY", "GEMINI_MODEL", "gemini-2.5-flash-lite"),
    "hugging-face-inference": ("https://router.huggingface.co/v1/chat/completions", "HF_TOKEN", "HF_MODEL", "openai/gpt-oss-20b:fastest"),
    "cerebras": ("https://api.cerebras.ai/v1/chat/completions", "CEREBRAS_API_KEY", "CEREBRAS_MODEL", "gpt-oss-120b"),
    "mistral": ("https://api.mistral.ai/v1/chat/completions", "MISTRAL_API_KEY", "MISTRAL_MODEL", "mistral-small-latest"),
    "sambanova": ("https://api.sambanova.ai/v1/chat/completions", "SAMBANOVA_API_KEY", "SAMBANOVA_MODEL", "gpt-oss-120b"),
    "nvidia-nim": ("https://integrate.api.nvidia.com/v1/chat/completions", "NVIDIA_API_KEY", "NVIDIA_MODEL", "meta/llama-3.1-8b-instruct"),
}


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in {*PROVIDERS, "cloudflare-workers-ai"}:
        raise SystemExit(f"Usage: {sys.argv[0]} <provider>\nProviders: {', '.join(sorted([*PROVIDERS, 'cloudflare-workers-ai']))}")

    provider = sys.argv[1]
    if provider == "cloudflare-workers-ai":
        account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
        if not account_id:
            raise SystemExit("Missing CLOUDFLARE_ACCOUNT_ID")
        config = (
            f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions",
            "CLOUDFLARE_API_TOKEN",
            "CLOUDFLARE_MODEL",
            "@cf/meta/llama-3.1-8b-instruct",
        )
    else:
        config = PROVIDERS[provider]

    endpoint, key_name, model_name, default_model = config
    api_key = os.environ.get(key_name)
    if not api_key:
        raise SystemExit(f"Missing {key_name}")

    payload = json.dumps({
        "model": os.environ.get(model_name, default_model),
        "messages": [{"role": "user", "content": "در یک جمله کوتاه سلام کن."}],
        "max_tokens": 64,
        "temperature": 0,
    }).encode()
    request = urllib.request.Request(
        endpoint,
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.load(response)
            print(result["choices"][0]["message"]["content"])
    except urllib.error.HTTPError as error:
        raise SystemExit(f"API request failed with HTTP {error.code}") from None


if __name__ == "__main__":
    main()

