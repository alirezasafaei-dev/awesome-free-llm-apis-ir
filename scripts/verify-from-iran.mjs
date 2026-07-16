import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

async function loadDotEnv() {
  try {
    const text = await readFile(path.join(process.cwd(), ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await loadDotEnv();

const providers = [
  {
    id: "openrouter",
    keyEnv: "OPENROUTER_API_KEY",
    modelEnv: "OPENROUTER_MODEL",
    defaultModel: "openrouter/free",
    validatedEnv: "OPENROUTER_CREDENTIAL_VALIDATED",
    endpoint: () => "https://openrouter.ai/api/v1/chat/completions"
  },
  {
    id: "groq",
    keyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: "llama-3.1-8b-instant",
    validatedEnv: "GROQ_CREDENTIAL_VALIDATED",
    endpoint: () => "https://api.groq.com/openai/v1/chat/completions"
  },
  {
    id: "github-models",
    keyEnv: "GITHUB_MODELS_TOKEN",
    modelEnv: "GITHUB_MODELS_MODEL",
    defaultModel: "openai/gpt-4.1-mini",
    validatedEnv: "GITHUB_MODELS_CREDENTIAL_VALIDATED",
    endpoint: () => "https://models.github.ai/inference/chat/completions"
  },
  {
    id: "google-gemini",
    keyEnv: "GEMINI_API_KEY",
    modelEnv: "GEMINI_MODEL",
    defaultModel: "gemini-2.5-flash-lite",
    validatedEnv: "GEMINI_CREDENTIAL_VALIDATED",
    endpoint: () => "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
  },
  {
    id: "hugging-face-inference",
    keyEnv: "HF_TOKEN",
    modelEnv: "HF_MODEL",
    defaultModel: "openai/gpt-oss-20b:fastest",
    validatedEnv: "HF_CREDENTIAL_VALIDATED",
    endpoint: () => "https://router.huggingface.co/v1/chat/completions"
  },
  {
    id: "cerebras",
    keyEnv: "CEREBRAS_API_KEY",
    modelEnv: "CEREBRAS_MODEL",
    defaultModel: "gpt-oss-120b",
    validatedEnv: "CEREBRAS_CREDENTIAL_VALIDATED",
    endpoint: () => "https://api.cerebras.ai/v1/chat/completions"
  },
  {
    id: "cloudflare-workers-ai",
    keyEnv: "CLOUDFLARE_API_TOKEN",
    modelEnv: "CLOUDFLARE_MODEL",
    defaultModel: "@cf/meta/llama-3.1-8b-instruct",
    validatedEnv: "CLOUDFLARE_CREDENTIAL_VALIDATED",
    requiredEnv: ["CLOUDFLARE_ACCOUNT_ID"],
    endpoint: () => `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`
  },
  {
    id: "mistral",
    keyEnv: "MISTRAL_API_KEY",
    modelEnv: "MISTRAL_MODEL",
    defaultModel: "mistral-small-latest",
    validatedEnv: "MISTRAL_CREDENTIAL_VALIDATED",
    endpoint: () => "https://api.mistral.ai/v1/chat/completions"
  },
  {
    id: "sambanova",
    keyEnv: "SAMBANOVA_API_KEY",
    modelEnv: "SAMBANOVA_MODEL",
    defaultModel: "gpt-oss-120b",
    validatedEnv: "SAMBANOVA_CREDENTIAL_VALIDATED",
    endpoint: () => "https://api.sambanova.ai/v1/chat/completions"
  },
  {
    id: "cohere",
    keyEnv: "COHERE_API_KEY",
    modelEnv: "COHERE_MODEL",
    defaultModel: "command-a-03-2025",
    validatedEnv: "COHERE_CREDENTIAL_VALIDATED",
    endpoint: () => "https://api.cohere.com/v2/chat"
  },
  {
    id: "nvidia-nim",
    keyEnv: "NVIDIA_API_KEY",
    modelEnv: "NVIDIA_MODEL",
    defaultModel: "meta/llama-3.1-8b-instruct",
    validatedEnv: "NVIDIA_CREDENTIAL_VALIDATED",
    endpoint: () => "https://integrate.api.nvidia.com/v1/chat/completions"
  },
  {
    id: "aion-labs",
    keyEnv: "AIONLABS_API_KEY",
    modelEnv: "AIONLABS_MODEL",
    defaultModel: "aion-3.0-mini",
    validatedEnv: "AIONLABS_CREDENTIAL_VALIDATED",
    endpoint: () => "https://api.aionlabs.ai/v1/chat/completions"
  },
  {
    id: "freetheai",
    keyEnv: "FREETHEAI_API_KEY",
    modelEnv: "FREETHEAI_MODEL",
    defaultModel: "gpt-4o-mini",
    validatedEnv: "FREETHEAI_CREDENTIAL_VALIDATED",
    endpoint: () => "https://api.freetheai.xyz/v1/chat/completions"
  },
  {
    id: "kilo-gateway",
    keyEnv: "KILO_API_KEY",
    modelEnv: "KILO_MODEL",
    defaultModel: "kilo-auto/free",
    validatedEnv: "KILO_CREDENTIAL_VALIDATED",
    allowAnonymous: true,
    endpoint: () => "https://api.kilo.ai/api/gateway/chat/completions"
  },
  {
    id: "vercel-ai-gateway",
    keyEnv: "VERCEL_AI_GATEWAY_API_KEY",
    modelEnv: "VERCEL_AI_GATEWAY_MODEL",
    defaultModel: "gpt-4o-mini",
    validatedEnv: "VERCEL_AI_GATEWAY_CREDENTIAL_VALIDATED",
    endpoint: () => "https://ai-gateway.vercel.sh/v1/chat/completions"
  },
  {
    id: "fireworks-ai",
    keyEnv: "FIREWORKS_API_KEY",
    modelEnv: "FIREWORKS_MODEL",
    defaultModel: "gpt-oss-120b",
    validatedEnv: "FIREWORKS_CREDENTIAL_VALIDATED",
    endpoint: () => "https://api.fireworks.ai/inference/v1/chat/completions"
  }
];

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const selectedArg = [...args].find((arg) => arg.startsWith("--providers="));
const selected = selectedArg ? new Set(selectedArg.split("=")[1].split(",").filter(Boolean)) : null;
const outputArg = [...args].find((arg) => arg.startsWith("--output="));

const bool = (name) => /^(1|true|yes)$/i.test(process.env[name] ?? "");
const nullable = (value) => value?.trim() || null;
const chosen = providers.filter((provider) => !selected || selected.has(provider.id));

if (selected) {
  const known = new Set(providers.map((provider) => provider.id));
  const invalid = [...selected].filter((id) => !known.has(id));
  if (invalid.length) throw new Error(`Unknown provider(s): ${invalid.join(", ")}`);
}

if (dryRun) {
  console.log(`Iran verifier configuration is valid for ${chosen.length} provider(s).`);
  for (const provider of chosen) {
    const hasKey = Boolean(process.env[provider.keyEnv]);
    const hasExtras = (provider.requiredEnv ?? []).every((name) => Boolean(process.env[name]));
    const anonymous = provider.allowAnonymous && !hasKey;
    const status = hasKey && hasExtras ? "configured" : anonymous ? "anonymous (no key needed)" : "skipped (missing credentials)";
    console.log(`${provider.id}: ${status}`);
  }
  process.exit(0);
}

const declaredCountry = (process.env.IR_TEST_COUNTRY ?? "").toUpperCase();
if (!/^[A-Z]{2}$/.test(declaredCountry)) throw new Error("Set IR_TEST_COUNTRY to a two-letter country code; use IR only when actually testing from Iran.");
const connectionRoute = (process.env.IR_TEST_ROUTE ?? "direct").toLowerCase();
if (!new Set(["direct", "vpn"]).has(connectionRoute)) throw new Error("IR_TEST_ROUTE must be direct or vpn.");
const observedExitCountry = (process.env.IR_TEST_EXIT_COUNTRY ?? "").toUpperCase();
if (!/^[A-Z]{2}$/.test(observedExitCountry)) throw new Error("Set IR_TEST_EXIT_COUNTRY to the observed two-letter exit country.");
if (connectionRoute === "direct" && observedExitCountry !== declaredCountry) throw new Error("Direct tests require IR_TEST_EXIT_COUNTRY to match IR_TEST_COUNTRY.");
if (connectionRoute === "vpn" && !nullable(process.env.IR_TEST_VPN_PROVIDER)) throw new Error("VPN tests require IR_TEST_VPN_PROVIDER without account details.");

function classify(status, bodyText) {
  const locationWords = /country|region|location|territor|geograph|unsupported.*(country|region)|not available in your/i;
  if (status >= 200 && status < 300) return "success";
  if ([401, 403].includes(status) && locationWords.test(bodyText)) return "geo_blocked";
  if (status === 401) return "auth_failed";
  if (status === 403) return "policy_denied";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "provider_error";
  return "invalid_response";
}

async function testProvider(provider) {
  const model = process.env[provider.modelEnv] || provider.defaultModel;
  const credentialValidated = bool(provider.validatedEnv);
  const key = process.env[provider.keyEnv];
  const missingExtra = (provider.requiredEnv ?? []).some((name) => !process.env[name]);
  const anonymous = provider.allowAnonymous && !key;
  if ((!key && !anonymous) || missingExtra) {
    return { provider_id: provider.id, model, tested: false, credential_validated_elsewhere: credentialValidated, outcome: "skipped", http_status: null, latency_ms: null, response_fingerprint: null, publishable_claim: false };
  }

  const started = Date.now();
  try {
    const headers = { "content-type": "application/json", "user-agent": "awesome-free-llm-apis-ir-verifier/1.0" };
    if (!anonymous) headers["authorization"] = `Bearer ${key}`;
    const response = await fetch(provider.endpoint(), {
      method: "POST",
      signal: AbortSignal.timeout(30_000),
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "فقط کلمه موفق را بنویس." }],
        max_tokens: 8,
        temperature: 0
      })
    });
    const bodyText = await response.text();
    const outcome = classify(response.status, bodyText);
    const routeIsValid = connectionRoute === "direct"
      ? declaredCountry === "IR" && observedExitCountry === "IR"
      : declaredCountry === "IR" && observedExitCountry !== "IR";
    const publishable = routeIsValid && (outcome === "success" || (outcome === "geo_blocked" && credentialValidated));
    return {
      provider_id: provider.id,
      model,
      tested: true,
      credential_validated_elsewhere: credentialValidated,
      outcome,
      http_status: response.status,
      latency_ms: Date.now() - started,
      response_fingerprint: createHash("sha256").update(bodyText).digest("hex"),
      publishable_claim: publishable
    };
  } catch (error) {
    return {
      provider_id: provider.id,
      model,
      tested: true,
      credential_validated_elsewhere: credentialValidated,
      outcome: "network_error",
      http_status: null,
      latency_ms: Date.now() - started,
      response_fingerprint: createHash("sha256").update(error.name).digest("hex"),
      publishable_claim: false
    };
  }
}

