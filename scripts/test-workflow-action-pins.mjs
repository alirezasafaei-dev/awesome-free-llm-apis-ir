import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const workflowsDir = path.join(process.cwd(), ".github", "workflows");
const violations = [];

for (const file of (await readdir(workflowsDir)).filter((name) => /\.ya?ml$/u.test(name))) {
  const content = await readFile(path.join(workflowsDir, file), "utf8");
  for (const [index, line] of content.split(/\r?\n/u).entries()) {
    const match = line.match(/\buses:\s*([^\s#]+)/u);
    if (!match || match[1].startsWith("./")) continue;
    const separator = match[1].lastIndexOf("@");
    const reference = separator >= 0 ? match[1].slice(separator + 1) : "";
    if (!/^[0-9a-f]{40}$/u.test(reference)) {
      violations.push(`${file}:${index + 1}: ${match[1]}`);
    }
  }
}

if (violations.length > 0) {
  for (const violation of violations) console.error(`ERROR mutable or invalid Action reference: ${violation}`);
  process.exit(1);
}

console.log("All external GitHub Actions are pinned to full commit SHAs.");
