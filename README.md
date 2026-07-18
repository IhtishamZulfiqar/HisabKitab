# HisabKitab - Personal Finance Tracker

A multi-user personal finance tracker for managing money across multiple wallets, tracking
shared/friend lending, running a household budget, and saving toward goals. Each user only
ever sees their own wallets, transactions, budgets and goals.

- **Backend:** Django + Django REST Framework, PostgreSQL (Neon.tech) via `dj-database-url`
- **Frontend:** React (Vite) + Tailwind CSS
- **Auth:** Self-service registration/login, DRF TokenAuthentication, all data scoped per user

## Features

- **Dashboard:** total balance, quick add shortcuts for expense/income/transfer, an over-budget
  alert, this month's spend by category with a month-over-month change and a daily average /
  projected month-end spend, active budgets and goals, friend balances, a savings rate summary,
  and a 6-month income vs. spend trend chart
- **Wallets:** track balances across bank, mobile wallet and cash accounts, with wallet-to-wallet
  transfers
- **Transactions:** log income/expenses, filter by wallet, category, friend and date range
- **Quick Add:** fast single-form entry for day-to-day transactions, including direct
  wallet-to-wallet transfers
- **Categories:** custom categories, flagged as friend-related and/or goal-related
- **Friends:** running ledger per friend with a net balance for shared lending/borrowing
- **Budgets:** monthly per-category limits with spent/remaining and percent-used tracking
- **Goals:** savings targets with a deadline, contributions/withdrawals, and a suggested
  monthly contribution

## Project layout

```
hisabkitab/
  backend/    Django project (API)
  frontend/   Vite React app (UI)
```

## Running locally

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # edit as needed; DATABASE_URL is optional locally (falls back to SQLite)
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

The API is now served at `http://127.0.0.1:8000/api/`. Admin site at `/admin/`.

Auth: `POST /api/auth/register/` creates a new account, `POST /api/auth/login/` with
`{"username": ..., "password": ...}` returns a DRF token. Send it on subsequent requests as
`Authorization: Token <token>`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL if backend isn't on the default local port
npm run dev
```

Visit `http://localhost:5173` and register a new account, or log in if you already have one.

## Deploying (free tier)

### 1. Database - Neon.tech Postgres

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the connection string (use the "pooled connection" string, `sslmode=require`).
3. You'll set this as `DATABASE_URL` on Render in the next step.

### 2. Backend - Render

1. Push this repo to GitHub.
2. In Render, create a new **Blueprint** from the repo (it will pick up `backend/render.yaml`),
   or manually create a Web Service named **`hisabkitab-api`** pointing at the `backend/` directory with:
   - Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - Start command: `gunicorn hisabkitab.wsgi:application`
3. Set environment variables on the service:
   - `DATABASE_URL` - the Neon connection string
   - `SECRET_KEY` - a long random string (Render can generate one)
   - `DEBUG` - `False`
   - `ALLOWED_HOSTS` - `hisabkitab-api.onrender.com`
   - `CORS_ALLOWED_ORIGINS` - `https://hisabkitab.vercel.app` (your Vercel URL)
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` - optional, used to bootstrap a
     Django admin account
4. After the first deploy, open the Render shell and run:
   ```bash
   python manage.py create_auth_user
   ```

### 3. Frontend - Vercel

1. Import the repo into Vercel, set the project root to `frontend/`. Project name: **`hisabkitab`**.
2. Framework preset: Vite. Build command `npm run build`, output directory `dist` (defaults).
3. Set environment variable `VITE_API_BASE_URL` to your Render API URL, e.g.
   `https://hisabkitab-api.onrender.com/api`.
4. Deploy. `vercel.json` is already configured to rewrite all routes to `index.html` for
   client-side routing.

### 4. Admin account (optional)

`python manage.py create_auth_user` (re-)creates a Django admin account and token from the
`ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` env vars, for access to `/admin/`. Regular
users sign up through the app's own Register page instead.

## Notes

- Wallet balances are computed from transactions and cached on the `Wallet` row, recomputed on
  every write/delete.
- Wallet-to-wallet transfers, goal contributions/withdrawals, and their paired transactions are
  created and deleted atomically, so wallet balances stay consistent.
- The dashboard shows a savings rate (income minus spend, as a percent of income) and a 6-month
  income vs. spend trend chart, so cash flow patterns are visible at a glance instead of relying
  on a single threshold-based warning.
