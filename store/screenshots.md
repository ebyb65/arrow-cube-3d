# Arrow Cube 3D: screenshot storyboard

Zara, 23 Nov 2026 (storyboard); screenshots produced 25 Nov 2026 from develop 1.0.10 (code 11, AD_DEBUG off).
7 portrait screenshots, 1080x1920, same frame style as Drop 2048 (caption on top, game in a plain rounded phone frame) in Arrow Cube's sky-blue to navy colours.

Files: `store/screenshots/*.png` (upload these, in order) and `store/screenshots/raw/*.png` (game only, no caption).
Script: `npm run build && node store/make_screenshots.cjs` (Playwright, 360x640 at 3x). `ONLY=01,04 node ...` re-makes single shots.
State: a demo save seeded in localStorage (level 48 reached, 2450 coins, 4-day streak, a few themes owned, tutorials seen). Everything on screen is the real game UI; nothing is drawn over it.

| # | File | Caption (title / line 2) | What it shows |
|---|---|---|---|
| 1 | 01-tap-slide-clear | Tap. Slide. Clear. / A calm 3D logic puzzle | Level 12, one arrow flying off the cube. |
| 2 | 02-turn-the-cube | Turn the cube / Every side hides a move | Level 20 turned to a corner view. |
| 3 | 03-find-the-order | Find the right order / Blocked arrows turn red | Level 8 after tapping a blocked arrow: it's red, hearts 2/3, the real "Blocked!" message. |
| 4 | 04-bigger-shapes | Bigger shapes / Puzzles grow as you play | Level 150, a three-cube shape. |
| 5 | 05-daily-puzzle | Daily puzzle / Keep your streak going | Daily Puzzle & Quests with a 4-day streak. |
| 6 | 06-treasure | Open chests / Coins and helpers as you go | Chest opened: +200 coins and 1 Eraser. |
| 7 | 07-make-it-yours | Make it yours / Unlock themes | Level 22 in the Crystal theme. |

Changes from the 23 Nov storyboard: captions 4-6 shortened to fit one line; shot 7 shows a theme in play instead of the store's theme list (the store also shows coin packs, which are off).

Rules: no fake UI, no features that aren't in the release build, no prices or "packs" (IAP is off). Check before publishing: the release build must still match (re-run the script on the release commit if the UI changed).
Foldable screenshots (required April 2027) are a separate item (foldable-shots).
