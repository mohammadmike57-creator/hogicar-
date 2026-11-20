# Staging: a test copy of Hogicar

A staging copy runs the same code as the live site with its own database, test payments and safe email, so a
change can be tried before it reaches customers. It is created once in Render.

## 1. Backend (Render: New → Web Service, same `hogicar-backend` repository)
- Branch: `staging` (or `main` to mirror live).
- Database: a **new** PostgreSQL database (Render: New → PostgreSQL). Never the live one.
- Environment: copy the live backend's variables, then change:
  - `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`: the new database.
  - `STRIPE_API_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`: Stripe **test** keys (`sk_test_…`, `pk_test_…`).
  - `APP_MAIL_ALLOW_ONLY`: e.g. `@hogicar.com,mohammad.mike57@gmail.com`. Email only reaches these addresses;
    everything else is skipped and logged.
  - `APP_PUBLIC_BASE_URL` / `APP_FRONTEND_URL`: the staging website address.
  - `ADMIN_SEED_PASSWORD`: a password for the staging admin.

## 2. Website (Render: New → Web Service, same `hogicar-` repository)
- Branch: the same as the backend.
- Environment: copy the live website's variables, then change:
  - `BACKEND_ORIGIN`: the staging backend address.
  - `SITE_ENV`: `staging`. The site then shows a red "TEST SITE" bar, tells search engines not to index it
    (robots.txt and X-Robots-Tag) and does not load Google Tag Manager.
  - `VITE_STRIPE_PUBLISHABLE_KEY` (if set): the Stripe **test** publishable key (`pk_test_…`).
  - `VITE_API_BASE_URL`, `VITE_API_URL`, `VITE_PUBLIC_BASE_URL` (if set): the staging addresses.

## 3. Using it
Push a change to the `staging` branch, try it on the staging address, and when it is right merge it into
`main` for the live site.
