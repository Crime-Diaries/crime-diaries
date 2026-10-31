# Crime Diaries

An open encyclopedia of real crime cases and forensics, with a cinematic ASCII intro and a watching eye that follows your cursor.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Run it

```bash
cd crime-diaries
python3 -m http.server 8000
```

Open http://localhost:8000. Use **Replay intro** (top right) to see the intro again; it only plays by itself on a first visit.

Use the server rather than double-clicking `index.html`: browsers won't let a page opened from a file read video frames, so the intro would fall back to its drawn figures instead of the filmed clips.

## What's where

| Path | What it is |
|---|---|
| `index.html` | Home: intro, eye hero, case list, forensics, community |
| `case.html` | One case file (`case.html?id=<case-id>`) with discussion |
| `data/cases.js` | The case files and forensic methods |
| `js/intro.js` | The cinematic intro (eye, thought bubbles, four scenes, title) |
| `js/eye.js` | The ASCII eye that follows the pointer (hero and nav bar) |
| `js/site.js` | Home and case page logic |
| `js/ask.js` | "Ask the Eye" panel (keyword search over the case files for now) |
| `js/posts.js` | Comments/theories storage. Browser-only for now; replace this one file to connect a database |
| `js/discussion.js` | Comments and Theories tabs on the case page |
| `media/` | Intro clips `scene1–4.mp4` and `gunshot.mp3` |
| `docs/research.md` | Product research: landscape, gaps, legal red lines |
| `prototypes/opener.html` | The original standalone intro animation |

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
- See `docs/research.md` for the legal red lines (defamation, privacy, active trials, GDPR, copyright).
