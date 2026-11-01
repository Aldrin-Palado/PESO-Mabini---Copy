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

## Incoming Gmail inbox

The admin and staff **Messages → Gmail Inbox** view stores the latest 20 inbox messages
from the last 30 days on first connection. New mail is delivered by Gmail push notifications
through Google Cloud Pub/Sub and appears in the app on its next 30-second refresh. Stored
message bodies are accessible only through a staff/admin-protected Edge Function.

### Configure Google Cloud

1. Enable the Gmail API and Pub/Sub API in the same Google Cloud project used by the Google
   OAuth client.
2. Create a Pub/Sub topic. Grant `gmail-api-push@system.gserviceaccount.com` the
   **Pub/Sub Publisher** role on that topic.
3. Create a push subscription for that topic with endpoint
   `https://jvuyguamtvqtzddaauqq.supabase.co/functions/v1/gmail-pubsub-webhook`.
   Enable OIDC authentication on the push subscription, select a service account, grant the
   Pub/Sub service agent permission to mint tokens for it, and set the OIDC audience to the
   exact same endpoint URL.
4. Create a Cloud Scheduler job that sends an authenticated `POST` to
   `https://jvuyguamtvqtzddaauqq.supabase.co/functions/v1/gmail-watch-renewal` every six
   days, with the `x-gmail-renewal-secret` header described below. Gmail watches expire
   after at most seven days.

### Configure Supabase

Set these Edge Function secrets in the Supabase dashboard. The Pub/Sub topic and
subscription are fully qualified names, such as `projects/PROJECT_ID/topics/TOPIC_NAME`
and `projects/PROJECT_ID/subscriptions/SUBSCRIPTION_NAME`.

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GMAIL_ACCOUNT` (the mailbox address)
- `GMAIL_REDIRECT_URI` set to
  `https://jvuyguamtvqtzddaauqq.supabase.co/functions/v1/gmail-oauth-callback`
- `TOKEN_ENCRYPTION_KEY` (base64-encoded 32 random bytes; generate with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
- `GMAIL_PUBSUB_TOPIC`, `GMAIL_PUBSUB_SUBSCRIPTION`
- `PUBSUB_OIDC_AUDIENCE` set to the exact push endpoint URL
- `PUBSUB_PUSH_SERVICE_ACCOUNT` set to the selected push-subscription service account email
- `GMAIL_RENEWAL_SECRET` set to a long, random secret; use the same value in Cloud Scheduler

Register the redirect URL in the Google OAuth client. The callback requests Gmail read-only
access. Existing Gmail connections must be re-authorized from **Messages → Gmail Inbox →
Connect / Reconnect** to grant this new permission and register the push watch.

### Apply and deploy

Run these commands from the repository root. The database migration is in `peso-app`; the
function entrypoints are also mirrored at the repository root because that is the linked
Supabase project path. `--use-api` avoids needing Docker.

```sh
npm exec --prefix ./peso-app -- supabase --workdir ./peso-app login
npm exec --prefix ./peso-app -- supabase --workdir ./peso-app db push
npm exec --prefix ./peso-app -- supabase --workdir . functions deploy gmail-oauth-start --use-api
npm exec --prefix ./peso-app -- supabase --workdir . functions deploy gmail-oauth-callback --use-api
npm exec --prefix ./peso-app -- supabase --workdir . functions deploy gmail-pubsub-webhook --use-api
npm exec --prefix ./peso-app -- supabase --workdir . functions deploy gmail-inbox --use-api
npm exec --prefix ./peso-app -- supabase --workdir . functions deploy gmail-watch-renewal --use-api
```
