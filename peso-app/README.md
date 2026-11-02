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

## Automatic PESO messaging and Gmail synchronization

The existing role-specific **Messages** screen remains the PESO-Hub conversation UI.
Messages are saved in `peso_messages` immediately, then delivered by a server-side outbox.
Gmail replies are synchronized into that same conversation using the Gmail thread ID,
verified participant addresses, the official mailbox recipient, and a conversation marker.
Only threads first created by a PESO-Hub message are eligible; general/personal inbox mail
is not imported. Supabase Realtime updates the Messages screen without polling.

Only the PESO Head/Admin can perform the one-time authorization from **Admin → Gmail Setup**.
There is no Gmail connection control in Messages. Older read-only Gmail authorizations can
be upgraded once from that protected setup page.

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
4. Configure the Supabase Vault secrets and database schedule below. The database job
   retries queued delivery every minute and renews the Gmail watch daily. Gmail watches
   expire after at most seven days.

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
- `GMAIL_JOB_SECRET` set to a long, random secret

The deployed project currently has `GOOGLE_PUBSUB_AUDIENCE` and
`GOOGLE_PUBSUB_SERVICE_ACCOUNT`; the Edge Functions accept those as aliases for the
`PUBSUB_*` names above. The topic, subscription, and `GMAIL_JOB_SECRET` must still be
configured. In **Admin → Gmail Setup**, the background service checks show whether those
required secret names are present; they never display secret values.

Register the redirect URL in the Google OAuth client. The Admin setup requests Gmail read
and send access, verifies the authorized Google account against `GMAIL_ACCOUNT`, stores the
refresh token encrypted, and registers the Gmail watch.

If Google reports `401: invalid_client`, confirm that `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` are the pair from the same Google Cloud **Web application** OAuth
client. A client ID can have the correct format and still belong to another project. Never
paste the client secret or refresh token into chat or browser code.

In the Supabase SQL Editor, store the project URL and the exact same `GMAIL_JOB_SECRET` in
Vault, then install the scheduled jobs:

```sql
select vault.create_secret(
  'https://jvuyguamtvqtzddaauqq.supabase.co',
  'supabase_project_url'
);
select vault.create_secret(
  '<the same value configured as GMAIL_JOB_SECRET>',
  'gmail_job_secret'
);
select public.schedule_peso_gmail_jobs();
```

If either Vault secret already exists, update it in Vault rather than creating a duplicate.
The scheduling function returns `true` when both jobs are installed. It can be called again
after changing a Vault secret.

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
npm exec --prefix ./peso-app -- supabase --workdir . functions deploy gmail-deliver-queued --use-api
```
