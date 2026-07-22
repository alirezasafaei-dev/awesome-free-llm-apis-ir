/**
 * Shared site footer markup for product pages.
 * @typedef {"fa" | "en"} SiteLang
 * @typedef {{ lang: SiteLang, assetPrefix: string, brandLead?: string }} FooterOptions
 */

/**
 * Normalize a relative asset prefix so links join cleanly.
 * @param {string} assetPrefix
 * @returns {string}
 */
export function normalizeAssetPrefix(assetPrefix) {
  if (!assetPrefix || assetPrefix === ".") return "./";
  return assetPrefix.endsWith("/") ? assetPrefix : `${assetPrefix}/`;
}

/**
 * Join assetPrefix with a root-relative site path (no leading slash).
 * @param {string} assetPrefix
 * @param {string} path
 * @returns {string}
 */
export function joinAssetPath(assetPrefix, path) {
  const prefix = normalizeAssetPrefix(assetPrefix);
  const clean = path.replace(/^\//, "");
  if (prefix === "./") return `./${clean}`;
  return `${prefix}${clean}`;
}

/**
 * Infer lang and asset prefix from a dist-relative HTML path.
 * @param {string} relativePath e.g. "compare/index.html"
 * @returns {{ lang: SiteLang, assetPrefix: string }}
 */
export function footerContextFromRelativePath(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  const depth = normalized.split("/").length - 1;
  const assetPrefix = depth <= 0 ? "./" : "../".repeat(depth);
  const lang = normalized.startsWith("en/") ? "en" : "fa";
  return { lang, assetPrefix };
}

/**
 * @param {FooterOptions} options
 * @returns {string}
 */
export function renderSiteFooter(options) {
  const prefix = normalizeAssetPrefix(options.assetPrefix);
  const href = (path) => joinAssetPath(prefix, path);
  const github = "https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir";
  const issues = `${github}/issues/new/choose`;

  if (options.lang === "en") {
    const lead =
      options.brandLead ??
      "Evidence-first catalog of free LLM APIs with quotas, OpenAI compatibility, and dated access evidence. No ads. No permanent-access guarantees.";
    return `<footer class="site-footer" role="contentinfo">
      <div class="footer-grid">
        <div class="footer-brand">
          <strong>Awesome Free LLM APIs IR</strong>
          <p>${lead}</p>
        </div>
        <nav class="footer-nav" aria-label="Footer">
          <div>
            <h2 class="footer-heading">Product</h2>
            <ul>
              <li><a href="${href("en/")}">Home</a></li>
              <li><a href="${href("en/api-finder/")}">API Finder</a></li>
              <li><a href="${href("en/compare/")}">Compare</a></li>
              <li><a href="${href("en/quick-start/")}">Quick Start</a></li>
              <li><a href="${href("tools/")}">Tools</a></li>
            </ul>
          </div>
          <div>
            <h2 class="footer-heading">Trust &amp; data</h2>
            <ul>
              <li><a href="${href("methodology/")}">Methodology</a></li>
              <li><a href="${href("catalog.json")}">catalog.json</a></li>
              <li><a href="${href("data.json")}">data.json</a></li>
              <li><a href="${href("sitemap.xml")}">Sitemap</a></li>
              <li><a href="${href("llms.txt")}">llms.txt</a></li>
            </ul>
          </div>
          <div>
            <h2 class="footer-heading">Contribute</h2>
            <ul>
              <li><a href="${github}">GitHub</a></li>
              <li><a href="${issues}">Report an issue</a></li>
              <li><a href="${href("")}">فارسی</a></li>
            </ul>
          </div>
        </nav>
      </div>
      <p class="footer-meta">MIT License · No commercial affiliation with providers · Do not publish IPs, API keys, or account data</p>
    </footer>`;
  }

  const lead =
    options.brandLead ??
    "کاتالوگ evidence-first از APIهای رایگان LLM برای توسعه‌دهندگان فارسی و کاربران ایران. داده machine-readable، بدون تبلیغ و بدون تضمین دسترسی دائمی.";
  return `<footer class="site-footer" role="contentinfo">
      <div class="footer-grid">
        <div class="footer-brand">
          <strong>Awesome Free LLM APIs IR</strong>
          <p>${lead}</p>
        </div>
        <nav class="footer-nav" aria-label="پیوندهای پاورقی">
          <div>
            <h2 class="footer-heading">محصول</h2>
            <ul>
              <li><a href="${href("")}">خانه</a></li>
              <li><a href="${href("#catalog")}">کاتالوگ APIها</a></li>
              <li><a href="${href("api-finder/")}">انتخاب هوشمند</a></li>
              <li><a href="${href("compare/")}">مقایسه</a></li>
              <li><a href="${href("quick-start/")}">شروع سریع</a></li>
              <li><a href="${href("tools/")}">ابزارها</a></li>
            </ul>
          </div>
          <div>
            <h2 class="footer-heading">اعتماد و داده</h2>
            <ul>
              <li><a href="${href("methodology/")}">روش‌شناسی</a></li>
              <li><a href="${href("catalog.json")}">catalog.json</a></li>
              <li><a href="${href("data.json")}">data.json</a></li>
              <li><a href="${href("sitemap.xml")}">Sitemap</a></li>
              <li><a href="${href("llms.txt")}">llms.txt</a></li>
            </ul>
          </div>
          <div>
            <h2 class="footer-heading">مشارکت</h2>
            <ul>
              <li><a href="${github}">GitHub</a></li>
              <li><a href="${issues}">گزارش خطا</a></li>
              <li><a href="${href("en/")}">English</a></li>
            </ul>
          </div>
        </nav>
      </div>
      <p class="footer-meta">MIT License · بدون وابستگی تجاری به Providerها · بدون انتشار IP، کلید API یا داده حساب</p>
    </footer>`;
}

/**
 * Replace the first <footer>...</footer> block with the shared site footer.
 * @param {string} html
 * @param {FooterOptions} options
 * @returns {{ html: string, changed: boolean }}
 */
export function replaceFooter(html, options) {
  const nextFooter = renderSiteFooter(options);
  if (!/<footer\b[\s\S]*?<\/footer>/i.test(html)) {
    return { html, changed: false };
  }
  if (html.includes('class="site-footer"') && html.includes("footer-grid")) {
    // Upgrade in place so content stays synchronized with the shared renderer.
    const upgraded = html.replace(/<footer\b[\s\S]*?<\/footer>/i, nextFooter);
    return { html: upgraded, changed: upgraded !== html };
  }
  const upgraded = html.replace(/<footer\b[\s\S]*?<\/footer>/i, nextFooter);
  return { html: upgraded, changed: upgraded !== html };
}
