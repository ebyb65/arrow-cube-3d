# Play Age Signals and California's Digital Age Assurance Act (finding, 24 Nov 2026)

Owner: Theo. Backlog: age-signals (done) -> age-api (Arjun). This is a compliance reading, not legal advice.

## What changed
- Google Play email, 19 Nov 2026: from January 2027, sharing age signals through the Play Age Signals API (beta) becomes mandatory for users in California, and also for Brazil. Google: "It is your responsibility to determine how these laws apply to your app."
- California AB 1043 (Digital Age Assurance Act), signed 13 Oct 2025, takes effect 1 Jan 2027. A developer must request an age signal from the OS or app store when the app is downloaded and launched. The signal is an age range (under 13, 13-15, 16-17, 18+). Once received, the developer is treated as having actual knowledge of that age range and must use it as the primary indicator of age.
- The law's definition of "application" covers any downloadable app, so our games (offline, no accounts, ads) appear to be covered. Enforcement is by the California Attorney General: up to $2,500 per affected child (negligent) and $7,500 (intentional).

## What it means for our games
Both games show ads through Unity LevelPlay and have no accounts or purchases.
1. Each game should ask Play for the age signal on launch (Play Age Signals API; needs a small native Capacitor plugin or an existing community plugin).
2. If the signal says the player is under 13, ads must not be personalized for them (COPPA), and under 16 we must not "sell or share" data for ads without consent (CCPA). Practical rule: for any signal under 18, set LevelPlay's child-directed/non-personalized flags before ads initialise. No gameplay change, nothing harsher for players.
3. If no signal is available (outside California and Brazil, API error), keep today's behaviour.

## Deadline
1 Jan 2027 for California (Brazil per Google's email: January 2027). No Play Console form is needed for this; if the Data safety or target-audience answers ever need to change because of it, Theo raises a CEO approval.

## Sources
- Google Play email "Updates to the Play Age Signals API (U.S. and Brazil)", 19 Nov 2026 (hq/inbox)
- Kelley Drye, FAQ on California's Digital Age Assurance Act (21 Oct 2025)
