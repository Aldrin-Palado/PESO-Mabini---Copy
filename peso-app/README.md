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
Supabase Edge Function. Public chat is limited to 20 requests per IP per hour. The Gemini API key is used only in that function; do not put it in `.env`, a `VITE_*`
variable, or React code. Gemini model settings are also Edge Function secrets; setting them
in the frontend `.env` does not configure the deployed function.

Apply the database migration and deploy the function. Keep `GEMINI_API_KEY` configured in
Supabase Function Secrets; it does not need to be exposed to the client:

```sh
supabase db push
supabase functions deploy peso-ai
```

Set `GEMINI_MODEL` and `GEMINI_FALLBACK_MODEL` in Supabase Dashboard → Edge Functions →
Secrets. Use `gemini-3.6-flash` as the primary model and `gemini-3.5-flash` as the fallback.
Both are supported by the Gemini API key and respond well within the 20-second timeout;
`gemini-3.8-flash` and `gemini-flash-latest` currently hang and trigger `DEADLINE_EXCEEDED`.
The fallback must be different from the primary to provide a backup; the function warns in
its logs if both settings resolve to the same model. The retired `gemini-2.5-flash` value is
ignored for both settings. If the primary model returns
not-found or a transient service error, the function switches to the fallback, with at most
three Gemini calls per invocation. Each Gemini request has a 20-second timeout. The function
sends up to six chat messages, uses a short cache for public vacancy data, and limits
matching input to 12 recent vacancies, 4,000 profile characters, or a 500 KB PDF resume.
The Supabase and Gemini SDKs are loaded only for requests that need them, allowing CORS
preflight requests to return without initializing those clients.

Job-seeker messages, profile summaries, and resumes submitted for job matching are sent to
Google Gemini for processing. Use these features only when authorized and with any required
consent. AI recommendations may be incomplete or inaccurate. Homepage chat is available to
visitors without signing in; do not include passwords or sensitive personal information in
chat messages.

## Gmail OAuth functions

The Gmail OAuth Edge Functions and migrations are under `peso-app/supabase`. The repository
root also has a separately linked Supabase project; root-level function entrypoints are
provided for deployments run from the repository root. Set
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_REDIRECT_URI`,
`GMAIL_ACCOUNT`, and a base64-encoded 32-byte `TOKEN_ENCRYPTION_KEY` as Supabase function
secrets. Set `GMAIL_REDIRECT_URI` to the deployed
`/functions/v1/gmail-oauth-callback` URL and register that URL in the Google OAuth client.

Apply the storage migration before deploying. Deploy `gmail-oauth-start` and
`gmail-oauth-callback`; the start function requires a signed-in staff/admin user, while
Google returns to the callback without a Supabase JWT. Run these commands from the
repository root:

```sh
npm --prefix ./peso-app install --save-dev supabase
npm exec --prefix ./peso-app -- supabase --workdir ./peso-app login
npm exec --prefix ./peso-app -- supabase --workdir ./peso-app db push
npm exec --prefix ./peso-app -- supabase --workdir . functions deploy gmail-oauth-start --use-api
npm exec --prefix ./peso-app -- supabase --workdir . functions deploy gmail-oauth-callback --use-api
```

These commands deploy to the linked remote project and do not require Docker. Docker is needed
for local Supabase services such as `supabase start`.
