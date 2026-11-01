# Crime Diaries

An open library of real crime cases and forensics, for education only, with a cinematic ASCII intro and a watching eye that follows your cursor.

Plain HTML, CSS and JavaScript. No build step and no server: the library is refreshed nightly by a GitHub Action, and live numbers are fetched by the browser from public APIs.

## Run it

```bash
cd crime-diaries
python3 -m http.server 8000
```

Open http://localhost:8000. A first visit shows the education-only notice; the intro plays only if the visitor chooses it there, or later with **Replay intro**. **Calm** (top right) turns animation off; it is on by default for people whose system asks for reduced motion.

Use the server rather than double-clicking `index.html`: browsers won't let a page opened from a file read video frames, so the intro would fall back to its drawn figures instead of the filmed clips.

## What's where

| Path | What it is |
|---|---|
| `index.html` | Home: intro, eye hero, reviewed cases, library teaser, forensics, live numbers, community |
| `case.html` | A reviewed case file (`case.html?id=<case-id>`) with Follow the evidence and discussion, or a library entry (`case.html?wd=<Wikidata id>`) with a live Wikipedia summary and no discussion |
| `library.html` | Search and filter the whole library |
| `map.html` | 3D globe (CesiumJS, NASA imagery, no API key) of every case with a known town: history slider, Night/Day/Streets views, night-vision and noir looks, homicide rate by country (World Bank, live). Falls back to the flat Leaflet map without WebGL |
| `data/world.js` | Country outlines for the homicide layer, built once by `scripts/build-world.mjs` |
| `js/globe.js` | The globe. `map.html?debug` exposes the viewer as `window.__globe` for testing |
| `lab.html` | Forensics Lab: cipher, fingerprint and DNA mini-games with invented data |
| `about.html` | Our principles: disclaimer, what we never publish, sources and licences, help lines |
| `data/cases.js` | The reviewed case files and forensic methods |
| `data/library.js` | Generated library index. Do not edit by hand |
| `scripts/build-library.mjs` | Builds `data/library.js` from Wikidata (`node scripts/build-library.mjs`, Node 18+) |
| `.github/workflows/library.yml` | Runs the build every night at 03:17 UTC and commits changes |
| `js/chrome.js` | Shared on every page: notice, Calm mode, nav eye, Replay, helpers (`window.CD`) |
| `js/report.js` | Full report on library pages: the Wikipedia article section by section, fact box, collapsed violent passages, safe image gallery |
| `js/sensitive.js` | Content warning for sensitive cases, and the protected page for sexual-violence and child cases |
| `data/sensitive.js` | Generated sensitive cases. Do not edit by hand |
| `js/translate.js` | The A文 nav button: animated guide to the browser's own translator, and in-page translation (Chrome 138+) on reports |
| `scripts/crawl-categories.mjs` | Finds cases through Wikipedia's per-country crime categories (deep for countries with few cases) |
| `js/library.js`, `js/map.js`, `js/lab.js`, `js/live.js` | Library, flat-map fallback, lab and live-numbers logic |
| `js/intro.js` | The cinematic intro (eye, thought bubbles, four scenes, title) |
| `js/eye.js` | The ASCII eye that follows the pointer (hero and nav bar) |
| `js/site.js` | Home and case page logic |
| `js/ask.js` | "Ask the Eye" panel (keyword search over the case files for now) |
| `js/posts.js` | Comments/theories storage. Browser-only for now; replace this one file to connect a database |
| `js/discussion.js` | Comments and Theories tabs on the case page |
| `media/` | Intro clips `scene1–4.mp4` and `gunshot.mp3` |
| `docs/research.md` | Product research: landscape, gaps, legal red lines |
| `prototypes/opener.html` | The original standalone intro animation |

## Data without a server

- **Library:** `scripts/build-library.mjs` asks Wikidata for crime events with a Wikipedia article in any language and writes `data/library.js` (English title when Wikidata has one; `l` holds the article language otherwise). GitHub Actions runs it nightly, so the site stays current while GitHub Pages serves plain files. Run it by hand any time.
- **Rules in the build:** only events at least 10 years old; undated items dropped; mass murder, mass and school shootings, terrorist, suicide and bomb attacks excluded (copycat risk); no offender names or images; coordinates at town level.
- **Category crawl:** the build also walks Wikipedia's crime categories for every country (about 25 to 50 minutes, one polite request at a time). Locally, `CRAWL_CACHE=1 node scripts/build-library.mjs` reuses the last crawl from `cache/` and takes about a minute; `DROP_LOG=1` writes `cache/drops.json` with why each case was left out.
- **Sensitive cases** (terror attacks, massacres, riots, mass killings, lynchings, sexual violence, and child cases in India) go to `data/sensitive.js`, loaded only when a visitor turns on "Include sensitive cases". Each opens behind a content warning (`js/sensitive.js`). Attack reports keep sections about the attacker closed ("No Notoriety"). Sexual-violence and child cases are **protected**: the build keeps only a neutral title, year, country and a location rounded to whole degrees, and the page shows convicted adults and outcome sentences with other names removed. Never add a victim's name, the article title or a place to these entries.
- **Still left out:** cases that ended less than 10 years ago (proceedings may be active), and anything in `REMOVED`.
- **Live in the browser:** library summaries come from the Wikipedia REST API (CC BY-SA, credited on the page); home-page numbers come from data.police.uk (England, Wales, Northern Ireland).
- **To go live:** push to GitHub, enable Pages (Settings, Pages, deploy from `main`), and check the Actions tab can write to the repo.

## Intro clips

The four scenes play `media/scene*.mp4` converted to ASCII; any missing clip falls back to drawn figures. Order, start point and speed of each clip are set in `CLIPS` in `js/intro.js`. The gunpoint clip plays last and its shot leads into the title.

## Working together

```bash
git pull            # get your partner's latest changes before you start
# ...make changes...
git add -A
git commit -m "Describe what you changed"
git push
```

If `git push` is rejected, someone pushed first: run `git pull`, fix any conflicts, then push again.

## Content rules

This site is about real people. Before adding or editing a case:

- Facts only in case articles, each with a source. Theories go in the Theories tab.
- Never name a living person as guilty unless a court has convicted them.
- No graphic images, and never show how someone died.
- Never describe how to commit a crime. Write about the investigation, the evidence and the victims, not the method, and give offenders as little attention as possible.
- See `docs/research.md` for the legal red lines (defamation, privacy, active trials, GDPR, copyright).
