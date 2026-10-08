# Backlog

Ideas agreed as worth doing later, but not scheduled yet.

## History storage beyond `localStorage`

**Now:** history lives in `localStorage` under `ccat-prep:history:v1` (see `src/store/history.ts`). Each session keeps the exact questions you saw, so Review matches them even after a generator is retuned. Browsers cap `localStorage` at about 5 MB per site, whatever your free disk space. A full test with its questions is about 35 KB, so roughly 140 full tests fit (fewer once drills are counted). When storage is full, questions are dropped from the oldest sessions first. Scores are always kept, but those sessions can no longer be reviewed.

**Options, from most to least capacity:**

| Option | Capacity | Cost |
| --- | --- | --- |
| **IndexedDB**, with `navigator.storage.persist()` so the browser doesn't evict it under disk pressure | A share of free disk: gigabytes, so effectively every question ever seen | The storage layer becomes asynchronous; needs a one-time migration from `localStorage` |
| **Compress** the stored JSON (e.g. lz-string) and stay in `localStorage` | Roughly 5–10× more: about 700–1,400 full tests | Small change; still has a ceiling |
| **Rebuild dropped questions from their seed** (the id is `type:difficulty:seed`) | Every session stays reviewable | A rebuilt question differs from the one you saw if its generator changed since; label it "rebuilt from seed" |

With IndexedDB the seed fallback isn't needed. New tests already generate fresh questions from a new seed each time, so none of this affects novelty.

**Related idea:** a "Redo missed questions" drill built from the stored questions you got wrong.

In every case the JSON export on the History page remains the backup, because a browser can still wipe site data.
