---
title: "استفاده از API رایگان هوش مصنوعی در Node.js با Base URL سفارشی"
slug: "use-free-llm-api-nodejs"
translation_key: "use-free-llm-api-nodejs"
description: "آموزش عملی اتصال Node.js به APIهای سازگار با OpenAI، مدیریت متغیرهای محیطی، Streaming، Timeout، Retry، خطاها و ساخت Endpoint امن برای چت‌بات."
primary_keyword: "API رایگان هوش مصنوعی Node.js"
secondary_keywords:
  - "OpenAI compatible Node.js"
  - "ساخت چت بات با جاوااسکریپت"
  - "Base URL سفارشی OpenAI"
canonical_target: "https://llm.persiantoolbox.ir/guides/use-free-llm-api-nodejs/"
updated_at: "2026-07-17"
status: "READY_FOR_SITE"
---

# استفاده از API رایگان هوش مصنوعی در Node.js با Base URL سفارشی

در این آموزش یک Client قابل تعویض در Node.js می‌سازیم که به Providerهای سازگار با OpenAI API متصل می‌شود. API Key داخل سورس قرار نمی‌گیرد، تنظیمات از متغیر محیطی خوانده می‌شوند و خطاهای مهم مانند `401`، `404`، `429`، Timeout و اختلال موقت سرویس جدا مدیریت می‌شوند.

