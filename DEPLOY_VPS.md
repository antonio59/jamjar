# Deploying to Hostinger VPS

## Prerequisites

- Hostinger VPS (or any Ubuntu/Debian VPS)
- SSH access to your VPS
- Domain name (e.g., `antoniosmith.xyz`)
- DNS access to create subdomain records

## Quick Deploy (5 minutes)

### 1. SSH into your VPS

```bash
ssh root@your-vps-ip
```

### 2. Run the deployment script

```bash
curl -O https://raw.githubusercontent.com/antonio59/jamjar/main/deploy-vps.sh
chmod +x deploy-vps.sh
sudo bash deploy-vps.sh
```

The script will:
- Install Node.js, Nginx, yt-dlp, Certbot
- Clone the repo to `/opt/jamjar`
- Set up systemd service
- Configure Nginx reverse proxy
- Get SSL certificate
- Seed the database

### 3. Configure DNS

In your DNS provider (Hostinger, Cloudflare, etc.):

```
Type: A
Name: music
Value: <your-vps-ip>
TTL: Automatic
```

Wait 5-30 minutes for DNS propagation.

### 4. Access the app

Open `https://jamjar.antoniosmith.xyz` in your browser.

## Post-Deployment

### Change the Seed PINs

The deploy script writes random first-run PINs to `/opt/jamjar/.env`
(`PARENT_PIN`, `CRISTINA_PIN`, `ISABELLA_PIN`). To change them later, log in as
parent → Settings → rotate the PIN there. To re-seed from scratch:

```bash
cd /opt/jamjar
# edit .env with the PINs you want
rm -rf data/
node seed.js
systemctl restart jamjar
```

### Add YouTube API Key (Optional)

Edit `/opt/jamjar/.env`:

```env
YOUTUBE_API_KEY=your_key_here
# Optional: AI clean-version check for unlabelled tracks (TypeSafe Jev)
TYPESAFE_API_KEY=your_typesafe_key_here
```

Then restart:

```bash
systemctl restart jamjar
```

## Managing the Service

### Check status

```bash
systemctl status jamjar
```

### View logs

```bash
journalctl -u jamjar -f
```

### Restart

```bash
systemctl restart jamjar
```

### Stop

```bash
systemctl stop jamjar
```

### Update the app

```bash
cd /opt/jamjar
git pull origin main
pnpm install
systemctl restart jamjar
```

## Troubleshooting

### App not accessible

1. Check service status: `systemctl status jamjar`
2. Check logs: `journalctl -u jamjar -f`
3. Check Nginx: `systemctl status nginx`
4. Check DNS: `nslookup jamjar.antoniosmith.xyz`

### SSL not working

```bash
sudo certbot renew --dry-run
sudo systemctl reload nginx
```

### Downloads fail with "Sign in to confirm you're not a bot"

YouTube aggressively bot-checks datacenter IPs. The deploy script installs a
PO-token provider (bgutil) automatically, but on a flagged IP the player API
still demands a logged-in session — you must supply account cookies:

1. In a **private/incognito** browser window, log in to YouTube (a dedicated
   Google account is recommended — the VPS IP will be associated with it).
2. Export cookies in Netscape format — e.g. the "Get cookies.txt LOCALLY"
   browser extension — while on `youtube.com`.
3. Close the incognito window immediately (prevents YouTube rotating them).
4. Upload to the VPS and point the app at it:

   ```bash
   scp yt-cookies.txt root@<vps-ip>:/opt/jamjar/yt-cookies.txt
   # on the VPS:
   echo 'YTDLP_COOKIES_FILE=/opt/jamjar/yt-cookies.txt' >> /opt/jamjar/.env
   systemctl restart jamjar
   ```

Verify: `journalctl -u jamjar -f` while retrying a request, or run
`sudo -u jamjar yt-dlp --cookies /opt/jamjar/yt-cookies.txt --simulate --print title <url>`.
Cookies rotate — expect to re-export every few weeks/months if failures return.

### Database errors

```bash
cd /opt/jamjar
rm -rf data/
node seed.js
systemctl restart jamjar
```

### Port conflict

Edit `/opt/jamjar/.env` and change `PORT=3001` to another port, then:

```bash
systemctl restart jamjar
```

## Security Notes

- The app runs as a restricted system user (`jamjar`)
- `ACCESS_TOKEN_SECRET` is auto-generated (256-bit random)
- SSL is enforced via Let's Encrypt
- Database is stored in `/opt/jamjar/data/`
- Downloads are stored in `/opt/jamjar/downloads/`

**For production:**
- Change default PINs immediately
- Set up firewall rules (ufw allow 80, 443, 22)
- Enable automatic security updates: `apt install unattended-upgrades`
- Regular backups of `/opt/jamjar/data/`

## Backup & Restore

### Backup

```bash
sudo tar czf jamjar-backup.tar.gz /opt/jamjar/data/
```

### Restore

```bash
sudo tar xzf jamjar-backup.tar.gz -C /
systemctl restart jamjar
```

## Cost

- **Hostinger VPS:** ~$5-10/mo (depending on plan)
- **Domain:** ~$10/year
- **SSL:** Free (Let's Encrypt)
- **Total:** ~$6-11/mo

## Alternative VPS Providers

- **DigitalOcean:** $6/mo (Droplet)
- **Hetzner:** €5/mo (Cloud VPS)
- **Linode:** $5/mo (Nanode)
- **Oracle Cloud:** Free tier (4 ARM cores, 24GB RAM)

All work with the same deployment script.
