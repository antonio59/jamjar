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
curl -O https://raw.githubusercontent.com/antonio59/music-request-v2/main/deploy-vps.sh
chmod +x deploy-vps.sh
sudo bash deploy-vps.sh
```

The script will:
- Install Node.js, Nginx, yt-dlp, Certbot
- Clone the repo to `/opt/music-request`
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

Open `https://music.antoniosmith.xyz` in your browser.

**Default accounts:**
- Parent: `parent` / `9999`
- Cristina: `cristina` / `1234`
- Isabella: `isabella` / `5678`

## Post-Deployment

### Change Default PINs

Edit `/opt/music-request/seed.js` with new PINs, then:

```bash
cd /opt/music-request
rm -rf data/
node seed.js
systemctl restart music-request
```

### Add YouTube API Key (Optional)

Edit `/opt/music-request/.env`:

```env
YOUTUBE_API_KEY=your_key_here
```

Then restart:

```bash
systemctl restart music-request
```

### Add Internxt Credentials (Optional)

Edit `/opt/music-request/.env`:

```env
INTERNXT_EMAIL=your@email.com
INTERNXT_PASSWORD=your_password
INTERNXT_APP_KEY=your_app_key
```

Then restart:

```bash
systemctl restart music-request
```

## Managing the Service

### Check status

```bash
systemctl status music-request
```

### View logs

```bash
journalctl -u music-request -f
```

### Restart

```bash
systemctl restart music-request
```

### Stop

```bash
systemctl stop music-request
```

### Update the app

```bash
cd /opt/music-request
git pull origin main
npm install
systemctl restart music-request
```

## Troubleshooting

### App not accessible

1. Check service status: `systemctl status music-request`
2. Check logs: `journalctl -u music-request -f`
3. Check Nginx: `systemctl status nginx`
4. Check DNS: `nslookup music.antoniosmith.xyz`

### SSL not working

```bash
sudo certbot renew --dry-run
sudo systemctl reload nginx
```

### Database errors

```bash
cd /opt/music-request
rm -rf data/
node seed.js
systemctl restart music-request
```

### Port conflict

Edit `/opt/music-request/.env` and change `PORT=3001` to another port, then:

```bash
systemctl restart music-request
```

## Security Notes

- The app runs as a restricted system user (`music-request`)
- JWT secret is auto-generated (256-bit random)
- SSL is enforced via Let's Encrypt
- Database is stored in `/opt/music-request/data/`
- Downloads are stored in `/opt/music-request/downloads/`

**For production:**
- Change default PINs immediately
- Set up firewall rules (ufw allow 80, 443, 22)
- Enable automatic security updates: `apt install unattended-upgrades`
- Regular backups of `/opt/music-request/data/`

## Backup & Restore

### Backup

```bash
sudo tar czf music-request-backup.tar.gz /opt/music-request/data/
```

### Restore

```bash
sudo tar xzf music-request-backup.tar.gz -C /
systemctl restart music-request
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
