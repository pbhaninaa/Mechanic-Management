# Environment variables for production

Set these in your hosting platform (e.g. Railway) so secrets are not in the repo.

| Variable | Description |
|----------|-------------|
| `SPRING_DATASOURCE_URL` | JDBC URL (e.g. `jdbc:mysql://host:3306/dbname?useSSL=false&serverTimezone=UTC`) |
| `SPRING_DATASOURCE_USERNAME` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | Database password |
| `JWT_SECRET` | Secret for JWT signing (min 64 characters) |
| `STRIPE_SECRET_KEY` | Stripe secret key (e.g. `sk_live_...`) |
| `MAIL_USERNAME` | SMTP username (e.g. Gmail address) |
| `MAIL_PASSWORD` | SMTP password (e.g. Gmail app password) |
| `MAIL_FROM` | From address for outgoing email |
| `APP_FRONTEND_URL` | Frontend base URL (e.g. your Vercel app URL) – used when profile is `prod` |
| `APP_FRONTEND_ALLOWED_ORIGINS` | Optional. Comma-separated allowed origins for CORS and link resolution. Defaults from `app.frontend-allowed-origins` in config. |

For **local development**, copy `src/main/resources/application-local.example.properties` to `application-local.properties` (gitignored) and set the same keys there.
