# PESO-Hub

## Setup

1. Copy `.env.example` to `.env` and set the Supabase URL and publishable key.
2. Install dependencies and start the app:

   ```sh
   npm install
   npm run dev
   ```

## Gemini AI features

The public homepage chat and job-seeker AI assistant and job matching call the `peso-ai`
Supabase Edge Function. Public chat is limited to 20 requests per IP per hour. The Gemini
API key is used only in that function; do not put it in `.env`, a `VITE_*` variable, or React
code.

Apply the database migration and deploy the function. Keep `GEMINI_API_KEY` configured in
Supabase Function Secrets; it does not need to be exposed to the client:

```sh
supabase db push
supabase functions deploy peso-ai
```

Optionally set `GEMINI_MODEL` as a Supabase Function secret to use a different supported
Gemini model. The default is `gemini-3.8-flash`. Transient Gemini service errors are retried
with exponential backoff for at most three total calls, including one fallback call to
`gemini-2.5-flash`. Set `GEMINI_FALLBACK_MODEL` to override the fallback model. Each Gemini
request has a 20-second timeout. The function sends up to six chat messages, uses a short
cache for public vacancy data, and limits matching input to 12 recent vacancies, 4,000
profile characters, or a 500 KB PDF resume.

Job-seeker messages, profile summaries, and resumes submitted for job matching are sent to
Google Gemini for processing. Use these features only when authorized and with any required
consent. AI recommendations may be incomplete or inaccurate. Homepage chat is available to
visitors without signing in; do not include passwords or sensitive personal information in
chat messages.
