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

## 💰 Unity Ads Setup for Google Play Release
1. Create a free account at [Unity Cloud Monetization](https://cloud.unity.com/).
2. Create a new project and copy your **Android Game ID**.
3. In `src/ads-manager.js`, replace `'YOUR_UNITY_GAME_ID_HERE'` with your actual Unity Game ID.
4. Set `testMode: false` when uploading your final signed release bundle to Google Play Console.

---

## 🚀 How to Build Android APK with No Laptop
1. Upload this repository to your GitHub account.
2. In the **Actions** tab on GitHub, click **Run workflow** on `android-build.yml`.
3. Download the generated `app-debug.apk` artifact straight onto your Android phone to test and play!
