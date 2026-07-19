export function parseRobotsContent(html) {
  const match = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i)
    || html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']robots["']/i);
  return match ? match[1].toLowerCase() : "";
}

export function isNoindexPage(html) {
  return parseRobotsContent(html)
    .split(",")
    .map((token) => token.trim())
    .includes("noindex");
}

export function shouldEnforceIndexMetadata(html) {
  return !isNoindexPage(html);
}

export function isInteractiveApplication(html) {
  return /["']@type["']\s*:\s*["'](?:WebApplication|SoftwareApplication)["']/i.test(html);
}

export function shouldEnforceMinimumWordCount(html) {
  if (!shouldEnforceIndexMetadata(html)) return false;
  if (isInteractiveApplication(html)) return false;
  return true;
}
