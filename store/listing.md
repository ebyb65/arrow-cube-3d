# Arrow Cube 3D: store listing refresh (English draft)

Status: DRAFT by Zara, 23 Nov 2026. Nothing is published. The CEO approves before Play Console changes, and it should go live with the first production release (backlog ac-prod).
Package: com.yebeegames.arrowcube3d · Arabic and Hindi after English approval.

## Why refresh
The listing copy in google_play_testing_guide.md §8 has claims we can't stand behind at launch:
- "Cosmic store & value packs ... coin packs and tactical bundles": in-app purchases are off (`IAP_ENABLED = false`). Advertising them is misleading and invites bad reviews.
- "250+ hand-crafted procedural levels": levels are generated (`generateLevel`), so "hand-crafted" is false, and the count isn't verified.
- "450-arrow multi-cube apex megastructures", "vector", "void", "monolith": jargon players don't search for.
- Heavy emoji headers. Play allows them but they read as spammy and are bad for Arabic/Hindi later.

## Competitor research (23 Nov 2026)
Looked at CubeAway - 3DPuzzle (152K ratings, 4.7), Arrow Escape: Arrows Go 3D, Arrow Escape (Play), Cube Escape / Arrow Away / Tap Arrow Go titles, and Shacknews' review of Arrow Cube Escape.
- Title words used: Arrow, Escape, 3D, Cube, Away, Puzzle.
- **Name risk:** a competitor is called "Arrow Cube Escape" (GOODROID, reviewed May 2026). Our existing name "Arrow Cube 3D" is close. Studio rule is to never copy a competitor's name, so I do **not** add "Escape" next to "Arrow Cube". Keeping our own name is the CEO's call; flagging so it's a conscious decision.
- Top complaints: ads used as gates (stars or hints only through ads), ad removal that doesn't remove all ads; small arrows and mis-taps with no pan/zoom; unclear special-arrow rules and boards that look unsolvable.
- Our honest angle: every level solvable, mistakes shown in red so you learn, videos only optional, calm with no timer.

## Title (max 30)
**`Arrow Cube 3D: Logic Puzzle`** (27). Adds "puzzle"/"logic" for search without touching "Escape".
Keep-as-is option: `Arrow Cube 3D` (13).

## Short description (max 80)
**`Tap arrows off the cube in the right order. A calm 3D logic puzzle, no timer.`** (77)

## Full description
```
Turn the cube, find the arrow that is free, and tap it away.

Arrow Cube 3D is a calm logic puzzle. Every block points somewhere. Tap an arrow and it slides off the cube in that direction, but only if nothing is in its way. Pick the right order and the whole cube comes apart.

HOW IT WORKS
• Spin the cube to look at every side
• Tap an arrow to send it flying in the direction it points
• If another arrow blocks the path, it bumps back and turns red so you can see what went wrong
• Clear every arrow to finish the level and earn up to 3 stars

WHAT'S INSIDE
• A level map that grows from small, simple cubes to big, tricky shapes
• Every level can be solved
• A daily puzzle and a 7-day streak
• Treasure chests along the way with coins and helpers
• Hints, Eraser and Magic Wand helpers for when you are stuck
• Themes to change the look of the cube
• Classic 2D mode: flat arrow puzzles from 4x4 up to 10x10
• No timer: think as long as you like
• Plays offline, no Wi-Fi needed
• Videos are always optional, for extra helpers or a second chance
• No ads in the middle of a level: full-screen ads only appear after some wins, and the small banner sits below the puzzle, never over it

Made by Yebee Games, a small independent studio. Tell us what you think from the Play Store page; we read every message.
```
Check before publishing (Lena/Theo): treasure chest contents, themes and 3-star rating match the release build. Classic 2D line added 24 Nov (it is on develop since 1.0.8, so it ships with production); remove it if the production build is cut without it.

**No-mid-level-ads line (Zara, 26 Nov):** added after Nora's Tap Away 3D teardown (docs/research/2026-11-26-tap-away-3d.md: 15 of 16 reviews complain about ads, mostly interruptions inside a level). Checked on develop 1.0.12: the only interstitial call is `checkAndShowAd()` in the level-win flow (from level 6, every 3rd win, never after a loss); rewarded videos only start from a button the player taps; the banner area is reserved at the bottom so it doesn't cover the cube (`src/ads.js`). Remove or reword this line if ad placement ever changes.

**Offline check (Zara, 24 Nov):** develop 1.0.8 `npm run build`, loaded in Chromium with every non-local request blocked: 0 outside requests, fonts and Three.js load from the bundle, 3D level 1 and Classic 2D level 1 both start with no errors. So "Plays offline" is true for play; ads simply don't load without a connection (nothing is gated on them). Worth one real airplane-mode check on a phone before publishing.

## Screenshots
Storyboard in `store/screenshots.md`. 7 screenshots made 25 Nov from develop 1.0.10 (AD_DEBUG off): `store/screenshots/01-07*.png` (1080x1920, captioned), plain game frames in `store/screenshots/raw/`. Re-make with `npm run build && node store/make_screenshots.cjs`.

## Feature graphic
Existing `play_store_feature_graphic_1024x500.png` stays unless the CEO wants a refresh. Idea for a refresh: deep navy background, our cube at 3/4 view on the right with two arrows mid-flight leaving trails, "ARROW CUBE 3D" left in Fredoka bold, white. Our own cube style and colours.
