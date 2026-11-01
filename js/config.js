/* Site settings. Load before js/chrome.js on every page.
   SUPABASE_URL and SUPABASE_ANON_KEY come from Supabase: Project settings > API. The anon key is public by design:
   the database rules (supabase/schema.sql, row level security) decide what it may do.
   NEVER put the service_role key here or anywhere in this repository. */
window.CD_CONFIG = {
  SUPABASE_URL: '',        /* e.g. 'https://abcdefgh.supabase.co'; empty = accounts switched off */
  SUPABASE_ANON_KEY: '',
  /* bump a version when you change that document: every signed-in user is asked to accept it again */
  TERMS_VERSION: '2026-11-01',
  PRIVACY_VERSION: '2026-11-01',
  CONTACT_EMAIL: 'crimediaries.contact@gmail.com', /* create this inbox before launch */
  OPERATOR: 'madxxenom'
};
