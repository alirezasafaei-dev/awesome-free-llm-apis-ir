# اجرای Launch با OpenCode و Provider قابل تعویض

این راهنما جایگزین اجرای طولانی‌مدت Hermes است. OpenCode مسئول Context، فایل‌ها، فرمان‌ها، Branch و Draft PR است؛ مدل می‌تواند بدون تغییر Workflow میان MiMo، OpenAI، GitHub Copilot یا Providerهای دیگر عوض شود.

## چرا OpenCode

- Provider-agnostic است و تعویض مدل به تغییر Prompt و ساختار Repository نیاز ندارد.
- `AGENTS.md` موجود Repository را به‌عنوان قرارداد پروژه می‌خواند.
- Plan agent برای بررسی Read-only و Agent اختصاصی برای اجرای کنترل‌شده دارد.
- Permissionهای `allow`، `ask` و `deny` از عملیات ناخواسته جلوگیری می‌کنند.
- Context compaction و pruning برای Sessionهای طولانی فعال شده‌اند.
- Share کردن Session در `opencode.json` غیرفعال است.

## معماری پیشنهادی

```text
OpenCode = agent harness / terminal / permissions / sessions
MiMo = مدل اصلی کم‌هزینه یا Token Plan
Provider دوم = fallback هنگام rate limit
GitHub = source of truth و review boundary
Owner = تنها تأییدکننده عملیات انتشار
```

OpenClaw در این مرحله استفاده نشود. OpenClaw برای Gateway، Channel routing و Agentهای همیشه‌روشن مناسب است، اما برای عملیات محدود Git/PR این پروژه سطح حمله و پیچیدگی غیرضروری ایجاد می‌کند.

## نصب OpenCode

Node.js نسخه 22 پیشنهاد می‌شود و با نیاز Repository هم‌راستا است.

```bash
npm install -g opencode-ai
opencode -v
```

سپس:

```bash
cd /path/to/awesome-free-llm-apis-ir
git pull --ff-only origin main
opencode
```

در این Repository دستور `/init` را بدون بررسی اجرا نکن، چون `AGENTS.md` از قبل وجود دارد. OpenCode می‌تواند هنگام `/init` تلاش کند آن را تغییر دهد.

## اتصال MiMo

در OpenCode:

```text
/connect
```

Provider مربوط به Xiaomi/MiMo را انتخاب کن و Credential را فقط در محیط کاربر وارد کن. API key، Token Plan key و Base URL اختصاصی نباید در Repository، Prompt، Issue، PR، Log یا Screenshot ذخیره شوند.

برای MiMo از OpenAI-compatible protocol استفاده شود. در Agent workflowهای چندمرحله‌ای، Anthropic-compatible protocol ممکن است به‌علت `reasoning_content` در Tool-callهای چنددور خطا ایجاد کند.

پس از اتصال:

```text
/models
```

مدل مناسب را انتخاب کن. نام مدل در فایل‌های Repository Hardcode نشده است تا Provider switching ساده بماند.

## شروع امن

در OpenCode ابتدا Plan mode را نگه دار و اجرا کن:

```text
/launch-preflight
```

این فرمان باید بدون انتشار عمومی وضعیت Repository، Pull Requestهای Launch، تست‌ها، Build، UTM، Launch Log و Privacy را بررسی کند.

بعد از Preflight موفق، برای آماده‌سازی فقط یک کانال:

```text
/launch-owner LinkedIn FA
```

یا نام یک کانال دیگر. Agent باید Preview کامل را نشان دهد و قبل از عمل برگشت‌ناپذیر متوقف شود.

## Prompt دستی معادل

متن زیر را می‌توان مستقیماً به Agent `launch-operator` داد:

