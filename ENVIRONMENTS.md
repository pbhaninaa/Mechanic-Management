# Environments: SIT, UAT, PROD

| Environment | Who uses it | Frontend (WebApp) | Backend | Connection |
|-------------|-------------|-------------------|---------|------------|
| **SIT** | Devs (local) | `npm run dev` → localhost:5173, uses `.env.sit` | Run locally on port 8080, profile `sit` | Frontend calls `http://localhost:8080/api` |
| **UAT** | Testers | Deploy to Vercel (build: `npm run build:uat`), set `VITE_API_URL` to Railway UAT backend | Deploy to Railway, set `SPRING_PROFILES_ACTIVE=uat`, `APP_FRONTEND_URL` = Vercel UAT URL | Deployed frontend ↔ deployed UAT backend |
| **PROD** | Live | Deploy to Vercel (build: `npm run build` or `npm run build:prod`), set `VITE_API_URL` to Railway PROD backend | Deploy to Railway, set `SPRING_PROFILES_ACTIVE=prod`, `APP_FRONTEND_URL` = Vercel PROD URL | Deployed frontend ↔ deployed PROD backend |

## WebApp (Vite)

- **SIT:** `.env.sit` → `VITE_API_URL=http://localhost:8080/api`, `VITE_APP_ENV=sit`. Run with `npm run dev`.
- **UAT:** `.env.uat` or Vercel env vars → `VITE_API_URL` = your Railway UAT backend URL (e.g. `https://backend-uat.xxx.up.railway.app/api`). Build: `npm run build:uat`.
- **PROD:** `.env.production` or Vercel env vars → `VITE_API_URL` = your Railway PROD backend URL. Build: `npm run build`.

Override `VITE_API_URL` in Vercel per project/environment so deployed UAT and PROD use the correct backend URLs.

## BackEnd (Spring Boot)

- **SIT:** Default profile when running locally. `application-sit.properties` sets `app.frontend-url=http://localhost:5173`. No env vars required.
- **UAT:** On Railway set:
  - `SPRING_PROFILES_ACTIVE=uat`
  - `APP_FRONTEND_URL` = your Vercel UAT frontend URL (for password reset emails)
- **PROD:** On Railway set:
  - `SPRING_PROFILES_ACTIVE=prod`
  - `APP_FRONTEND_URL` = your Vercel PROD frontend URL

Database and other secrets: set per service in Railway (e.g. UAT vs PROD DB if you split them).