برای انتخاب Provider، Base URL و Model ID از [کاتالوگ APIهای رایگان LLM برای ایران](https://llm.persiantoolbox.ir/) استفاده کنید. شرایط سهمیه، مدل و دسترسی ممکن است تغییر کند؛ بنابراین صفحه اختصاصی Provider و مستندات رسمی را پیش از اجرا بررسی کنید.

## چرا Base URL سفارشی مهم است؟

بسیاری از Providerها ساختار درخواست شبیه OpenAI ارائه می‌کنند. در این حالت می‌توان با همان SDK و با تغییر این سه مقدار، سرویس را عوض کرد:

```text
LLM_API_KEY
LLM_BASE_URL
LLM_MODEL
```

این طراحی وابستگی برنامه به یک Provider را کمتر می‌کند، اما تضمین نمی‌کند همه قابلیت‌ها دقیقاً یکسان باشند. تفاوت در Tool Calling، Structured Output، Streaming، Embedding، طول Context و فرمت خطا باید جداگانه تست شود.

## ساخت پروژه

نسخه ۲۰ یا جدیدتر Node.js برای این نمونه مناسب است.

```bash
mkdir node-llm-chat
cd node-llm-chat
npm init -y
npm install openai dotenv
```

در `package.json` حالت ES Module را فعال کنید:

```json
{
  "name": "node-llm-chat",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/chat.js"
  },
  "dependencies": {
    "dotenv": "^16.0.0",
    "openai": "^5.0.0"
  }
}
```

اعداد نسخه فقط نمونه‌اند. در پروژه واقعی نسخه‌ای را Pin کنید که در CI تست شده است.

ساختار پیشنهادی:

```text
node-llm-chat/
├── src/
│   ├── client.js
│   └── chat.js
├── .env
├── .env.example
├── .gitignore
└── package.json
```

## تنظیم امن متغیرهای محیطی

فایل `.env`:

```dotenv
LLM_API_KEY=replace_me
LLM_BASE_URL=https://provider.example/v1
LLM_MODEL=MODEL_ID
```

فایل `.env.example`:

```dotenv
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
```

فایل `.gitignore`:

```gitignore
.env
.env.*
!.env.example
node_modules/
*.log
```

API Key نباید در Repository، Frontend، Screenshot، Issue یا Log عمومی قرار بگیرد. برای Production از Secret Manager سرویس استقرار استفاده کنید.

## ساخت Client مشترک

فایل `src/client.js`:

```javascript
import "dotenv/config";
import OpenAI from "openai";

const required = ["LLM_API_KEY", "LLM_BASE_URL", "LLM_MODEL"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}

export const model = process.env.LLM_MODEL;

export const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
  timeout: 30_000,
  maxRetries: 2,
});
```

بررسی متغیرها در شروع برنامه باعث می‌شود خطای تنظیمات به‌جای یک رفتار مبهم، زود و روشن دیده شود.

## ارسال اولین درخواست

فایل `src/chat.js`:

```javascript
import { client, model } from "./client.js";

const messages = [
  {
    role: "system",
    content: "به فارسی، دقیق و کوتاه پاسخ بده.",
  },
  {
    role: "user",
    content: "سه کاربرد مدل زبانی در برنامه‌نویسی را نام ببر.",
  },
];

try {
  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
  });

  const answer = response.choices?.[0]?.message?.content;
  console.log(answer ?? "پاسخی دریافت نشد.");
} catch (error) {
  console.error("Request failed:", error?.status ?? error?.name ?? "unknown");
  process.exitCode = 1;
}
```

اجرا:

```bash
npm start
```

اگر `404` یا `model_not_found` گرفتید، Base URL و Model ID را دوباره با مستندات رسمی مقایسه کنید. نام نمایشی مدل در Dashboard همیشه همان Model ID قابل استفاده در API نیست.

## خطاهای رایج و مدیریت تخصصی

بهتر است خطاها بر اساس کد وضعیت تفکیک شوند:

```javascript
function explainApiError(error) {
  const status = error?.status;

  if (status === 400) {
    return "درخواست نامعتبر است؛ پارامترها و اندازه Context را بررسی کنید.";
  }
  if (status === 401) {
    return "API Key معتبر نیست یا Header احراز هویت پذیرفته نشده است.";
  }
  if (status === 403) {
    return "حساب، منطقه یا مدل مجوز اجرای این درخواست را ندارد.";
  }
  if (status === 404) {
    return "Base URL، مسیر Endpoint یا Model ID پیدا نشد.";
  }
  if (status === 429) {
    return "Rate Limit یا سهمیه حساب پر شده است.";
  }
  if (status >= 500) {
    return "سرویس موقتاً دچار اختلال است.";
  }

  return "اتصال یا درخواست ناموفق بود.";
}
```

در Log، API Key، Header کامل، Cookie، Prompt خصوصی و پاسخ حساس را چاپ نکنید. برای بررسی Production معمولاً کد وضعیت، Request ID پاک‌سازی‌شده، Provider، Model و زمان کافی است.

راهنمای مرتبط: [رفع خطای 401، 403 و Model Not Found](https://llm.persiantoolbox.ir/guides/fix-llm-api-401-403-model-not-found/)

## Streaming در Node.js

Streaming باعث می‌شود متن پاسخ به‌تدریج نمایش داده شود:

```javascript
import { client, model } from "./client.js";

const stream = await client.chat.completions.create({
  model,
  messages: [
    { role: "user", content: "یک توضیح کوتاه درباره RAG بده." },
  ],
  stream: true,
});

for await (const event of stream) {
  const text = event.choices?.[0]?.delta?.content;
  if (text) process.stdout.write(text);
}

process.stdout.write("\n");
```

پشتیبانی Streaming و ساختار Eventها را برای Provider انتخابی تست کنید. قطع‌شدن Stream به معنی قابل استفاده بودن پاسخ ناقص نیست؛ برنامه باید تصمیم بگیرد پاسخ نیمه‌کاره نمایش، ذخیره یا حذف شود.

## Timeout و AbortController

برای عملیات کاربرمحور، درخواست نامحدود مناسب نیست. علاوه بر Timeout تنظیم‌شده در Client، می‌توانید Cancellation سمت برنامه داشته باشید:

```javascript
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 20_000);

try {
  const response = await client.chat.completions.create(
    {
      model,
      messages: [{ role: "user", content: "سلام" }],
    },
    { signal: controller.signal },
  );

  console.log(response.choices[0].message.content);
} finally {
  clearTimeout(timer);
}
```

رفتار `signal` می‌تواند با نسخه SDK و Provider متفاوت باشد؛ در CI و محیط واقعی تست کنید.

## Retry را در یک لایه نگه دارید

اگر SDK، Reverse Proxy و کد Application هم‌زمان Retry کنند، یک درخواست می‌تواند چندین بار تکرار شود. برای درخواست‌های LLM این موضوع سهمیه را سریع مصرف می‌کند و در Agentها ممکن است عملیات خارجی تکرار شود.

قواعد عملی:

- برای `401`، `403` و `404` Retry نکنید.
- برای `429` به `Retry-After` و نوع سهمیه توجه کنید.
- برای `5xx` و خطای شبکه Retry محدود با Backoff داشته باشید.
- تعداد تلاش و حداکثر زمان کل را محدود کنید.
- برای عملیات دارای اثر جانبی Idempotency طراحی کنید.

راهنمای کامل: [مدیریت Rate Limit و خطای 429](https://llm.persiantoolbox.ir/guides/llm-api-rate-limit-429/)

## ساخت Endpoint امن با Express

API Key نباید مستقیماً در مرورگر قرار گیرد. Frontend باید به Backend شما درخواست بدهد و Backend با Provider ارتباط برقرار کند.

```bash
npm install express
```

نمونه ساده:

```javascript
import express from "express";
import { client, model } from "./client.js";

const app = express();
app.use(express.json({ limit: "32kb" }));

app.post("/api/chat", async (req, res) => {
  const message = String(req.body?.message ?? "").trim();

  if (!message || message.length > 4000) {
    return res.status(400).json({ error: "invalid_message" });
  }

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: message }],
    });

    return res.json({
      answer: response.choices?.[0]?.message?.content ?? "",
    });
  } catch (error) {
    const status = error?.status === 429 ? 429 : 502;
    return res.status(status).json({ error: "llm_request_failed" });
  }
});

app.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
```

این نمونه برای Production کامل نیست. Authentication کاربر، Rate Limit داخلی، CORS محدود، Monitoring، صف، Timeout و سیاست نگهداری داده باید اضافه شوند.

## کنترل مصرف Context

تاریخچه مکالمه با هر پیام بزرگ‌تر می‌شود. ارسال کل تاریخچه می‌تواند به خطای Context، TPM بالا و Latency زیاد منجر شود.

راهکارها:

- فقط پیام‌های اخیر و مرتبط را بفرستید.
- پیام‌های قدیمی را خلاصه کنید.
- سقف طول ورودی کاربر تعریف کنید.
- System Prompt ثابت را کوتاه نگه دارید.
- پاسخ‌های قابل استفاده مجدد را Cache کنید.
- برای RAG فقط قطعات با امتیاز مناسب را ارسال کنید.

کاهش Context باید با تست کیفیت انجام شود؛ حذف کورکورانه پیام‌های قبلی می‌تواند پاسخ را بی‌ربط کند.

## ساخت Provider Adapter

برای کاهش وابستگی، منطق Provider را پشت یک تابع مشترک نگه دارید:

```javascript
export async function generateText({ messages }) {
  const response = await client.chat.completions.create({
    model,
    messages,
  });

  return {
    text: response.choices?.[0]?.message?.content ?? "",
    provider: new URL(process.env.LLM_BASE_URL).hostname,
    model,
  };
}
```

بقیه برنامه نباید مستقیماً به ساختار داخلی SDK وابسته باشد. در پروژه بزرگ‌تر می‌توانید Adapter جدا برای Providerهای ناسازگار داشته باشید.

## امنیت داده و Prompt

پیش از ارسال داده به API:

- اطلاعات شخصی و Secret را حذف کنید.
- داده سازمانی محرمانه را بدون مجوز ارسال نکنید.
- سیاست نگهداری داده Provider را بررسی کنید.
- خروجی مدل را قبل از اجرای Shell، SQL یا عملیات مالی اعتبارسنجی کنید.
- در RAG، Prompt Injection داخل سند را به‌عنوان ورودی غیرقابل اعتماد در نظر بگیرید.
- پاسخ مدل را Fact قطعی فرض نکنید.

## چک‌لیست Production

- API Key فقط در Backend و Secret Manager است.
- Base URL و Model از Environment خوانده می‌شوند.
- ورودی محدود و اعتبارسنجی می‌شود.
- Timeout و Cancellation تعریف شده‌اند.
- Retry محدود و فقط در یک لایه است.
- خطاهای 401، 403، 404 و 429 جدا ثبت می‌شوند.
- Prompt و پاسخ حساس وارد Log نمی‌شوند.
- Rate Limit سمت برنامه وجود دارد.
- Provider جایگزین و مسیر Failover تست شده است.
- Dashboard مصرف و خطا دارید.

## راهنماهای مرتبط

- [راهنمای API رایگان هوش مصنوعی](https://llm.persiantoolbox.ir/guides/free-ai-api/) — نمای کلی APIهای رایگان هوش مصنوعی
- [ساخت چت‌بات فارسی با Python](https://llm.persiantoolbox.ir/guides/build-persian-chatbot-python/) — آموزش چت‌بات Python
- [راهنمای عملی API رایگان در ایران](https://llm.persiantoolbox.ir/guides/practical-free-llm-api-iran/) — از ثبت‌نام تا اولین درخواست

## منابع رسمی بررسی‌شده

آخرین بررسی: ۲۰۲۶-۰۷-۲۲.

- [مستندات متغیرهای محیطی Node.js](https://nodejs.org/api/environment_variables.html) — رفتار رسمی `process.env` و فایل‌های env.
- [مستندات AbortController در Node.js](https://nodejs.org/api/globals.html#class-abortcontroller) — مرجع رسمی لغو درخواست و timeout.
- [نمای کلی OpenAI API](https://developers.openai.com/api/reference/overview) — قرارداد رسمی احراز هویت و درخواست API.

## جمع‌بندی

اتصال Node.js به یک API سازگار با OpenAI ساده است، اما یک Integration قابل اتکا به مدیریت Secret، خطا، Timeout، Rate Limit و Context نیاز دارد. با جداکردن `LLM_API_KEY`، `LLM_BASE_URL` و `LLM_MODEL` می‌توانید Provider را با هزینه کمتری عوض کنید.

برای بررسی گزینه‌های فعلی و وضعیت دسترسی ایران، [کاتالوگ زنده](https://llm.persiantoolbox.ir/) را ببینید.

اگر یک Provider را از ایران تست کرده‌اید، نتیجه تاریخ‌دار و پاک‌سازی‌شده را در [GitHub پروژه](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/issues/new?template=iran-access-report.yml) ثبت کنید. هیچ API Key، Cookie یا اطلاعات حساب را منتشر نکنید.
