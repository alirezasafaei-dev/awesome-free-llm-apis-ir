import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";

const prompts = JSON.parse(await readFile(path.join("benchmarks", "persian", "v1", "prompts.json"), "utf8"));
const answerByPrompt = new Map(prompts.map((prompt) => {
  const { type, expected } = prompt.scoring;
  const answer = type === "numeric" ? String(expected) : type === "json_equal" ? JSON.stringify(expected) : expected[0];
  return [prompt.prompt_fa, answer];
}));

const server = createServer((request, response) => {
  let body = "";
  request.setEncoding("utf8");
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => {
    try {
      assert.equal(request.method, "POST");
      assert.equal(request.url, "/v1/chat/completions");
      assert.equal(request.headers.authorization, "Bearer local-test-key");
      const payload = JSON.parse(body);
      assert.equal(payload.temperature, 0);
      assert.equal(payload.seed, 1);
      const prompt = payload.messages.at(-1)?.content;
      const content = answerByPrompt.get(prompt);
      assert.ok(content, "mock server received an unknown prompt");
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ choices: [{ message: { role: "assistant", content } }] }));
    } catch (error) {
      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: error.message }));
    }
  });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const output = path.join("benchmarks", "results", "local", "integration-test.json");

try {
  const child = spawn(process.execPath, ["scripts/run-persian-benchmark.mjs", `--output=${output}`], {
    env: {
      ...process.env,
      BENCHMARK_PROVIDER_ID: "local-mock",
      BENCHMARK_API_BASE_URL: `http://127.0.0.1:${port}/v1`,
      BENCHMARK_API_KEY: "local-test-key",
      BENCHMARK_MODEL: "deterministic-fixture"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const exitCode = await new Promise((resolve) => child.on("close", resolve));
  assert.equal(exitCode, 0, `runner failed\n${stdout}\n${stderr}`);
  const report = JSON.parse(await readFile(output, "utf8"));
  assert.equal(report.complete, true);
  assert.equal(report.summary.total, prompts.length);
  assert.equal(report.summary.scored, prompts.length);
  assert.equal(report.summary.passed, prompts.length);
  assert.equal(report.summary.score_percent, 100);
  assert.equal(report.summary.errors, 0);
  assert.ok(report.results.every((result) => result.status === "scored" && result.passed));
  console.log(`Benchmark runner integration test passed (${prompts.length}/${prompts.length}).`);
} finally {
  server.close();
  await rm(output, { force: true });
}
