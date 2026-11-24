# Teardown: Arrows Escape and other "tap arrows out" games — 24 Nov 2026

Nora, Ideas lab. Relevant to **Arrow Cube 3D**.

## Sources and limits

- Arrows Escape: Go Out Puzzle (Merge Game / Hong Kong sea bird technology), App Store US: https://apps.apple.com/us/app/-/id6759191400
- Arrow Out Puzzle Tap Away (Muhammad Kamran / XRare Games): https://apps.apple.com/us/app/-/id6757767754
- Arrow Out: Tap Arrows Puzzle (NOVOSYX): https://apps.apple.com/app/id6760516408
- Arrows : Arrows Puzzle, Google Play (com.arrow.arrows): https://play.google.com/store/apps/details?id=com.arrow.arrows

Read on 24 Nov 2026: store text, update notes and the few reviews each page shows (4, 1, 0 and 0 reviews). No videos or articles this shift; onboarding and ad timing come from listings and reviews, not from playing. Small sample.

## Arrows Escape: Go Out Puzzle (main teardown)

- **Size**: 4.6 from about 1K ratings (US). Age 16+. IAPs: coins $1.99-$79.99, "No Ads" $7.99, no-ads bundles up to $34.99, beginner bundle $4.99.
- **Pitch**: "hundreds of unique levels", move and rotate the arrows, Daily Challenges with a leaderboard, offline play, frequent updates.
- **Content cadence** (from update notes): launched Feb 2026; 1.1.10 (23 Apr) added a **win streak** ("the longer you keep it going, the better the rewards") and a **Daily Challenge with a daily reward**; 1.1.16 (13 Oct) "Added 2,000+ new levels". Many crash-fix releases in between.
- **Onboarding / level design (from reviews)**: "Fun but easy until level 6. The first 6 levels have no limit on using the grid. After that the rules change" — the reviewer titled it "Misleading". So a new rule appears at level 7 without the player feeling prepared.
- **Lives**: "Lives don't renew at the next level"; extra attempts need an ad or coins.
- **Ads (from reviews)**: "you can only play three or four times and then you go to an unending ad for another game".
- **Feel**: "No music, sound is lower quality, tap recognition isn't as smooth" — taps that move slightly are read as swipes, forcing re-taps.
- **Praise**: "Challenging, but fun to play."

## The others, briefly

- **Arrow Out Puzzle Tap Away**: "1000+ handcrafted neon maze levels", hints, undo, zoom, no timers, offline. Only review (3 stars): "LEVEL 515 IS BROKEN. Can not advance" — fixed two months later.
- **Arrow Out: Tap Arrows Puzzle**: 4.4 from 31 ratings; five "fix bug" releases, then "Add Dark Theme".
- **Arrows : Arrows Puzzle** (Play): 50+ downloads; "a wrong move can cost a life", hints, daily challenges, offline, "No timer or pressure".
- Common listing bullets across all four: **offline play**, **no timer**, **hints**, **daily challenge**, big level counts.

## How Arrow Cube compares (checked in index.html on develop)

- Mistakes: 3 hearts per level, refilled on every new level or restart (no blocking energy) — better than the "lives don't renew" complaint. Rewarded +1 heart continue is optional.
- Ads: no interstitials in levels 1-5, then after every 3rd win (AD_FREQUENCY = 3, AD_START_LEVEL = 6); never right after a loss. Already gentler than "3-4 plays then an ad".
- Daily puzzle with a 7-day streak exists. A *win* streak (consecutive levels without losing) does not.
- Tap detection: a tap is under 380 ms and under 22 px of movement, or any touch that moved less than 15 px. Already forgiving.
- Solvability: levels come from a cycle-free generator; Lena verified levels 1-30 and a sample up to 250 on 24 Nov. A broken level like "Level 515" is the risk to keep guarding as level counts grow.
- Store listing draft (store/listing.md) says no timer and daily puzzle, but **does not say it plays offline**, though the game runs from bundled files (three.min.js, ads.js, classic2d.js are local).

## What we can learn (without copying)

1. **Announce every new rule the first time it appears.** The "rules change at level 7" review shows silent rule changes feel like a trick. Check Arrow Cube's first levels and each new element (red blocked arrows, the eraser, chests, Classic 2D, the daily puzzle) for a one-line intro card the first time. (Backlog: ac-rule-intros, Lena.)
2. **Say "Plays offline" in the listing.** Every competitor lists it; we qualify and don't say it. (Backlog: ac-listing-offline, Zara, inside the listing draft; the CEO approves the listing as usual.)
3. **Big level counts are a selling point**, and broken levels are the top bug in this genre. Keep the solvability check as part of every level change; it already exists in QA.
4. **Win streak with growing rewards** (Arrows Escape 1.1.10) is a retention feature that fits our rules (it rewards playing, blocks nothing). Parked as an idea for Friday's review rather than a backlog item, because Arrow Cube's priority is the second closed test.
5. **Ad hygiene**: our cadence is already gentler than what players complain about. Keep it.

## Not copying

Competitor names ("Arrows", "Arrow Out", "Arrows Escape"), icons, neon/animal-shaped level styles and coin economies stay theirs. The points above are generic: rule intros, honest listing claims, level quality.
