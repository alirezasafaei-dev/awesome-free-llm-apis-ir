import { readFileSync } from "node:fs";
import process from "node:process";

const ipv4Pattern = /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g;
const sshTargetPattern = /\b[A-Za-z_][A-Za-z0-9._-]*@(?:\d{1,3}\.){3}\d{1,3}\b/g;
const sshUsernamePattern = /\b(?:SSH\s+username|ssh\s+user)\s*:\s*([A-Za-z_][A-Za-z0-9._-]*)\b/gi;

function parseIpv4(value) {
  const octets = value.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }
  return octets;
}

function isNonPublicIpv4(value) {
  const octets = parseIpv4(value);
  if (!octets) return true;
  const [a, b, c] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function detectViolations(text, location) {
  const violations = [];

  for (const target of text.matchAll(sshTargetPattern)) {
    const ipPart = target[0].split("@")[1];
    if (isNonPublicIpv4(ipPart)) continue;
    const sanitized = target[0].replace(/^[^@]+/, "<user>");
    violations.push({ location, type: "ssh_target", sanitized });
  }

  for (const match of text.matchAll(ipv4Pattern)) {
    const address = match[0];
    if (!parseIpv4(address) || isNonPublicIpv4(address)) continue;
    const sanitized = address.replace(/\.\d+$/, ".x");
    violations.push({ location, type: "public_ipv4", sanitized });
  }

  for (const match of text.matchAll(sshUsernamePattern)) {
    const username = match[1];
    violations.push({ location, type: "ssh_username", sanitized: `<redacted operator>` });
  }

  return violations;
}

async function fetchWithPagination(url, token) {
  const results = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetch(`${url}${separator}page=${page}&per_page=${perPage}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "awesome-free-llm-apis-ir-privacy-audit"
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.length === 0) break;

    results.push(...data);
    page++;

    if (data.length < perPage) break;
  }

  return results;
}

async function auditFixtureMode(fixturePath) {
  const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
  const violations = [];

  if (fixture.issues) {
    for (const issue of fixture.issues) {
      const location = `issue #${issue.number}`;
      if (issue.body) {
        violations.push(...detectViolations(issue.body, location));
      }
      if (issue.comments) {
        for (const comment of issue.comments) {
          const commentLocation = `${location} comment ${comment.id}`;
          if (comment.body) {
            violations.push(...detectViolations(comment.body, commentLocation));
          }
        }
      }
    }
  }

  if (fixture.pull_requests) {
    for (const pr of fixture.pull_requests) {
      const location = `pr #${pr.number}`;
      if (pr.body) {
        violations.push(...detectViolations(pr.body, location));
      }
      if (pr.comments) {
        for (const comment of pr.comments) {
          const commentLocation = `${location} comment ${comment.id}`;
          if (comment.body) {
            violations.push(...detectViolations(comment.body, commentLocation));
          }
        }
      }
      if (pr.review_comments) {
        for (const comment of pr.review_comments) {
          const commentLocation = `${location} review_comment ${comment.id}`;
          if (comment.body) {
            violations.push(...detectViolations(comment.body, commentLocation));
          }
        }
      }
    }
  }

  return violations;
}

async function auditLiveMode() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;

  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  if (!repository) {
    throw new Error("GITHUB_REPOSITORY environment variable is required");
  }

  const violations = [];
  const checkedLocations = 0;

  const issues = await fetchWithPagination(
    `https://api.github.com/repos/${repository}/issues?state=all`,
    token
  );

  for (const issue of issues) {
    const location = `issue #${issue.number}`;
    if (issue.body) {
      violations.push(...detectViolations(issue.body, location));
    }

    const comments = await fetchWithPagination(
      `https://api.github.com/repos/${repository}/issues/${issue.number}/comments`,
      token
    );

    for (const comment of comments) {
      const commentLocation = `${location} comment ${comment.id}`;
      if (comment.body) {
        violations.push(...detectViolations(comment.body, commentLocation));
      }
    }

    if (issue.pull_request) {
      const prComments = await fetchWithPagination(
        `https://api.github.com/repos/${repository}/pulls/${issue.number}/comments`,
        token
      );

      for (const comment of prComments) {
        const commentLocation = `pr #${issue.number} review_comment ${comment.id}`;
        if (comment.body) {
          violations.push(...detectViolations(comment.body, commentLocation));
        }
      }
    }
  }

  return { violations, checkedLocations: issues.length };
}

async function main() {
  const args = process.argv.slice(2);
  const fixtureIndex = args.indexOf("--fixture");

  let violations;
  let checkedLocations;

  if (fixtureIndex >= 0 && args[fixtureIndex + 1]) {
    const fixturePath = args[fixtureIndex + 1];
    violations = await auditFixtureMode(fixturePath);
    checkedLocations = violations.length > 0 ? 1 : 0;
  } else {
    const result = await auditLiveMode();
    violations = result.violations;
    checkedLocations = result.checkedLocations;
  }

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(`ERROR ${violation.location}: ${violation.type}`);
    }
    console.error(`\nFound ${violations.length} privacy violation(s) in GitHub discussions.`);
    console.error("Remove infrastructure addresses and SSH identifiers from discussions.");
    process.exit(1);
  }

  console.log(`GitHub discussion privacy audit passed. Checked ${checkedLocations} locations.`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
