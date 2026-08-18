# Verified free-tier findings

Research date: 2026-08-18

## Render

Official source: https://render.com/docs/free

Render’s official free deployment documentation states that Free web services are available for testing, hobby projects, and previews, and explicitly warns not to use free instances for production applications. A Free web service consumes workspace free instance hours while running; the documented allowance is 750 Free instance hours per workspace per calendar month. Free web services spin down after 15 minutes without inbound traffic and take about one minute to start again on the next request. The same page documents restrictions including ephemeral local filesystem behavior and monthly usage limits. Render’s official pricing page is https://render.com/pricing.

Implication for this project: Render Free is suitable for a college-project demo or staging API, but cold starts and non-production guarantees must be documented. Runtime state must remain in PostgreSQL; the server must not depend on local filesystem persistence.

## Neon

Official source: https://neon.com/docs/introduction/plans

Neon’s current official plans table lists the Free plan at $0/month for prototypes, side projects, and small teams. It lists 100 projects, 10 branches per project, 100 compute-hours per project per month, autoscaling up to 2 CU (8 GB RAM), scale-to-zero after 5 minutes, 0.5 GB storage per project, 5 GB public network transfer per project, one-day monitoring, a six-hour history window up to 1 GB-month, and one manual snapshot. The same page says Free and Scale usage is pay-for-what-you-use, while the Free plan price is $0/month; usage beyond included limits may incur published usage charges depending on the account/plan configuration. Official pricing source: https://neon.com/pricing.

Implication for this project: Neon Free is suitable for a small development/staging database if usage stays within included limits. Connection credentials must be supplied by the user and stored only as server-side environment variables; no account, project, database, or credential was created during this research.

## Scope boundary

No Render or Neon account was created, no credentials were requested, no database was provisioned, no payment method was entered, and no live deployment was performed. The next implementation can add provider-neutral configuration files and documentation only. Actual provisioning and deployment remain blocked until the user supplies approved account/database credentials or explicitly takes over those steps.
