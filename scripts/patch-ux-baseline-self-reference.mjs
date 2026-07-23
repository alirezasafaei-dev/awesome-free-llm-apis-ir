import { readFile, writeFile } from "node:fs/promises";

const path = "docs/UX_METRICS_BASELINE.fa.md";
let text = await readFile(path, "utf8");

const replacements = [
  [
    `DEPLOYED_SHA=00e6cf20539921117619e8b95b0fb0ab7378fd78
EXACT_RELEASE_RUN=30040826620`,
    `PRODUCT_BASELINE_SHA=00e6cf20539921117619e8b95b0fb0ab7378fd78
PRODUCT_BASELINE_RELEASE_RUN=30040826620
SESSION_RELEASE_SHA=<read from canonical /build-meta.json before the session>
SESSION_RELEASE_RUN=<successful production-release/exact-revision run for SESSION_RELEASE_SHA>`
  ],
  [
    "این Revision تنها Baseline معتبر برای دور فعلی سنجش UX است. مقایسه قبل/بعد فقط زمانی معتبر است که:",
    "این Product baseline رفتار UI مورد سنجش را تعریف می‌کند. هر جلسه باید علاوه بر آن، SHA واقعی همان لحظه را از `build-meta.json` ثبت کند و فقط پس از موفقیت `production-release/exact-revision` معتبر است. Commitهای بعدی که صرفاً اسناد یا عملیات داخلی را تغییر می‌دهند Product baseline را عوض نمی‌کنند. مقایسه قبل/بعد فقط زمانی معتبر است که:"
  ],
  [
    `DEPLOYED_SHA=00e6cf20539921117619e8b95b0fb0ab7378fd78
HOMEPAGE_SESSIONS=`,
    `PRODUCT_BASELINE_SHA=00e6cf20539921117619e8b95b0fb0ab7378fd78
SESSION_RELEASE_SHA=
SESSION_RELEASE_RUN=
HOMEPAGE_SESSIONS=`
  ]
];

for (const [from, to] of replacements) {
  if (!text.includes(from)) throw new Error(`missing UX baseline marker: ${from.slice(0, 80)}`);
  text = text.replace(from, to);
}

await writeFile(path, text, "utf8");
console.log("UX baseline now separates the stable product baseline from the exact release used for each session.");
