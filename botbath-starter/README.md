# Botbath Starter Kit

AI bots rate your cat photos using Claude, GPT, and Gemini.

## What's Included

- Upload page (`public/index.html`)
- Results page (`public/results.html`)
- Netlify Functions to call AI APIs
- All configuration files

## Setup Instructions

### Step 1: Get Your API Keys

You need 5 API keys total:

#### 1. Anthropic (Claude)
- Go to: https://console.anthropic.com/settings/keys
- Click "Create Key"
- Copy the key
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

#### 2. OpenAI (GPT)
- Go to: https://platform.openai.com/api-keys
- Click "Create new secret key"
- Copy the key

#### 3. Google (Gemini)
- Go to: https://aistudio.google.com/app/apikey
- Click "Create API key"
- Copy the key

#### 4 & 5. Supabase (Database + Storage)
- Go to: https://supabase.com/dashboard
- Click "New project"
- Name it "botbath-test"
- Wait 2 minutes for it to spin up
- Go to Settings → API
- Copy BOTH:
  - Project URL (looks like `https://xxxxx.supabase.co`)
  - `anon` public key (long string)

### Step 2: Set Up Supabase Database

In your Supabase project:

1. Go to "Table Editor" in left sidebar
2. Click "Create a new table"
3. Name it: `cats`
4. Add these columns:
   - `id` (uuid, primary key, default: auto-generated)
   - `image_url` (text)
   - `claude_reaction` (jsonb)
   - `gpt_reaction` (jsonb)
   - `gemini_reaction` (jsonb)
   - `created_at` (timestamp, default: now())

5. Go to "Storage" in left sidebar
6. Click "Create a new bucket"
7. Name it: `cat-photos`
8. Make it PUBLIC (toggle the switch)

### Step 3: Deploy to Netlify

1. Go to: https://app.netlify.com/
2. Log in (or create account)
3. Drag this ENTIRE FOLDER onto the Netlify dashboard
4. Wait for it to deploy (30 seconds)

### Step 4: Add Environment Variables

In Netlify:

1. Click on your new site
2. Go to: Site configuration → Environment variables
3. Click "Add a variable"
4. Add ALL 5 keys:

```
SUPABASE_URL = your-supabase-project-url
SUPABASE_KEY = your-supabase-anon-key
ANTHROPIC_API_KEY = your-anthropic-key
OPENAI_API_KEY = your-openai-key
GOOGLE_API_KEY = your-google-key
```

5. Click "Save"

### Step 5: Redeploy

1. Go to: Deploys tab
2. Click "Trigger deploy" → "Deploy site"
3. Wait 30 seconds

### Step 6: Test It!

1. Click "Open production deploy"
2. Upload a cat photo
3. Wait for bot reactions
4. Share the results!

## Costs

Per cat evaluation (all 3 bots):
- Claude: ~$0.003
- GPT: ~$0.002
- Gemini: Free (within limits)
- Total: ~$0.005 per cat (half a cent)

At 100 cats: ~$0.50
At 1,000 cats: ~$5

Very affordable for testing!

## Troubleshooting

**"Functions not found" error:**
- Make sure you added all 5 environment variables
- Redeploy the site after adding them

**"Upload failed" error:**
- Check that Supabase bucket `cat-photos` is PUBLIC
- Check that your SUPABASE_URL and SUPABASE_KEY are correct

**Bot reactions not showing:**
- Check the Netlify function logs (Functions tab)
- Make sure API keys are correct
- Make sure Supabase `cats` table exists with correct columns

## Next Steps

Once this works:
- Add more bots (Llama, Grok, etc.)
- Add leaderboards
- Add user accounts
- Add bot-following mechanics
- All the fancy stuff!

But first: SHIP THE SIMPLE VERSION and see if people like it.

---

Questions? Just ask Claude! 🤖
