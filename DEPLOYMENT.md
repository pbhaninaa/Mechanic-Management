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

---

## 4. Exact variable names and value fields (prod deployment reference)

Use this when you are ready for prod: copy each **Variable** name into the platform’s “Name” field and put the described value in the “Value” field.

### Railway (Backend service) → Variables

| Variable (Name) | Value / What to put in the field |
|-----------------|----------------------------------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://HOST:PORT/DATABASE?useSSL=true&serverTimezone=UTC` — replace HOST, PORT, DATABASE with values from Railway MySQL (Connect / Variables). |
| `SPRING_DATASOURCE_USERNAME` | e.g. `root` — copy from Railway MySQL variables. |
| `SPRING_DATASOURCE_PASSWORD` | Copy from Railway MySQL variables. |
| `JWT_SECRET` | Your own long secret, at least 64 characters (e.g. run `openssl rand -base64 48` and use the output). |
| `STRIPE_SECRET_KEY` | `sk_live_...` — from Stripe Dashboard → API Keys → Secret key. |
| `MAIL_USERNAME` | Your Gmail address, e.g. `you@gmail.com`. |
| `MAIL_PASSWORD` | Gmail App Password (16 characters from [Google App Passwords](https://myaccount.google.com/apppasswords)). |
| `MAIL_FROM` | Same as sender email, e.g. `you@gmail.com`. |
| `APP_FRONTEND_URL` | Your Vercel app URL with no trailing slash, e.g. `https://mechanic-management-4m995c2rk-pbhanina-5058s-projects.vercel.app`. |
| `APP_FRONTEND_ALLOWED_ORIGINS` | (Optional) Comma-separated allowed origins, e.g. `https://mechanic-management-4m995c2rk-pbhanina-5058s-projects.vercel.app`. |

### Vercel (Frontend) → Environment Variables

| Variable (Name) | Value / What to put in the field | Environment |
|-----------------|----------------------------------|-------------|
| `VITE_API_URL` | `https://YOUR-RAILWAY-BACKEND.up.railway.app/api` — replace with your real Railway backend URL + `/api`. | Production (and Preview if you use it) |
| `VITE_APP_ENV` | `production` | Production (and Preview if you use it) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` — from Stripe Dashboard → API Keys → Publishable key. | Production (optional) |

---

## 5. Current setup (as set now)

Reference of how variables are currently set. Replace placeholders where noted.

### Railway (Backend) – Environment Variables (JSON)

Replace `APP_FRONTEND_URL` with your real Vercel URL if it changed. Add `STRIPE_SECRET_KEY` from Stripe Dashboard when using payments.

```json
{
  "SPRING_PROFILES_ACTIVE": "prod",
  "SPRING_DATASOURCE_URL": "jdbc:mysql://trolley.proxy.rlwy.net:21098/railway?useSSL=true&serverTimezone=UTC",
  "SPRING_DATASOURCE_USERNAME": "root",
  "SPRING_DATASOURCE_PASSWORD": "qWPrLlZDaTsQqBwJkdoFojZhiOTJRQwD",
  "JWT_SECRET": "THIS_IS_A_VERY_LONG_SECRET_KEY_AT_LEAST_64_BYTES_LONG_FOR_HS512___",
  "MAIL_USERNAME": "jaystarven@gmail.com",
  "MAIL_PASSWORD": "guuywhimnbdwjrls",
  "MAIL_FROM": "jaystarven@gmail.com",
  "APP_FRONTEND_URL": "https://mechanic-management-4m995c2rk-pbhanina-5058s-projects.vercel.app",
  "APP_FRONTEND_ALLOWED_ORIGINS": "https://mechanic-management-4m995c2rk-pbhanina-5058s-projects.vercel.app",
  "STRIPE_SECRET_KEY": ""
}
```

### Vercel (Frontend) – Environment Variables (JSON)

Replace `YOUR-RAILWAY-BACKEND` in `VITE_API_URL` with your actual Railway backend host (e.g. `your-app.up.railway.app`). Add `VITE_STRIPE_PUBLISHABLE_KEY` from Stripe if using card payments on frontend.

```json
{
  "VITE_API_URL": "https://YOUR-RAILWAY-BACKEND.up.railway.app/api",
  "VITE_APP_ENV": "production",
  "VITE_STRIPE_PUBLISHABLE_KEY": ""
}
```
