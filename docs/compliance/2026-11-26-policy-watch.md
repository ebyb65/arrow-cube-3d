# Policy watch, 26 Nov 2026 (Theo)

Scope: both games (Capacitor HTML, Unity LevelPlay ads via capacitor-levelplay 0.3.0, minSdk 24, targetSdk 36, no purchases).

## 1. Android developer verification: app registration (deadline already passed, 30 Sep 2026)
- Play Policy Deadlines table, row "Play Console Requirements" (announced 15 Jul 2026, deadline 30 Sep 2026): "you must register your Play apps in Play Console" and "check your Play Console Home page and register any remaining apps you want to continue distributing to avoid global removal from Google Play."
- Android Developers Blog (Jun 2026, updated 15 Jul): "99% of apps on Play have been registered automatically." Enforcement started 30 Sep 2026 in Brazil, Indonesia, Singapore and Thailand; global for all apps on certified devices in 2027.
- Our status: unknown. Our Play API key cannot see registration. Both apps still respond on the Play API (26 Nov check), and no Google mail about it is in hq/inbox, so they were most likely registered automatically. Arrow Cube 3D has never been in production, so it is the one to check.
- Action: CEO approval (2-minute check on the Play Console Home page / app list, register any app shown as unregistered). Registration is a statement to Google, so the CEO does it.

## 2. Other 2027 Play deadlines (Policy Deadlines table, announced 29 Oct 2026 or earlier)
- 27 Jan 2027: Contacts permission (Contact Picker), location button, READ_CALL_LOG, geofencing foreground service. We request none of these: no action.
- 27 Jan 2027: subscription eligibility discounts: we sell nothing: no action.
- 25 Aug 2027: Local Network permission needs a Play declaration for apps targeting API 37+. We target 36. Note for the future targetSdk 37 bump: check the merged manifest (ad SDKs) for NEARBY/LOCAL network permissions first.
- 25 Aug 2027: Manage Contacts permission restricted: not used.

## 3. Unity / LevelPlay
- Unity Ads Android SDK 4.22.0 (13 Nov 2026): SDK 41% smaller with R8; Unity cites the Play DEX optimization requirement. Supports the existing r8 item (Feb 2027). Our builds pin unityads-adapter 5.15.0; no forced update.
- LevelPlay 9.4.0 notice (Apr 2026): legacy boolean setConsent() deprecated in favour of LevelPlay.PrivacySettings, "hard deprecation of legacy APIs planned for as late as August 2026". We pass consent through capacitor-levelplay 0.3.0, which pins its own SDK version, so nothing breaks today. When we upgrade the plugin or LevelPlay SDK (also for the age-api under-18 flags), use the PrivacySettings API (unified COPPA flag). Added as a note on age-api.

## Sources
- https://support.google.com/googleplay/android-developer/table/12921780?hl=en
- https://android-developers.googleblog.com/2026/06/android-developer-verification.html
- https://docs.unity.com/en-us/grow/ads/Changelog
- https://discussions.unity.com/t/action-required-preparing-for-levelplay-sdk-compliance-modernization-v9-4-0/1716807
