# Ultrascore Pro setup

1. Create a Supabase project. Run `supabase.sql` in its SQL Editor.
2. In Supabase Authentication, create the admin user you will use to sign in.
3. Put the Supabase Project URL and publishable/anon key in `config.js`. These are browser-facing values; RLS protects database writes.
4. Create an API-Football/API-Sports key and an OpenAI API key.
5. Deploy this folder to Vercel. Add `API_FOOTBALL_KEY` and `OPENAI_API_KEY` as Vercel environment variables. Do not paste secret keys into frontend files or GitHub.
6. Visit `/login.html` to sign in, then `/admin.html`.

The included serverless endpoints keep the API-Football and OpenAI secrets on the server. The public site can fall back to local demo data until Supabase is configured.
