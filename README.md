# Dorm Bill Splitter 🇵🇭

A simple app to split **electricity** and **water** bills among roommates by **days stayed in the dorm**.

Splits use the **person-days method**:

```
each person's share = (their days ÷ total person-days) × bill amount
```

So if you stayed 30 days, your roommate stayed 15, and the bill is ₱900 — you pay ₱600, they pay ₱300.

## Features

- 4-roommate setup (add/edit/remove anytime)
- Electricity & water tracked separately, with billing period dates
- Bill history saved to Supabase (free tier)
- Copy a plain-text summary or download the breakdown as an image
- PHP currency, Manila-friendly defaults

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project (free)

1. Go to https://supabase.com and sign in.
2. Click **New project**. Pick any name and region (Singapore is closest to PH).
3. Set a database password and create the project.
4. Once it's ready, go to **SQL Editor → New query**.
5. Open `supabase-schema.sql` from this repo, paste it in, and click **Run**.

### 3. Get your Supabase keys

In your Supabase dashboard, go to **Project Settings → API**. Copy:

- **Project URL** (`https://xxxxx.supabase.co`)
- **anon public key** (a long `eyJhbGc...` string)

### 4. Create `.env.local`

In the project root, create a file called `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000. Add your 4 roommates first, then create a bill.

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
# create a new empty repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/bill-splitter.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New → Project** and select your `bill-splitter` repo.
3. In **Environment Variables**, add the two from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will build and give you a live URL.

That's it — your bill splitter is live. Share the URL with your roommates.

---

## Notes on security

This app has **no login** by design — it's intended for a single private group. The Supabase `anon` key is exposed to the browser, and the Row Level Security policies allow read/write to anyone with the link.

This is fine if:
- You don't share the URL publicly.
- The data isn't sensitive (utility bills usually aren't).

If you want to lock it down later, add Supabase Auth and update the RLS policies in `supabase-schema.sql` to require `auth.uid()`.

---

## Tech

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- `html-to-image` for screenshot export
- `lucide-react` for icons
- Fonts: Fraunces (serif) + DM Sans (body)

## License

MIT — do what you want.