```text
Read AGENTS.md and docs/OPENCODE_LAUNCH_EXECUTION_PROMPT.fa.md first.

Work only on alirezasafaei-dev/awesome-free-llm-apis-ir.
Start with a read-only launch preflight. Inspect current main, working tree, launch-related pull requests, docs/LAUNCH_LOG.md, artifacts/owner-actions/README.md, and the relevant channel packet.

Run:
- npm ci
- npm test
- npm run site:build

Do not deploy, merge, close issues, publish releases, modify DNS, or expose credentials.
Do not publish/send/submit/make-public any external content without a fresh exact approval for one channel, one account, one final text hash, one asset set, and one destination.

For an owner-account action, display CHANNEL, LAUNCH_ID, ACCOUNT_DISPLAY_NAME, DESTINATION, FINAL_TEXT, FINAL_TEXT_SHA256, ASSETS, UTM_URL, and IRREVERSIBLE_ACTION. Stop before the irreversible action.

After a real publication, verify PUBLIC_URL and PUBLISHED_AT_UTC. Update only that Launch Log row on a non-default branch, rerun tests, and open a draft PR. Never merge.

If the provider reaches a limit, stop without repeating edits and return a handoff containing branch, base SHA, head SHA, last successful command, current git status, changed files, failing command, and next exact action.
```

## Provider fallback بدون از دست رفتن کار

هنگام نزدیک‌شدن به Rate limit:

1. Agent باید اجرای Tool جدید را متوقف کند.
2. `git status --short` و `git diff --stat` را ثبت کند.
3. تغییر کامل و تست‌پذیر را Commit کند؛ تغییر ناقص Commit نشود مگر با برچسب واضح WIP و تأیید مالک.
4. Handoff زیر را تولید کند:

```text
HANDOFF_STATUS=
PROVIDER=
MODEL=
BRANCH=
BASE_SHA=
HEAD_SHA=
LAST_SUCCESSFUL_COMMAND=
LAST_TEST_RESULT=
UNCOMMITTED_FILES=
BLOCKED_COMMAND=
NEXT_EXACT_ACTION=
```

5. در OpenCode با `/models` Provider یا Model عوض شود.
6. Agent جدید ابتدا `AGENTS.md`، این فایل و Handoff را بخواند.
7. کار از `NEXT_EXACT_ACTION` ادامه پیدا کند؛ مراحل قبلی کورکورانه تکرار نشوند.

ترتیب پیشنهادی:

```text
MiMo primary
→ MiMo secondary model or region
→ OpenCode free/connected model
→ ChatGPT Plus/Pro or GitHub Copilot connection
→ local model for read-only/simple work
```

Quota مدل‌های مختلف مشترک فرض نشود. اگر یک Token Plan میان ابزارها مشترک است، تعویض Hermes به OpenCode همان سهمیه Provider را مصرف می‌کند؛ مزیت OpenCode امکان تعویض سریع Provider است، نه ایجاد سهمیه نامحدود.

## مرز عملیات حساب‌های مالک

OpenCode در حالت استاندارد Terminal agent است و نباید Cookie یا Browser session حساب‌های اجتماعی را دریافت کند. برای انتشارها:

- Agent متن، Asset، UTM، Hash و Checklist را آماده می‌کند.
- مالک در Browser رسمی Preview را بررسی می‌کند.
- انتشار با Approval مستقل همان کانال انجام می‌شود.
- Public URL و UTC به Agent داده می‌شوند یا از صفحه عمومی استخراج می‌شوند.
- Agent فقط Launch Log و Draft PR را آماده می‌کند.

اگر Browser automation در آینده اضافه شد، باید در Profile جدا، بدون Export Cookie، با Approval قبل از هر عمل برگشت‌ناپذیر و بدون ذخیره اطلاعات حساب اجرا شود.

## عملیات ممنوع

- `opencode --auto` برای این Workflow
- Force push یا Push مستقیم به `main`
- Merge خودکار
- Deployment یا تغییر DNS
- ذخیره Credential در `opencode.json`
- Session sharing
- دسترسی به مسیرهای خارج از Worktree
- Mass post، Mass DM، Scraping contact list یا درخواست رأی
- اعلام `PUBLISHED` بدون Public URL واقعی
- عددسازی برای Analytics

## خروجی نهایی هر Session

```text
STATUS=
PROVIDER=
MODEL=
BRANCH=
BASE_SHA=
HEAD_SHA=
FILES_CHANGED=
TESTS_RUN=
TEST_RESULTS=
CHANNEL=
LAUNCH_ID=
PUBLICATION_ACTION=
PUBLIC_URL=
PUBLISHED_AT_UTC=
DRAFT_PR_URL=
BLOCKERS=
NEXT_SINGLE_ACTION=
```
