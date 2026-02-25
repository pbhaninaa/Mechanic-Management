# MechConnect Deployment – HTTPS

## Development (Vite dev server)

The WebApp is configured for HTTPS in development:

```bash
npm run dev
```

The app will be available at **https://localhost:3000** (or https://YOUR-IP:3000).

**Note:** The browser will show a security warning for the self-signed certificate. Click "Advanced" → "Proceed to localhost" to continue. This is expected for local dev.

---

## Production – Option A: Nginx

1. Build the app: `npm run build:prod`
2. Copy `dist/` to your server (e.g. `/var/www/mechconnect/dist`)
3. Edit `nginx-https.conf`: replace `yourdomain.com` with your domain
4. Get TLS certs: `certbot --nginx -d yourdomain.com`
5. Enable the site and reload: `nginx -s reload`

---

## Production – Option B: Caddy

1. Build the app: `npm run build:prod`
2. Copy `dist/` to `/var/www/mechconnect/dist`
3. Edit `Caddyfile`: replace `yourdomain.com` with your domain
4. Run: `caddy run` (Caddy fetches and renews certs automatically)
