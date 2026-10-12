# PESO-Hub

## Setup

1. Copy `.env.example` to `.env` and set the Supabase URL and publishable key.
2. Install dependencies and start the app:

   ```sh
   npm install
   npm run dev
   ```

## Gemini AI features

The public homepage chat and job-seeker AI assistant and job matching, plus staff/admin resume
screening, call the `peso-ai` Supabase Edge Function. Public chat is limited to 20 requests per
IP per hour. The Gemini API key is used only in that function; do not put it in `.env`, a `VITE_*`
variable, or React code.

Apply the database migration and deploy the function. Keep `GEMINI_API_KEY` configured in
Supabase Function Secrets; it does not need to be exposed to the client:

```sh
supabase db push
supabase functions deploy peso-ai
```

Optionally set `GEMINI_MODEL` as a Supabase Function secret to use a different supported
Gemini model. The default is `gemini-3.8-flash`.

Resume screening accepts PDF files up to 1 MB and analyzes them without saving them to
Supabase Storage. Resume files, job-seeker messages, and profile summaries submitted to
these features are sent to Google Gemini for processing. Use these features only when
authorized and with any required consent. Resume screening is an advisory tool only; staff
must review the original resume and make all decisions. AI recommendations may be incomplete
or inaccurate. Homepage chat is available to visitors without signing in; do not include
passwords or sensitive personal information in chat messages.