const results = [];
for (const provider of chosen) {
  const result = await testProvider(provider);
  results.push(result);
  console.log(`${result.provider_id}: ${result.outcome}${result.http_status ? ` (${result.http_status})` : ""}`);
}

const report = {
  schema_version: "1.0.0",
  run_id: randomUUID(),
  run_at: new Date().toISOString(),
  declared_country: declaredCountry,
  connection_route: connectionRoute,
  observed_exit_country: observedExitCountry,
  vpn_provider: connectionRoute === "vpn" ? nullable(process.env.IR_TEST_VPN_PROVIDER) : null,
  network: {
    isp: nullable(process.env.IR_TEST_ISP),
    asn: nullable(process.env.IR_TEST_ASN),
    city: nullable(process.env.IR_TEST_CITY)
  },
  results,
  safety: { raw_ip_stored: false, credentials_stored: false, response_bodies_stored: false }
};

const stamp = report.run_at.replace(/[:.]/g, "-");
const output = outputArg ? outputArg.split("=").slice(1).join("=") : path.join("reports", "local", `iran-test-${stamp}.json`);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
console.log(`Sanitized local report written to ${output}`);

if (!results.some((result) => result.tested)) {
  console.error("No provider was tested. Add credentials to .env.");
  process.exit(2);
}
