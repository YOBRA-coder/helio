# Deploying Helios Desk on a VPS (24/7)

Two processes must run all the time: the **web app** (the UI) and the **worker** (the trading desk loop). Both read the same
data folder. Pick Option A (Docker, easiest) or Option B (plain Node + systemd).

## Before you start
- A small Linux VPS is enough (1 vCPU, 1 GB RAM, Ubuntu 22.04/24.04). Choose a region where Polymarket allows trading.
  Run `npm run doctor` on the server afterwards; it prints whether Polymarket would block live orders from there.
- A domain name pointed at the server (A record) if you want HTTPS. Do not expose the app over plain http: it handles passwords and trading keys.
- Generate the master key (it encrypts saved keys; keep a copy somewhere safe, losing it makes saved keys unreadable):
  `openssl rand -base64 32`

## Option A: Docker
```bash
# 1. install docker
curl -fsSL https://get.docker.com | sh

# 2. put the project on the server (scp/rsync/git), then:
cd Helios-grok
cp .env.example .env
nano .env        # set HELIOS_MASTER_KEY, HELIOS_COOKIE_SECURE=1, and HELIOS_ALLOW_SIGNUP=1 for now
nano Caddyfile   # put your domain in

docker compose up -d --build
docker compose logs -f worker      # should show the desk loop starting
```
Open `https://your-domain`, create your account, then set `HELIOS_ALLOW_SIGNUP=0` in `.env` and run `docker compose up -d` so nobody else can sign up.

Update later: copy the new files, `docker compose up -d --build`. Your data lives in the `helios-data` volume and survives rebuilds.

## Option B: Node + systemd
```bash
# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs

sudo useradd -r -m -d /opt/helios helios
# copy the project into /opt/helios/app, then as the helios user:
cd /opt/helios/app && cp .env.example .env && nano .env   # HELIOS_MASTER_KEY, HELIOS_DATA_DIR=/opt/helios/data, HELIOS_COOKIE_SECURE=1
npm ci && npm run build:vps
mkdir -p /opt/helios/data
```
`/etc/systemd/system/helios-web.service`
```ini
[Unit]
Description=Helios web
After=network-online.target
[Service]
User=helios
WorkingDirectory=/opt/helios/app
EnvironmentFile=/opt/helios/app/.env
Environment=PORT=3000 HOST=127.0.0.1 NODE_ENV=production
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always
[Install]
WantedBy=multi-user.target
```
`/etc/systemd/system/helios-worker.service`
```ini
[Unit]
Description=Helios worker
After=network-online.target
[Service]
User=helios
WorkingDirectory=/opt/helios/app
EnvironmentFile=/opt/helios/app/.env
ExecStart=/usr/bin/node --experimental-strip-types --no-warnings worker/desk-worker.ts
Restart=always
[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload && sudo systemctl enable --now helios-web helios-worker
journalctl -u helios-worker -f
```
HTTPS: install Caddy (`sudo apt install caddy`), put the `Caddyfile` from this folder at `/etc/caddy/Caddyfile` with your domain, `sudo systemctl reload caddy`.

## Lock the server down
```bash
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
```
- SSH keys only, no password logins. Keep the OS updated.
- Never open port 3000 to the internet; only Caddy talks to it.
- Back up the data folder (or use Account > Download backup) regularly. The master key must be backed up separately and never stored next to the data.

## Going live from a server
- Saved Polymarket keys sit on this machine, encrypted, but the master key is on the same machine. If someone gets into the server they can get the keys.
  Use a dedicated wallet with only the money you are prepared to lose.
- Live also needs `HELIOS_LIVE_ENABLED=1` in `.env`, a passed paper trial, and arming from the Live page. Run dry-run first.
- Check `npm run doctor` (or `docker compose exec web npm run doctor`) shows the geoblock line as allowed.

## Health checks
- Worker alive: the top bar of the app shows the worker status; it turns stale if the heartbeat is older than 20 seconds.
- Phone alerts: set an ntfy URL on the Account page. You get a message when trades settle and a daily summary. A silent day can mean the worker died, so also check the app.

## Render, Railway, Fly (one container)
These hosts run one process per service, so the Docker image's default command (`scripts/start-all.mjs`) starts the web app **and** the worker together.
1. New Web Service from this repo, runtime **Docker**.
2. Environment: `HELIOS_MASTER_KEY` (required), `HELIOS_COOKIE_SECURE=1`, `HELIOS_DATA_DIR=/data`, `HELIOS_ALLOW_SIGNUP=1` until you have an account, then `0`.
3. **Add a persistent disk mounted at `/data`.** Without it, every deploy or restart wipes users, keys and the trial record.
4. **Use an always-on paid instance.** Free instances go to sleep after about 15 minutes without visitors, which also stops the worker, so a "week-long" paper trial would not run.
5. Do not run a separate "background worker" service: services cannot share a disk, so the worker would never see your desk. The single container is correct.
6. Open `https://<your-service>.onrender.com`, sign up, then check the Desk page: the "worker has not started" banner should clear within about 10 seconds.
