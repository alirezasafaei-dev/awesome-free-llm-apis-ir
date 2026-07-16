# بررسی Drift انتشار

```bash
main_sha="$(git rev-parse HEAD)"
canonical_sha="$(curl -fsS https://llm.persiantoolbox.ir/build-meta.json | jq -r .source_revision)"
iran_sha="$(curl -fsS https://ir.llm.persiantoolbox.ir/build-meta.json | jq -r .source_revision)"

printf 'main=%s\ncanonical=%s\niran=%s\n' "$main_sha" "$canonical_sha" "$iran_sha"

test "$canonical_sha" = "$main_sha"
test "$iran_sha" = "$main_sha"
```

خروجی Host، IP، User یا Secret نباید به گزارش عمومی افزوده شود.
