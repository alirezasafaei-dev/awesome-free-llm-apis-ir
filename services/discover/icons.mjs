import * as simpleIcons from "simple-icons";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{0,79}$/;
const iconsBySlug = new Map(
  Object.values(simpleIcons)
    .filter((icon) => icon && typeof icon === "object" && typeof icon.slug === "string" && typeof icon.path === "string")
    .map((icon) => [icon.slug, icon])
);

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function hasSimpleIcon(key) {
  return typeof key === "string" && SLUG_PATTERN.test(key) && iconsBySlug.has(key);
}

export function renderSimpleIconSvg(key) {
  if (!hasSimpleIcon(key)) return null;
  const icon = iconsBySlug.get(key);
  const title = escapeXml(icon.title);
  const path = escapeXml(icon.path);
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 24 24"><title>${title}</title><path d="${path}"/></svg>`;
}
