---
title: "Building a Persian Chatbot with Python and a Free OpenAI-Compatible API"
slug: "en-build-persian-chatbot-python"
translation_key: "build-persian-chatbot-python-free-llm-api"
description: "Step-by-step tutorial for building a Persian CLI chatbot in Python using the OpenAI SDK, a custom Base URL, conversation history management, timeout, and error handling."
primary_keyword: "Persian chatbot Python tutorial"
secondary_keywords:
  - "OpenAI compatible Python chatbot"
  - "free LLM API Python"
  - "Persian AI chatbot"
canonical_target: "https://llm.persiantoolbox.ir/guides/en/en-build-persian-chatbot-python/"
updated_at: "2026-07-18"
status: "READY_FOR_SITE"
---

# Building a Persian Chatbot with Python and a Free OpenAI-Compatible API

In this tutorial, you will build a Persian command-line chatbot that connects to any OpenAI-compatible provider. The API key is not stored in the source code, the conversation history is bounded, and authentication, rate-limit, network, and service errors are handled separately.

This design is not tied to a specific provider. Use the [Free LLM API Catalog](https://llm.persiantoolbox.ir/) and the provider's dedicated page to find a suitable Base URL and Model ID.

## Simple project architecture

1. Settings are read from environment variables.
2. User messages are appended to the conversation history.
3. Only the most recent messages are sent to the API.
4. The model's response is displayed and saved to history.
5. Common errors are handled without leaking sensitive information.

File structure:

```text
persian-chatbot/
├── app.py
├── .env
├── .env.example
├── .gitignore
└── requirements.txt
```

## Prerequisites

- Python 3.10 or later
- API key from an OpenAI-compatible provider
- Correct Base URL
- Active Model ID on your account
- Understanding of the free-tier type and Iran-access status

OpenAI-compatible does not mean every feature is identical. Some providers differ in streaming, tool calling, structured output, or error formats.

## Step 1: Set up the project

```bash
mkdir persian-chatbot
cd persian-chatbot
python -m venv .venv
```

Activate the virtual environment on Linux/macOS:

```bash
source .venv/bin/activate
```

On Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
python -m pip install --upgrade openai python-dotenv
```

`requirements.txt`:

```text
openai
python-dotenv
```

Pin tested versions for production projects.

## Step 2: Configure environment variables

`.env`:

```dotenv
LLM_API_KEY=replace_me
LLM_BASE_URL=https://provider.example/v1
LLM_MODEL=MODEL_ID
```

Get `LLM_BASE_URL` and `LLM_MODEL` from the official documentation and the provider page.

Commit `.env.example` without real credentials:

```dotenv
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
```

`.gitignore`:

```gitignore
.env
.env.*
!.env.example
.venv/
__pycache__/
*.pyc
```

Never commit the API key to source code, screenshots, issues, or public logs.

## Step 3: Implement the chatbot

`app.py`:

```python
import os
from typing import Final

from dotenv import load_dotenv
from openai import (
    APIConnectionError,
    APIStatusError,
    AuthenticationError,
    OpenAI,
    RateLimitError,
)

load_dotenv()

REQUIRED_ENV: Final = ("LLM_API_KEY", "LLM_BASE_URL", "LLM_MODEL")
missing = [name for name in REQUIRED_ENV if not os.getenv(name)]
if missing:
    raise RuntimeError(
        "Missing environment variables: " + ", ".join(missing)
    )

client = OpenAI(
    api_key=os.environ["LLM_API_KEY"],
    base_url=os.environ["LLM_BASE_URL"],
    timeout=30.0,
    max_retries=2,
)

messages = [
    {
        "role": "system",
        "content": (
            "You are a precise Persian assistant. Write responses that are "
            "clear, concise, and avoid unsourced definitive claims."
        ),
    }
]

print("Chatbot ready. Type 'exit' to quit.")

while True:
    user_text = input("You: ").strip()

    if not user_text:
        continue

    if user_text.lower() in {"exit", "quit"}:
        break

    messages.append({"role": "user", "content": user_text})

    try:
        response = client.chat.completions.create(
            model=os.environ["LLM_MODEL"],
            messages=messages[-12:],
            temperature=0.3,
        )

        answer = response.choices[0].message.content
        if not answer:
            answer = "No response received from the model."

        print("Assistant:", answer)
        messages.append({"role": "assistant", "content": answer})

    except AuthenticationError:
        print("Error: Invalid API key or account permissions.")

    except RateLimitError:
        print(
            "Error: Request rate or account quota exceeded. "
            "Try again later."
        )

    except APIConnectionError:
        print("Error: Check network connectivity and LLM_BASE_URL.")

    except APIStatusError as exc:
        print("Service error with status code:", exc.status_code)
```

## Step 4: Run the application

```bash
python app.py
```

Sample interaction:

```text
Chatbot ready. Type 'exit' to quit.
You: Briefly explain the difference between API and SDK.
Assistant: API is the communication contract between software components; SDK is a collection of tools and libraries that simplify using that contract.
```

Response quality depends on the chosen model and provider.

## Why read settings from the environment?

- Secrets are not stored in the repository.
- Switching providers requires no source changes.
- Development and production environments have separate configs.
- Key rotation is simpler.
- CI/CD can inject secrets securely.

Use a platform Secret Manager in production; `.env` files are for local development only.

## Managing conversation history and token usage

The example sends only the last 12 messages:

```python
messages=messages[-12:]
```

This prevents unbounded context growth but is not a complete solution. In production, consider:

- Summarizing old messages
- Estimating token counts
- Separating history by session
- Removing unnecessary messages
- Setting input length limits

Truncating history can discard important context; test summarization quality thoroughly.

## Common error handling

### 401 or Authentication

Common causes:

- Wrong API key
- Expired or revoked key
- Account does not have model access
- Authentication header format incompatible with provider

Do not print the key in error output.

### 404

Usually indicates an incorrect Base URL, API path, or Model ID. Check the difference between:

```text
https://provider.example
https://provider.example/v1
```

Some providers use different endpoint paths or model names.

### 429

Can indicate RPM, RPD, TPM, concurrency, or credit exhaustion. Do not retry immediately and infinitely. Full guide: [Fixing 429 and Rate Limits](https://llm.persiantoolbox.ir/guides/llm-api-rate-limit-429/)

### 5xx errors

Usually transient, but retries should be limited and use backoff. For persistent errors, implement a circuit breaker or switch to a fallback provider.

## Adding streaming

For providers with compatible streaming:

```python
stream = client.chat.completions.create(
    model=os.environ["LLM_MODEL"],
    messages=messages[-12:],
    stream=True,
)

for event in stream:
    text = event.choices[0].delta.content
    if text:
        print(text, end="", flush=True)

print()
```

Verify streaming support and event format before using.

## Converting to an API with FastAPI

For web or mobile apps, place the client logic in a backend service. The API key must never reach the browser or mobile app.

Simple design:

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


@app.post("/chat")
def chat(payload: ChatRequest):
    response = client.chat.completions.create(
        model=os.environ["LLM_MODEL"],
        messages=[{"role": "user", "content": payload.message}],
    )
    return {"answer": response.choices[0].message.content}
```

For production, add:

- User authentication
- Server-side rate limiting
- Request size limits
- Controlled timeout and retry
- Sanitized logging
- Restricted CORS
- Monitoring
- History retention policy

## Prompt security and user data

Before sending data to a provider:

- Remove personal information and secrets.
- Do not send confidential organizational data without authorization.
- Read the provider's data retention policy.
- Take prompt injection seriously in RAG systems.
- Validate model output before executing code or sensitive operations.

Language models are not definitive sources of truth and can produce incorrect responses.

## Switching providers without rewriting code

With this design, only environment variables change:

```dotenv
LLM_API_KEY=new_key
LLM_BASE_URL=https://new-provider.example/v1
LLM_MODEL=new-model-id
```

Before switching, test differences in tool calling, streaming, parameters, and context handling.

## Production readiness checklist

- Secret stored in a secret manager.
- API key absent from frontend code.
- User input validated and bounded.
- Timeout configured.
- Retry is limited.
- Internal rate limiting in place.
- Logs free of private prompts and secrets.
- Fallback provider tested.
- Usage and errors monitored through aggregate metrics.

## Summary

With the OpenAI SDK and a custom Base URL, you can build a swappable client for multiple providers. The most important parts are not just sending requests: secret management, context bounding, error identification, and avoiding tight coupling to a single service.

Use the [provider catalog](https://llm.persiantoolbox.ir/) to find current options and check the last-review date.

If you test a provider from Iran, submit the result without sensitive information in the [Iran Access Report form](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/issues/new?template=iran-access-report.yml).
