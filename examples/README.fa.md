# نمونه‌کدها

نمونه‌ها فقط از کتابخانهٔ استاندارد Python استفاده می‌کنند و هیچ کلیدی در کد ندارند.

## APIهای سازگار با OpenAI

```bash
export GROQ_API_KEY='...'
python3 examples/python/openai_compatible.py groq
```

Providerهای قابل انتخاب: `openrouter`، `groq`، `github-models`، `google-gemini`، `hugging-face-inference`، `cerebras`، `cloudflare-workers-ai`، `mistral`، `sambanova` و `nvidia-nim`.

برای Cloudflare متغیر `CLOUDFLARE_ACCOUNT_ID` نیز لازم است. Model ID را می‌توان با متغیر `<PROVIDER>_MODEL` تغییر داد.

## Cohere

```bash
export COHERE_API_KEY='...'
python3 examples/python/cohere.py
```

کلیدها را در فایل، Commit، Screenshot یا خروجی عمومی قرار ندهید.

