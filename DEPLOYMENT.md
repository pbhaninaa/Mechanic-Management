# What to set where – Railway (Backend + DB) and Vercel (Frontend)

---

## 1. Railway (Backend + Database)

In your **Railway project** (backend service), open **Variables** and set:

### Required

| Variable | Where to get it | Example |
|----------|-----------------|---------|
| `SPRING_DATASOURCE_URL` | Railway MySQL: **Connect** → **MySQL URL** (or build JDBC from host/port). Use the **private** URL if backend is in same project. | `jdbc:mysql://containers-us-west-xxx.railway.app:6432/railway?useSSL=true&serverTimezone=UTC` |
| `SPRING_DATASOURCE_USERNAME` | Railway MySQL → **Variables** (often `root`) | `root` |
| `SPRING_DATASOURCE_PASSWORD` | Railway MySQL → **Variables** | (from Railway) |
| `JWT_SECRET` | Generate a long random string (min 64 chars). E.g. `openssl rand -base64 48` | `your_64_char_secret_...` |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → **Secret key** (use `sk_live_...` for prod) | `sk_live_...` |
| `MAIL_USERNAME` | Your SMTP login (e.g. Gmail address) | `you@gmail.com` |
| `MAIL_PASSWORD` | SMTP password (e.g. [Gmail App Password](https://myaccount.google.com/apppasswords)) | (16-char app password) |
| `MAIL_FROM` | Same as sender; usually same as `MAIL_USERNAME` | `you@gmail.com` |

### Frontend URL (for emails and CORS)

| Variable | Value | Notes |
|----------|--------|------|
| `APP_FRONTEND_URL` | Your **Vercel production URL** (no trailing slash) | e.g. `https://mechanic-management-4m995c2rk-pbhanina-5058s-projects.vercel.app` |
| `APP_FRONTEND_ALLOWED_ORIGINS` | Optional. Comma-separated origins for CORS and link resolution. | e.g. `https://mechanic-management-4m995c2rk-pbhanina-5058s-projects.vercel.app,https://your-preview.vercel.app` |

### Profile

| Variable | Value |
|----------|--------|
| `SPRING_PROFILES_ACTIVE` | `prod` |

### Optional (defaults in code)

- `MAIL_HOST` – default `smtp.gmail.com`
- `MAIL_PORT` – default `587`
- `JWT_EXPIRATION_MS` – default `3600000` (1 hour)

---

## 2. Vercel (Frontend – WebApp)

In your **Vercel project** → **Settings** → **Environment Variables**, add:

### Required

| Variable | Value | Environment |
|----------|--------|-------------|
| `VITE_API_URL` | Your **Railway backend URL** + `/api` (no trailing slash) | Production (and Preview if you use it) |
| `VITE_APP_ENV` | `production` | Production |

**Example:** If your Railway backend is `https://your-backend.up.railway.app`, set:
- `VITE_API_URL` = `https://your-backend.up.railway.app/api`

### Optional (for Stripe card UI)

| Variable | Value |
|----------|--------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe **Publishable key** (e.g. `pk_live_...`) from [Stripe API Keys](https://dashboard.stripe.com/apikeys) |

---

## 3. Quick checklist

**Railway (backend service)**  
- [ ] `SPRING_PROFILES_ACTIVE` = `prod`  
- [ ] `SPRING_DATASOURCE_URL` (from Railway MySQL)  
- [ ] `SPRING_DATASOURCE_USERNAME`  
- [ ] `SPRING_DATASOURCE_PASSWORD`  
- [ ] `JWT_SECRET` (min 64 chars)  
- [ ] `STRIPE_SECRET_KEY`  
- [ ] `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`  
- [ ] `APP_FRONTEND_URL` = your Vercel app URL  

**Vercel (WebApp)**  
- [ ] `VITE_API_URL` = `https://YOUR-RAILWAY-APP.up.railway.app/api`  
- [ ] `VITE_APP_ENV` = `production`  

After changing env vars on **Vercel**, trigger a new deployment (redeploy) so the build picks them up.
