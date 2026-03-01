# Grails — Local Dev & Vercel Deployment Guide

## Project Structure

```
grails/
├── index.html          ← Homepage (hamburger nav, modal form, lava lamp bg)
├── about.html          ← About + Features + Waitlist detail page
├── api/
│   └── submit.js       ← Serverless function: Supabase + Airtable handler
├── vercel.json         ← Vercel routing config
├── package.json        ← Dev dependencies
├── .env.example        ← Copy to .env.local and fill in
└── .gitignore
```

---

## Step 1 — Prerequisites

Install these if you don't have them:

```bash
# Node.js (v18+) — https://nodejs.org
node -v   # should print v18.x or higher

# Vercel CLI
npm install -g vercel

# Git
git -v
```

---

## Step 2 — Run Locally

```bash
# 1. Navigate into the project folder
cd grails

# 2. Install dev dependencies (just Vercel CLI locally)
npm install

# 3. Copy env template
cp .env.example .env.local
# Then open .env.local and fill in your Supabase or Airtable credentials

# 4. Start local dev server (Vercel CLI emulates serverless functions)
npx vercel dev
```

Your site is now at **http://localhost:3000**

The form will POST to `http://localhost:3000/api/submit` — check your terminal for logged payloads even if no backend is configured yet.

---

## Step 3 — Set Up Your Backend

### Option A: Supabase (recommended)

1. Go to **https://app.supabase.com** → create a new project
2. In your project, open **SQL Editor** and run:

```sql
create table waitlist (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  email           text not null unique,
  social          text,
  role            text not null check (role in ('collector', 'artist')),
  budget          text,          -- collector only
  stage           text,          -- artist only
  price_range     text,          -- artist only
  priority        text,
  referral_code   text unique,
  referred_by     text,
  submitted_at    timestamptz default now()
);

-- Enable Row Level Security (keep data private)
alter table waitlist enable row level security;

-- Allow insert from service role only (your API key)
create policy "service insert" on waitlist
  for insert with check (true);
```

3. Go to **Settings → API**:
   - Copy **Project URL** → `SUPABASE_URL`
   - Copy **service_role** key (not anon!) → `SUPABASE_SERVICE_KEY`

4. Paste both into `.env.local`

---

### Option B: Airtable

1. Go to **https://airtable.com** → create a new Base named `Grails`
2. Create a table named **Waitlist** with these fields:

| Field Name    | Type          |
|---------------|---------------|
| Name          | Single line text |
| Email         | Email         |
| Social        | Single line text |
| Role          | Single select (collector, artist) |
| Budget        | Single line text |
| Career Stage  | Single line text |
| Price Range   | Single line text |
| Priority      | Single line text |
| Referral Code | Single line text |
| Referred By   | Single line text |
| Submitted At  | Date (include time) |

3. Get your credentials:
   - **API Key**: https://airtable.com/create/tokens → create token with `data.records:write` scope on your base
   - **Base ID**: Open your base in the browser. URL looks like `airtable.com/appXXXXXXXXXXXXXX/...` — copy `appXXXXXXXXXXXXXX`

4. Paste into `.env.local`:
```
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Waitlist
```

---

## Step 4 — Deploy to Vercel

### First time

```bash
# From inside the grails/ folder
npx vercel

# You'll be prompted:
# → Set up and deploy? Y
# → Which scope? (your account)
# → Link to existing project? N
# → Project name: grails (or whatever you want)
# → In which directory is your code? ./ (just press Enter)
# → Override settings? N

# This deploys a PREVIEW URL. To deploy to production:
npx vercel --prod
```

Your site will be live at something like `https://grails-xxxx.vercel.app`

---

## Step 5 — Add Environment Variables to Vercel

In the Vercel dashboard (or CLI):

### Via Dashboard
1. Go to **vercel.com/dashboard** → your `grails` project
2. Click **Settings → Environment Variables**
3. Add each variable from `.env.local`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - (and/or Airtable vars)
4. Set environment to **Production + Preview + Development**
5. Click **Save** — then **redeploy**:

```bash
npx vercel --prod
```

### Via CLI (faster)
```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_KEY production
# repeat for each var
npx vercel --prod
```

---

## Step 6 — Connect a Custom Domain (optional)

```bash
vercel domains add grails.co
```

Or in Dashboard → Settings → Domains → add `grails.co` → follow DNS instructions for your registrar.

---

## Step 7 — Verify It Works

1. Visit your live URL
2. Click **Claim Your Spot**
3. Fill out the form and submit
4. Check Supabase Table Editor or your Airtable base — you should see the row appear

---

## Local Dev Quick Reference

```bash
npx vercel dev          # start local server with API functions
npx vercel --prod       # deploy to production
vercel logs             # tail production logs
vercel env ls           # list environment variables
```

---

## Troubleshooting

**Form submits but no data in Supabase/Airtable:**
- Check that env vars are set in Vercel dashboard AND you've redeployed after adding them
- Check Vercel function logs: Dashboard → your project → Functions tab → `api/submit`

**CORS errors locally:**
- Use `npx vercel dev` (not just opening the HTML file directly) — it runs the API functions

**Supabase "permission denied" error:**
- Make sure you're using the `service_role` key, NOT the `anon` key

**Airtable 422 error:**
- Double-check your field names match exactly (case-sensitive)
- Make sure the Base ID starts with `app`

---

## Both Backends at Once

You can have BOTH Supabase and Airtable configured simultaneously. The API will write to both and return a combined result. Useful if you want Supabase as your source of truth and Airtable for team visibility.
