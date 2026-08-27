# Social Command Center

An operations command centre for a social media manager who runs many
clients, brands, channels, and accounts. Tracks content from idea to
published, handles client approvals, and includes an AI assistant that
can see your whole workspace.

Built with Next.js. Deploys free on Vercel. The only paid part is the
AI assistant, which uses the Anthropic API (a few dollars a month at
normal use, and it still works without a key — you just don't get the
assistant until you add one).

---

## What it does today

- **Clients → Brands → Accounts → Content.** A client can have many
  brands, each brand many social accounts. Every content item posts to
  a specific account, so 10 accounts under one client is handled.
- **Today dashboard** — overdue, due today, waiting on client, ready to
  publish, plus team workload and publishing gaps.
- **Pipeline board** — the full workflow from idea to published.
- **Calendar** — publish dates across the month, colour coded by client.
- **Content records** — brief, caption, hashtags, CTA, tasks, asset
  links, and a full approval history.
- **Alerts** — overdue work, stuck approvals, imminent unapproved
  publishes, missing assets. Derived from your data, no setup.
- **Global search** across all content.
- **AI assistant** — reads a snapshot of your workspace and answers
  questions, drafts copy, and flags what needs attention.
- **Export backup** — download your whole workspace as JSON any time.

## What it does NOT do yet (and why)

- **Live analytics** (real view / reach / engagement numbers). Each
  platform needs its own OAuth login per client and, for Instagram /
  TikTok / LinkedIn, app review or a paid data provider. Out of scope
  for a bare-minimum build. Enter metrics manually for now.
- **Auto-publishing.** Needs paid write-access to each platform.
- **Multi-device sync.** Data currently lives in your browser. Swapping
  in a free database (Supabase / Neon) is the planned next step and
  touches only `lib/store.js`.

---

## Deploy it (no coding needed)

### 1. Put the code on GitHub
1. Create a new repository on github.com (e.g. `social-command-center`).
2. Upload all these files to it (drag and drop works in the GitHub web
   uploader), or push with git if you know how.

### 2. Connect to Vercel
1. Go to vercel.com and sign in with GitHub.
2. Click **Add New → Project**, pick your repository, click **Import**.
3. Vercel auto-detects Next.js. Leave the defaults.
4. Click **Deploy**. In about a minute you get a live URL.

The app works immediately. The assistant will politely tell you it
needs a key until you do the next step.

### 3. Turn on the AI assistant
1. Get a key at https://console.anthropic.com → **API Keys**.
2. In Vercel: **Project → Settings → Environment Variables**.
3. Add `ANTHROPIC_API_KEY` with your key as the value. Save.
4. **Redeploy** (Deployments tab → latest → ⋯ → Redeploy) so the key
   takes effect.

Set a low spend limit in the Anthropic console so you can never be
surprised by a bill.

---

## Run it locally (optional)

```bash
npm install
cp .env.example .env.local   # then paste your key into .env.local
npm run dev
```

Open http://localhost:3000

---

## Cost summary

- Vercel hosting: free tier is plenty for one manager.
- Anthropic API: pay per use. The assistant uses the cheapest model
  (Haiku) by default. Typical solo use is roughly a few dollars a month.
- Everything else: free.
