# Deployment (Vercel)

## Environment variables

Set these in the Vercel project → **Settings** → **Environment Variables**:

| Variable | Value | Notes |
|----------|--------|--------|
| `OPENAI_API_KEY` | your real OpenAI key | Server-only secret — never commit |
| `NEXT_PUBLIC_DEMO_MODE` | `0` | `1` forces mock generation (no OpenAI calls) |
| `NEXT_PUBLIC_APP_URL` | `https://sitepilot-ai-preview.vercel.app` | Public site URL for metadata |

### Optional (later)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Stripe, Google Maps, Resend keys as needed

## Generation behavior

| `NEXT_PUBLIC_DEMO_MODE` | `OPENAI_API_KEY` | Result |
|-------------------------|------------------|--------|
| `1` | any | Mock blueprint only |
| `0` | set | OpenAI generation |
| `0` | missing | Error: add key or enable demo mode |

## After changing env vars

1. Save variables for **Production** (and Preview if you use preview deployments).
2. **Redeploy** the project (Deployments → … → Redeploy, or push a new commit).

## Sync from `.env.local` (CLI)

1. Create a token: [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. In PowerShell (project folder):

```powershell
$env:VERCEL_TOKEN = "paste_token_here"
npm run vercel:env
```

This sets `OPENAI_API_KEY`, `NEXT_PUBLIC_DEMO_MODE=0`, `NEXT_PUBLIC_APP_URL` on Production + Preview and triggers a redeploy.

Env changes do not apply to already-built deployments until you redeploy.

## Local development

1. Copy `.env.example` to `.env.local` (or use the provided `.env.local` template).
2. Set `OPENAI_API_KEY` in `.env.local` only — this file is gitignored.
3. Set `NEXT_PUBLIC_DEMO_MODE=0` for real OpenAI locally.
4. Run `npm run dev`.

Check `/api/ai/generation-status` or the Environment panel on `/create` for:

- Demo mode on/off
- OpenAI key detected yes/no
- Expected generation source
