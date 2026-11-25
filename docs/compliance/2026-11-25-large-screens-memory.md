# Play policy watch, 25 Nov 2026: foldables/large screens for games, memory thresholds

Owner: Theo. Applies to both games (portrait-only HTML games in a Capacitor WebView, targetSdk 36).

## 1. Large screens and foldables quality for games (announced 18 Nov 2026)
Source: Android Developers Blog, "Elevating games: New large screens and foldables quality standards on Google Play" (https://developer.android.com/blog/posts/elevating-game-quality-foldables-large-screens-google-play) and the Tier 3 page (https://developer.android.com/games/large-screen/tier-3).

- **April 2027, screenshots (Zara):** "Beginning in April 2027, you will be required to provide at least 3 foldable screenshots" plus the standard phone screenshot. Phone screenshots stay in the primary orientation (9:16 for us). Foldable shapes: a 1:1 inner display, or a 3:4 inner plus a 10:16 outer display, in the game's primary orientation. Upload is already open in Play Console.
- **August 2027, Tier 3 quality (Arjun, Lena):** "Beginning August 2027, Google Play will require games to meet at minimum the baseline, Tier 3 (Ready)" to publish new games and updates. Key lines for portrait-only games: games render full screen in their supported orientation and "cleanly letterbox or pillarbox in-engine when rotated to an unsupported orientation"; the Tier 3 page (read in part) says portrait-only games should not lock orientation on unfolded foldables and tablets, and should not rely on the OS compatibility-mode letterboxing (declare resizeableActivity="true").
- What this means for us: check both games on a foldable and tablet emulator (unfolded, landscape): the board must stay centred and sized with clean side bars, nothing cut off, taps land where they should. Probably small CSS/manifest work. Nothing to declare to Google.
- Not confirmed: whether an HTML game in a WebView is judged as a "game" or as an "app" (the app standard is stricter on adaptive layouts). Our Play category is Games, so we plan for the games standard.

## 2. Memory and DEX thresholds (announced 26 Aug 2026)
Source: Android Developers Blog, "Elevating app quality: reducing memory usage and improving device migration" (https://developer.android.com/blog/posts/elevating-app-quality-reducing-memory-usage-and-improving-device-migration).

- "Starting in February 2027, apps and games must meet their respective bad behavior thresholds": dynamic memory, bitmap memory, and DEX optimization ("a minimum of 25% coverage across optimization, shrinking, and obfuscation using a tool such as R8").
- Consequence: "may see reduced app visibility and publishing capabilities on Google Play."
- The DEX part is already backlog item r8 (Arjun). The numeric memory thresholds are in Play Console Help answer 17492799 (not read yet). Action: after the next releases, read the memory figures in Android vitals for both games; Three.js (Arrow Cube) is the one to watch.

## Also checked
- Target API: API 36 required for new apps and updates since 31 Aug 2026; we target 36. API 37 is expected around August 2027 (secondary sources only so far).
- No new Data safety, ads, families or trader-status changes found this week. Trader status deadline (Feb 2027) and the California age-signal law (1 Jan 2027) are already tracked (trader, age-api).
