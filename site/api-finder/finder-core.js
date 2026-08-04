const accessLabels = {
        verified_working: "مستقیم تست‌شده",
        verified_working_vpn: "با VPN تست‌شده",
        direct_blocked_vpn_working: "مستقیم مسدود / VPN موفق",
        verified_blocked: "مستقیم مسدود",
        officially_unsupported: "پشتیبانی‌نشده رسمی",
        intermittent: "ناپایدار",
        signup_blocked: "ثبت‌نام مسدود",
        unknown: "نامشخص"
      };
      const serviceLabels = {
        official_provider: "Provider رسمی",
        official_gateway: "Gateway رسمی",
        community_gateway: "Gateway اجتماعی",
        session_bridge: "Session bridge",
        self_hosted: "Self-hosted"
      };
      const freeLabels = {
        permanent_allowance: "سهمیه دائمی",
        free_models: "مدل‌های رایگان",
        monthly_credit: "اعتبار ماهانه",
        trial: "آزمایشی",
        unknown: "نامشخص"
      };
      const capabilityLabels = {
        chat: "چت",
        text_generation: "تولید متن",
        reasoning: "Reasoning",
        embeddings: "Embedding",
        tool_calling: "Tool calling",
        structured_output: "Structured output"
      };
      const usecaseCapabilityMap = {
        chat: ["chat", "text_generation"],
        coding: ["tool_calling", "structured_output"],
        reasoning: ["reasoning"],
        embeddings: ["embeddings"]
      };
      const iranScorePenalties = ["officially_unsupported", "verified_blocked", "signup_blocked"];
      const iranAccessibleStatuses = ["verified_working", "verified_working_vpn", "direct_blocked_vpn_working", "intermittent"];

      let providers = [];
      const elements = {
        form: document.getElementById("finder-form"),
        usecase: document.getElementById("finder-usecase"),

        budget: document.getElementById("finder-budget"),
        latency: document.getElementById("finder-latency"),
        region: document.getElementById("finder-region"),
        submit: document.getElementById("finder-submit"),
        reset: document.getElementById("finder-reset"),
        results: document.getElementById("finder-results"),
        status: document.getElementById("finder-status"),
        statusText: document.getElementById("finder-status-text"),
        loading: document.getElementById("finder-loading"),
        error: document.getElementById("finder-error"),
        retry: document.getElementById("finder-retry"),
        empty: document.getElementById("finder-empty"),
        disclosure: document.getElementById("finder-disclosure"),
        themeToggle: document.getElementById("theme-toggle")
      };

      function isStale(provider) {
        const checked = new Date(`${provider.verification.last_checked}T00:00:00Z`);
        return (Date.now() - checked.getTime()) / 86_400_000 > provider.verification.stale_after_days;
      }

      function maxRpm(provider) {
        return Math.max(...provider.free_tier.limits.map((l) => l.rpm ?? 0), 0);
      }

      function scoreProvider(provider, filters) {
        const capabilities = usecaseCapabilityMap[filters.usecase] ?? usecaseCapabilityMap.chat;
        let score = 0;
        const breakdown = {};

        const hasCapability = capabilities.some((c) => provider.capabilities.includes(c));
        const capabilityScore = hasCapability ? 35 : 0;
        score += capabilityScore;
        breakdown.capability = { label: "تطابق قابلیت", value: capabilityScore, max: 35 };let budgetScore = 0;
        if (filters.budget === "no-card") {
          if (provider.free_tier.requires_payment_method === false) budgetScore = 20;
          else if (provider.free_tier.requires_payment_method === null) budgetScore = 10;
          else budgetScore = 0;
        } else if (filters.budget === "free-only") {
          if (provider.free_tier.type === "free_models" || provider.free_tier.type === "permanent_allowance") budgetScore = 15;
          else budgetScore = 5;
        } else {
          budgetScore = 5;
        }
        score += budgetScore;
        breakdown.budget = { label: "بودجه", value: budgetScore, max: 20 };

        let latencyScore = 0;
        const rpm = maxRpm(provider);
        if (filters.latency === "critical") {
          latencyScore = Math.min(15, Math.round(rpm / 40));
        } else if (filters.latency === "important") {
          latencyScore = Math.min(10, Math.round(rpm / 60));
        } else {
          latencyScore = rpm > 0 ? 3 : 0;
        }
        score += latencyScore;
        breakdown.latency = { label: "ظرفیت درخواست", value: latencyScore, max: 15, rpm };

        let regionScore = 0;
        const status = provider.iran_access.status;
        if (filters.region === "iran") {
          if (status === "verified_working") regionScore = 30;
          else if (status === "verified_working_vpn" || status === "direct_blocked_vpn_working") regionScore = 10;
          else if (status === "intermittent") regionScore = 8;
          else if (iranScorePenalties.includes(status)) regionScore = -30;
          else regionScore = 0;
        } else if (filters.region === "iran-vpn") {
          if (status === "verified_working" || status === "verified_working_vpn" || status === "direct_blocked_vpn_working") regionScore = 15;
          else if (status === "intermittent") regionScore = 10;
          else if (iranScorePenalties.includes(status)) regionScore = -15;
          else regionScore = 5;
        } else {
          if (status !== "unknown" && !iranScorePenalties.includes(status)) regionScore = 5;
          else if (iranScorePenalties.includes(status)) regionScore = -5;
          else regionScore = 0;
        }
        score += regionScore;
        breakdown.region = { label: "منطقه", value: regionScore, max: 30 };

        let penaltyScore = 0;
        if (provider.service_type === "community_gateway") penaltyScore = -15;
        else if (provider.service_type === "session_bridge") penaltyScore = -25;
        if (status === "unknown") penaltyScore += -5;
        score += penaltyScore;
        breakdown.penalty = { label: "جریمه", value: penaltyScore, max: 0 };

        return { score, breakdown };
      }

      function escapeHtml(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }

      function safeExternalUrl(href) {
        try {
          const url = new URL(href, location.origin);
          if (url.protocol !== "https:") return null;
          return url.toString();
        } catch {
          return null;
        }
      }

      function createBreakdownItem(b) {
        const item = document.createElement("div");
        item.className = "finder-breakdown-item";

        const label = document.createElement("span");
        label.className = "label";
        label.textContent = b.label;
        item.appendChild(label);

        const val = document.createElement("span");
        const cls = b.value > 0 ? "positive" : b.value < 0 ? "negative" : "";
        val.className = cls ? `value ${cls}` : "value";
        val.textContent = `${b.value > 0 ? "+" : ""}${b.value}`;
        item.appendChild(val);

        return item;
      }

      function createCardElement(provider, score, breakdown, index) {
        const card = document.createElement("div");
        card.className = "finder-card";

        const header = document.createElement("div");
        header.className = "finder-card-header";

        const rank = document.createElement("div");
        rank.className = "finder-rank";
        rank.textContent = String(index + 1);
        header.appendChild(rank);

        const title = document.createElement("div");
        title.className = "finder-card-title";

        const name = document.createElement("h3");
        name.textContent = provider.name;
        title.appendChild(name);

        const id = document.createElement("span");
        id.className = "finder-id";
        id.textContent = `${provider.id} · ${serviceLabels[provider.service_type] ?? provider.service_type}`;
        title.appendChild(id);
        header.appendChild(title);

        const totalScore = document.createElement("div");
        totalScore.className = "finder-total-score";
        const scoreVal = document.createElement("strong");
        scoreVal.textContent = String(score);
        totalScore.appendChild(scoreVal);
        const scoreLabel = document.createElement("small");
        scoreLabel.textContent = "از ۱۰۰";
        totalScore.appendChild(scoreLabel);
        header.appendChild(totalScore);
        card.appendChild(header);

        const breakdownDiv = document.createElement("div");
        breakdownDiv.className = "finder-breakdown";
        for (const [, b] of Object.entries(breakdown)) {
          breakdownDiv.appendChild(createBreakdownItem(b));
        }
        card.appendChild(breakdownDiv);

        const extra = document.createElement("div");
        extra.className = "finder-card-extra";

        const accessBadge = document.createElement("span");
        const verifiedClass = provider.iran_access.status === "verified_working" ? " access-verified" : "";
        accessBadge.className = `access-badge${verifiedClass}`;
        accessBadge.setAttribute("data-status", provider.iran_access.status);
        accessBadge.textContent = accessLabels[provider.iran_access.status] ?? provider.iran_access.status;
        extra.appendChild(accessBadge);

        const limit = document.createElement("span");
        limit.className = "limit-label";
        limit.textContent = limitText(provider);
        extra.appendChild(limit);

        if (isStale(provider)) {
          const stale = document.createElement("span");
          stale.className = "freshness-badge stale finder-stale-badge";
          stale.textContent = "نیازمند بررسی";
          extra.appendChild(stale);
        }
        card.appendChild(extra);

        const actions = document.createElement("div");
        actions.className = "finder-card-actions";

        const detailLink = document.createElement("a");
        detailLink.className = "finder-detail-link";
        detailLink.href = `../providers/${provider.id}/`;
        detailLink.textContent = "جزئیات و شواهد";
        actions.appendChild(detailLink);

        const docsUrl = safeExternalUrl(provider.docs);
        if (docsUrl) {
          const docsLink = document.createElement("a");
          docsLink.className = "finder-docs-link";
          docsLink.href = docsUrl;
          docsLink.setAttribute("target", "_blank");
          docsLink.setAttribute("rel", "noopener noreferrer");
          docsLink.textContent = "مستندات";
          actions.appendChild(docsLink);
        }

        if (provider.iran_access.evidence?.length) {
          const evidenceLink = document.createElement("a");
          evidenceLink.className = "finder-evidence-link";
          evidenceLink.href = `../providers/${provider.id}/#evidence`;
          evidenceLink.textContent = `${provider.iran_access.evidence.length} شاهد`;
          actions.appendChild(evidenceLink);
        }
        card.appendChild(actions);

        return card;
      }

      function renderResults(results, filters) {
        if (results.length === 0) {
          elements.results.replaceChildren();
          elements.status.hidden = true;
          elements.empty.hidden = false;
          return;
        }

        elements.empty.hidden = true;
        elements.status.hidden = false;
        elements.statusText.textContent = `${results.length} مورد از ${providers.length} ارائه‌دهنده — ${filters.usecase === "chat" ? "چت" : filters.usecase === "coding" ? "کدنویسی" : filters.usecase === "reasoning" ? "استدلال" : "Embedding"} · ${filters.budget === "no-card" ? "بدون کارت" : filters.budget === "free-only" ? "فقط رایگان" : "هر نوع"} · ${filters.region === "iran" ? "ایران مستقیم" : filters.region === "iran-vpn" ? "ایران با VPN" : "هر منطقه"}`;

        const cards = results.map(({ provider, score, breakdown }, index) =>
          createCardElement(provider, score, breakdown, index)
        );

        elements.results.replaceChildren(...cards);
      }

      function limitText(provider) {
        const first = provider.free_tier.limits[0];
        if (!first) return "وابسته به مدل/حساب";
        const values = [];
        if (first.rpm != null) values.push(`${first.rpm.toLocaleString("en-US")} RPM`);
        if (first.rph != null) values.push(`${first.rph.toLocaleString("en-US")} RPH`);
        if (first.rpd != null) values.push(`${first.rpd.toLocaleString("en-US")} RPD`);
        if (first.tpm != null) values.push(`${first.tpm.toLocaleString("en-US")} TPM`);
        if (first.daily_units != null) values.push(`${first.daily_units.toLocaleString("en-US")} ${first.unit_name ?? "unit"}/day`);
        if (first.monthly_credit_usd != null) values.push(`$${first.monthly_credit_usd}/month`);
        if (first.monthly_requests != null) values.push(`${first.monthly_requests.toLocaleString("en-US")} request/month`);
        return values.slice(0, 2).join(" · ") || "مدل‌محور";
      }

      function getFilters() {
        return {
          usecase: elements.usecase.value,

          budget: elements.budget.value,
          latency: elements.latency.value,
          region: elements.region.value
        };
      }

      function runFinder() {
        const filters = getFilters();
        const scored = providers.map((provider) => {
          const { score, breakdown } = scoreProvider(provider, filters);
          return { provider, score, breakdown };
        });
        scored.sort((a, b) => b.score - a.score || a.provider.name.localeCompare(b.provider.name, "en"));
        const top = scored.slice(0, 5);
        renderResults(top, filters);
      }

      function setupTheme() {
        const stored = localStorage.getItem("theme");
        const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        const current = stored || preferred;
        document.documentElement.dataset.theme = current;
        const toggle = elements.themeToggle;
        const isDark = current === "dark";
        toggle.setAttribute("aria-pressed", String(isDark));
        toggle.setAttribute("aria-label", isDark ? "تغییر به پوسته روشن" : "تغییر به پوسته تاریک");
        toggle.addEventListener("click", () => {
          const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
          document.documentElement.dataset.theme = next;
          localStorage.setItem("theme", next);
          const nextIsDark = next === "dark";
          toggle.setAttribute("aria-pressed", String(nextIsDark));
          toggle.setAttribute("aria-label", nextIsDark ? "تغییر به پوسته روشن" : "تغییر به پوسته تاریک");
        });
      }

      function loadUrlFilters() {
        const params = new URLSearchParams(location.search);
        if (params.has("usecase")) elements.usecase.value = params.get("usecase");

        if (params.has("budget")) elements.budget.value = params.get("budget");
        if (params.has("latency")) elements.latency.value = params.get("latency");
        if (params.has("region")) elements.region.value = params.get("region");
      }

      function updateUrl(filters) {
        const params = new URLSearchParams();
        if (filters.usecase !== "chat") params.set("usecase", filters.usecase);
        if (filters.budget !== "no-card") params.set("budget", filters.budget);
        if (filters.latency !== "low") params.set("latency", filters.latency);
        if (filters.region !== "iran") params.set("region", filters.region);
        history.replaceState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}${location.hash}`);
      }

      function onFind(event) {
        event.preventDefault();
        const filters = getFilters();
        updateUrl(filters);
        runFinder();
        if (typeof window.plausible === "function") {
          window.plausible("api_finder_search", {
            props: {
              usecase: filters.usecase,

              budget: filters.budget,
              latency: filters.latency,
              region: filters.region
            }
          });
        }
      }

      async function init() {
        setupTheme();
        loadUrlFilters();
        elements.retry.addEventListener("click", () => location.reload());

        elements.form.addEventListener("submit", onFind);
        elements.reset.addEventListener("click", () => {
          elements.usecase.value = "chat";

          elements.budget.value = "no-card";
          elements.latency.value = "low";
          elements.region.value = "iran";
          history.replaceState(null, "", location.pathname);
          elements.results.replaceChildren();
          elements.status.hidden = true;
          elements.empty.hidden = true;
        });

        try {
          elements.loading.hidden = false;
          elements.error.hidden = true;
          const response = await fetch("../catalog.json", { cache: "no-cache" });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const catalog = await response.json();
          providers = catalog.providers;
          elements.loading.hidden = true;

          if (location.search.includes("usecase=") || location.search.includes("budget=") || location.search.includes("region=")) {
            runFinder();
          }
        } catch (err) {
          console.error(err);
          elements.loading.hidden = true;
          elements.error.hidden = false;
        }
      }

      init();
