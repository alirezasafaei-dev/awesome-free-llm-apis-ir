/** Render the shared CSP-safe UI stylesheets for a page depth. */
export function renderUiStyles(prefix) {
  return `<link rel="stylesheet" href="${prefix}ui-pro-max.css">
  <link rel="stylesheet" href="${prefix}ui-pro-max-components.css">`;
}

/** Render analytics scripts in their required order. */
export function renderAnalyticsTags(prefix, { includeAnalytics = true } = {}) {
  const analytics = includeAnalytics ? `<script defer src="${prefix}analytics.js"></script>
  ` : "";
  return `${analytics}<script defer src="${prefix}plausible-guard.js"></script>
  <script defer data-domain="llm.persiantoolbox.ir" src="${prefix}plausible.js"></script>`;
}
