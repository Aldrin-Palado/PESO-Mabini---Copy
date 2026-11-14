# PESO-Hub

## Setup

1. Copy `.env.example` to `.env` and set the Supabase URL and publishable key.
2. Install dependencies and start the app:

   ```sh
   npm install
   npm run dev
   ```

## Admin/staff audit logs

Admin and staff changes to job posts, applications, employers, job seekers, staff
accounts and permissions, PESO posts, and announcements are recorded automatically.
The audit entry includes the request IP when Supabase supplies a forwarded-IP header,
plus the browser user-agent/device information. Apply the migration from the workspace
root so new changes are captured:

```sh
npm exec --prefix ./peso-app -- supabase --workdir ./peso-app db push
```

Existing audit entries are not backfilled; this metadata is recorded for changes made
after the migration is applied.

Staff profile photos appear in Admin Accounts when available. They remain private;
the profile-photo migration grants signed-photo reads for other accounts to active
admins only. Apply pending migrations with the same `supabase db push` command.

## Groq AI features

The public homepage chat and job-seeker AI assistant and job matching call the `peso-ai`
Supabase Edge Function. Public chat is limited to 20 requests per IP per hour. The Groq API key is used only in that function; do not put it in `.env`, a `VITE_*`
variable, or React code. Groq model settings are also Edge Function secrets; setting them
in the frontend `.env` does not configure the deployed function.

Apply the database migration and deploy the function. Keep `GROQ_API_KEY` configured in
Supabase Function Secrets; it does not need to be exposed to the client:

```sh
supabase db push
supabase functions deploy peso-ai
```

Optionally set `GROQ_MODEL` in Supabase Dashboard → Edge Functions → Secrets. The default
is `llama-3.3-70b-versatile`. Each Groq request has a 20-second timeout and transient errors
are retried up to three times. The function sends up to six chat messages, uses a short cache
for public vacancy data, and limits matching input to 12 recent vacancies, 4,000 profile
characters, or a 500 KB resume.
The chatbot also accepts an optional PDF, DOC, or DOCX resume attachment (up to 500 KB)
and returns matching open jobs. PDF and Word documents are text-extracted server-side; it
requires the user’s consent for each selected resume, and attachments are not stored.
The Supabase client is loaded only for requests that need it, allowing CORS preflight
requests to return without initializing it.

Job-seeker messages, profile summaries, and resumes submitted for chatbot or job matching
are sent to Groq for processing. Use these features only when authorized and with
any required consent. AI recommendations may be incomplete or inaccurate. Homepage chat is
available to visitors without signing in; do not include passwords or sensitive personal
information in chat messages.

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

PESO-Hub now queues a background delivery request as soon as a new message is created.
The scheduled one-minute worker remains enabled as a retry and recovery fallback. Immediate
delivery requires both Vault secrets above and the deployed `gmail-deliver-queued` function.

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
