# Project Working Rules (Read First)

This repository is already deployed and connected:
- Vercel deployment is working.
- Supabase database connection is working.
- Existing web app behavior must remain stable.

## Primary Objective

Only implement the remaining Chapter 17 web app pages and flows needed for the assignment, without breaking current deployment.

## Hard Constraints

1. Edit scope is limited to:
   - `web/` only
2. Do not modify unless explicitly requested:
   - `ml/`
   - `sql/`
   - `supabase/`
   - root deployment/database infrastructure
3. Preserve current working behavior:
   - Vercel build/deploy
   - Supabase reads on production site
4. Do not redesign architecture; extend it safely.

## Current State (Already Done)

- Site is live on Vercel and reads data from Supabase.
- Existing pages include dashboard + prediction pages + model insights.
- Environment wiring is in place for Supabase and Vercel.

## Remaining Assignment Scope (Web App)

Implement the missing user-facing pages and flows from Chapter 17 assignment requirements:

1. `Select Customer` page (no auth)
2. Customer dashboard tied to selected customer
3. Place order flow that writes to DB
4. Customer order history page
5. Warehouse priority queue page (top 50 by late-delivery probability)
6. Run scoring action/button that refreshes queue data

Use the existing schema contract and current app structure.

## Database/Feature Expectations for Web Pages

- Use existing operational tables (for example: `customers`, `orders`, `order_items`, `products`, predictions table/view).
- Do not invent new core tables unless absolutely necessary for compatibility.
- Keep SQL and data access deterministic and easy to verify.

## Implementation Priorities

1. Safety first: no regressions to current production behavior.
2. Minimal, readable UI over visual complexity.
3. Clear error handling and empty-state handling on each new page.
4. Keep pages testable with simple manual QA steps.

## Deployment Safety Checklist (Before Finishing)

- `npm run build` succeeds in `web/`.
- Existing routes still work after changes.
- New routes render and handle missing/invalid input safely.
- Homepage data still loads from Supabase in production mode.

## Out of Scope

- Reworking ML training/inference architecture
- Replacing Supabase/Vercel setup
- Large refactors unrelated to missing assignment pages

## Definition of Done

Web app includes all required assignment pages/flows while preserving current Vercel + Supabase functionality and build stability.
