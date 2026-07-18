---
title: "Using a Free LLM API in Node.js with a Custom Base URL"
slug: "en-use-free-llm-api-nodejs"
translation_key: "use-free-llm-api-nodejs"
description: "Practical tutorial for connecting Node.js to OpenAI-compatible free LLM APIs, managing environment variables, streaming, timeout, retry, errors, and building a secure chat endpoint."
primary_keyword: "free LLM API Node.js"
secondary_keywords:
  - "OpenAI compatible Node.js"
  - "custom Base URL OpenAI"
  - "Node.js chatbot API"
canonical_target: "https://llm.persiantoolbox.ir/guides/en/en-use-free-llm-api-nodejs/"
updated_at: "2026-07-18"
status: "READY_FOR_SITE"
---

# Using a Free LLM API in Node.js with a Custom Base URL

In this tutorial, you will build a swappable Node.js client for OpenAI-compatible free LLM providers. The API key is not stored in the source code, settings are read from environment variables, and key errors (401, 404, 429, timeout, and transient service failures) are handled separately.

Use the [Free LLM API Catalog](https://llm.persiantoolbox.ir/) to choose a provider, Base URL, and Model ID. Quotas, models, and access conditions can change — always check the provider page and official documentation before running.

## Prerequisites

- Node.js 18 or later
- npm or yarn
- API key from an OpenAI-compatible provider
- Correct Base URL and Model ID
- Understanding of the free-tier type and Iran-access status

## Step 1: Set up the project

```bash
mkdir free-llm-nodejs
cd free-llm-nodejs
npm init -y
npm install openai dotenv
```

Project structure:

```text
free-llm-nodejs/
├── index.js
├── .env
├── .env.example
└── .gitignore
```

## Step 2: Configure environment variables

`.env`:

```dotenv
LLM_API_KEY=replace_me
LLM_BASE_URL=https://provider.example/v1
LLM_MODEL=MODEL_ID
```

`.env.example`:

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
node_modules/
```

## Step 3: Build the client

`index.js`:

```javascript
import "dotenv/config";
import OpenAI from "openai";

const required = ["LLM_API_KEY", "LLM_BASE_URL", "LLM_MODEL"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
  timeout: 30000,
  maxRetries: 2,
});

const messages = [
  {
    role: "system",
    content:
      "You are a precise Persian assistant. Answer clearly and concisely.",
  },
];

async function chat() {
  const rl = (await import("readline")).createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('Chatbot ready. Type "exit" to quit.');

  const ask = () => {
    rl.question("You: ", async (input) => {
      if (!input.trim()) return ask();
      if (input.toLowerCase() === "exit") return rl.close();

      messages.push({ role: "user", content: input });

      try {
        const response = await client.chat.completions.create({
          model: process.env.LLM_MODEL,
          messages: messages.slice(-12),
          temperature: 0.3,
        });

        const answer =
          response.choices[0]?.message?.content || "No response received.";
        console.log("Assistant:", answer);
        messages.push({ role: "assistant", content: answer });
      } catch (err) {
        if (err.status === 401) {
          console.log("Error: Invalid API key or account permissions.");
        } else if (err.status === 429) {
          console.log(
            "Error: Rate limit or quota exceeded. Try again later."
          );
        } else if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
          console.log("Error: Check network and LLM_BASE_URL.");
        } else {
          console.log(`Error: ${err.message}`);
        }
      }

      ask();
    });
  };

  ask();
}

chat();
```

## Step 4: Run the application

```bash
node index.js
```

## Adding streaming

```javascript
const stream = await client.chat.completions.create({
  model: process.env.LLM_MODEL,
  messages: messages.slice(-12),
  stream: true,
});

process.stdout.write("Assistant: ");
for await (const event of stream) {
  const text = event.choices[0]?.delta?.content || "";
  process.stdout.write(text);
}
process.stdout.write("\n");
```

Verify streaming support with your provider before using.

## Error management

| Error pattern | Likely cause | Action |
|---|---|---|
| 401 | Invalid/expired key | Check key and account |
| 404 | Wrong URL or model | Check Base URL and Model ID |
| 429 | Rate limit or quota | Retry with backoff |
| ECONNREFUSED | Network or URL | Verify endpoint |
| Timeout | Slow inference | Increase timeout |
| 5xx | Server error | Retry with backoff |

Never log the API key or print it in error messages.

## Environment variable switching

To switch providers, update only `.env`:

```dotenv
LLM_API_KEY=new_key
LLM_BASE_URL=https://new-provider.example/v1
LLM_MODEL=new-model-id
```

Test tool calling, streaming, and parameter differences before fully switching.

## Production checklist

- API key in a secret manager, not in `.env`.
- Input validation and length limits.
- Rate limiting at the application level.
- Structured logging without secrets.
- Circuit breaker for provider failures.
- Graceful degradation with fallback provider.

## Summary

With the OpenAI Node.js SDK and environment-based configuration, you can build a maintainable, swappable LLM client. Focus on error handling, secret management, and provider independence — not just sending requests.

Find current provider options in the [live catalog](https://llm.persiantoolbox.ir/). Submit sanitized Iran-access results through the [Iran Access Report form](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/issues/new?template=iran-access-report.yml).
