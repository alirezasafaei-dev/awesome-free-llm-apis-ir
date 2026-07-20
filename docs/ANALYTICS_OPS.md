# Analytics Operations

## Infrastructure

| Component | URL | Server |
|---|---|---|
| Plausible Dashboard | https://analytics.persiantoolbox.ir/ | Automation (91.107.153.223) |
| Plausible Event API | `POST /api/event` | Automation (Caddy → 127.0.0.1:8002) |
| Tracker (same-origin) | `llm.persiantoolbox.ir/plausible.js` | Automation (Caddy → Plausible) |

## Caddy Config

The analytics subdomain is served by Caddy on the automation server:

```
/etc/caddy/sites-enabled/
├── llm.persiantoolbox.ir.caddy
└── analytics.persiantoolbox.ir.caddy
```

Source files in repo:
- `deploy/caddy/llm.persiantoolbox.ir.caddy`
- `deploy/caddy/analytics.persiantoolbox.ir.caddy`

### Deploy Caddy Config

```bash
cd awesome-free-llm-apis-ir
git pull

# Upload and apply
cat deploy/caddy/analytics.persiantoolbox.ir.caddy | ssh asdev@91.107.153.223 "cat > /tmp/analytics.persiantoolbox.ir.caddy.new"
ssh -t asdev@91.107.153.223 "sudo cp /tmp/analytics.persiantoolbox.ir.caddy.new /etc/caddy/sites-enabled/analytics.persiantoolbox.ir.caddy && sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy"
```

For full deploy including both sites, run `bash deploy-csp.sh`.

## SSH Access

Passwordless SSH key is configured for `asdev@91.107.153.223`:

- Private key: `~/.ssh/asdev-automation`
- SSH config in `~/.ssh/config` auto-selects this key for `asdev`/`91.107.153.223`
- Sudo still requires password

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| TLS alert internal error | Missing Caddy site block | Deploy `analytics.persiantoolbox.ir.caddy` |
| Plausible dashboard 502 | Docker container down | `docker ps \| grep plausible` |
| Events not ingested | Port 8002 not listening | `sudo ss -tlnp \| grep 8002` |
