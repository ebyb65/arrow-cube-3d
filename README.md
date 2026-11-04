# Arrow Cube 3D: Escape Puzzle (250 Levels + Unity Ads)
*A Minimalist 3D Story-Driven Puzzle Game for Android — Built 100% in the Cloud with GitHub & GitHub Codespaces (No Local Laptop Required!)*

---

## 🌟 Game Highlights
* **250 Progressive Levels:** Procedural deterministic level generation scaling from Level 1 up to Level 250 (including the landmark 53-arrow Level 120 Master Labyrinth).
* **Multi-Face Edge Wrapping Vectors:** Long continuous arrows wrapping over 90-degree cube edges with seamless corner vertices.
* **Cinematic Slower Escape Animation:** Smooth two-phase escape trajectory (readable slide followed by graceful liftoff).
* **Free 360-Degree Trackball Orbit:** Infinite unclamped spherical rotation with inertia damping in all directions.
* **Integrated Unity Ads:** Standard 320x50 mobile banner ad + full-screen interstitial ads triggered every 3 levels with skip countdown timer.

---

## 💰 Ads (real Unity Ads via capacitor-unity-ads)
* Rewarded videos: +1 heart continue, free power-ups, double coins on win. Reward is granted only when the video is completed.
* Interstitial: after every 3rd win, from level 6 onward; never after a loss.
* Game ID, test mode and placement IDs live in `src/ads.js`. Keep `testMode: true` for closed testing.
* In-app purchases are switched off (`IAP_ENABLED = false` in `index.html`) until real Google Play Billing is added.

## 🔐 Release signing
The upload key is **never** stored in this repo. The workflow reads it from GitHub Secrets:
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`.

## 🚀 Build
`npm install && npm run build` creates `dist/` with every library bundled (works offline).
In GitHub: **Actions → Build Arrow Cube 3D → Run workflow**, then download the APK (testing) or the signed AAB (Play Console).
