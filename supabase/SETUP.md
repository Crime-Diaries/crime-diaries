# Turning on accounts

Accounts stay off until `js/config.js` has a Supabase URL and anon key. Everything else on the site works without them.

## 1. Create the project
1. Sign up at https://supabase.com and create a project.
2. Pick a region close to your users, for example **Mumbai (ap-south-1)**. Write it into `privacy.html` in place of `[DATA REGION]`.
3. Open **SQL Editor > New query**. Paste in `supabase/schema.sql` and run it. Enable **Database > Extensions > pg_cron** first, because the last part of the file needs it.

## 2. Email sign-in
Supabase's built-in email sender only delivers to your own team, at about 2 emails per hour. Real users need your own sender.
1. Pick an email service, for example Resend, Brevo or Amazon SES. Write its name into `privacy.html` in place of `[EMAIL PROVIDER]`.
2. In Supabase, open **Authentication > Emails > SMTP settings** and enter its details.
3. Under **Authentication > Providers > Email**, keep "Confirm email" on. Set the minimum password length to **8**.
4. Under **Authentication > Audit Logs**, leave **"Write audit logs to the database" off**. If it is on, the database keeps sign-in records that are not deleted with the account, and the privacy policy would be wrong.

## 3. Google and GitHub sign-in
- **Google:** in Google Cloud Console, create an OAuth client of type "Web application". Its redirect URI is the callback URL Supabase shows under **Authentication > Providers > Google**. Paste the client ID and secret into Supabase.
- **GitHub:** go to GitHub, then **Settings > Developer settings > OAuth Apps > New**, and use the same Supabase callback URL. Paste the client ID and secret into Supabase.

## 4. Allowed addresses
Open **Authentication > URL Configuration**:
- **Site URL:** the live site, for example `https://preetsaini2004.github.io/crime-diaries/`
- **Redirect URLs:** add `https://preetsaini2004.github.io/crime-diaries/account.html` and, for local testing, `http://127.0.0.1:8080/account.html`.

## 5. Connect the site
Open **Project settings > API** and copy the **Project URL** and the **anon public** key into `js/config.js`.
- The anon key is meant to be public.
- **Never** copy the `service_role` key anywhere in this repository.

## 6. Paperwork
- Accept Supabase's Data Processing Addendum (DPA). It's in the dashboard under Organization settings > Legal documents.
- Create the inbox named in `CONTACT_EMAIL` in `js/config.js`.
- Replace `[INTRO MEDIA SOURCE]` in `credits.html`.
- Search the repo for `[` placeholders before launch: `git grep -n "\[CONTACT EMAIL\]\|\[DATA REGION\]\|\[EMAIL PROVIDER\]\|\[INTRO MEDIA SOURCE\]"`.

## Changing the terms or privacy policy later
Change the version date in the document, and the matching `TERMS_VERSION` or `PRIVACY_VERSION` in `js/config.js`. Every signed-in user will then be asked to accept again before they continue.
