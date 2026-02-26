# Stripe Payment Setup

Card payments require a Stripe secret key. Configure it using one of these methods:

## Option 1: Local properties file (easiest)

1. Copy `src/main/resources/application-local.example.properties` to `src/main/resources/application-local.properties`
2. Get your **Secret key** from [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys)
3. Replace `sk_test_YOUR_SECRET_KEY_HERE` with your actual key (starts with `sk_test_` for test mode)
4. Restart the backend

The file `application-local.properties` is in `.gitignore` and will not be committed.

## Option 2: Environment variable

Before starting the backend, set:

- **Windows (PowerShell):** `$env:STRIPE_SECRET_KEY="sk_test_your_key_here"`
- **Windows (CMD):** `set STRIPE_SECRET_KEY=sk_test_your_key_here`
- **Linux/Mac:** `export STRIPE_SECRET_KEY=sk_test_your_key_here`

## Frontend (publishable key)

The frontend uses `VITE_STRIPE_PUBLISHABLE_KEY` (in `.env.development`). Use the **Publishable key** (starts with `pk_test_`). This is safe to commit for test mode.
