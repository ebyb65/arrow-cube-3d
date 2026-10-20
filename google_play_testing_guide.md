# Google Play Store Upload & In-App Purchase Guide: Arrow Cube 3D

**Developer / Publisher:** Yebee Games

This guide explains how your in-game store works for real money, how payments flow from players to your bank account, how to configure In-App Purchases in Google Play Console, and how to upload and test **Arrow Cube 3D**.

## 1. Unified Identity: Yebee Games

We have aligned all configuration files, package IDs, and store listings under your studio identity:

* **Developer Name:** Yebee Games

* **Game Title:** Arrow Cube 3D

* **Package Name (Application ID):** `com.yebeegames.arrowcube3d`

* **Public Google Play URL:** `https://play.google.com/store/apps/details?id=com.yebeegames.arrowcube3d`

### Keystore Generation Command (Yebee Games)

Run this single command in your terminal to create your official release signing key:

```
keytool -genkey -v -keystore yebeegames-upload-key.jks -alias yebeegames -keyalg RSA -keysize 2048 -validity 10000


```

*(Store `yebeegames-upload-key.jks` and your password in a safe backup.)*

## 2. How Real-Money Purchases (IAP) Work

When a player taps **\$0.99** or **\$4.99** in the in-game store, here is the exact step-by-step process:

### A. The Player Experience (Client Side)

1. **Tap Buy:** The player taps a price button (e.g. `$1.99`) in the game's Cosmic Store.

2. **Google Play Bottom Sheet:** Google Play's native secure billing window slides up automatically over the game.

3. **Payment Method:** The player selects their preferred payment method already saved in their Google Account (Credit/Debit Card, Google Pay, PayPal, Carrier Mobile Billing, or Google Play Gift Card balance).

4. **Authentication:** The player confirms with fingerprint, face unlock, or Google password.

5. **Instant Fulfillment:** Google Play verifies the transaction, returns a digitally signed receipt to the game, and the game instantly increments the player's coins and powerup inventory.

### B. The Financial Flow (How You Get Paid)

1. **Payment Collection:** Google collects the real money from the player.

2. **Platform Commission:**

   * Google retains **15%** for developers on the standard 15% tier (first \$1,000,000 USD in revenue per year upon enrolling in the 15% fee tier in Play Console).

   * You keep **85%** of the net revenue.

3. **Monthly Payout:**

   * Google aggregates your earnings every calendar month.

   * Around the **15th of each month**, Google automatically transfers the previous month's payout directly into your linked bank account via wire transfer / direct deposit through your Google Payments Merchant Profile.

## 3. In-App Products Catalog (Saudi Riyals - SAR)

To enable these purchases on Google Play, go to **Google Play Console → Monetize → Products → In-app products → Create product**. Create each item with the exact Product ID and SAR pricing listed below:

### Coin Packs (Consumable)

| Product ID | Product Title | Price (SAR) | Price (USD Eq.) | In-Game Rewards & Value | 
| ----- | ----- | ----- | ----- | ----- | 
| `coins_3000` | Handful of Coins (3,000) | **3.99 SAR** | \~\$1.06 | **+3,000 Coins** (Enough for 6 Hints or 3 Wands) | 
| `coins_8500` | Pouch of Coins (8,500) | **7.99 SAR** | \~\$2.13 | **+8,500 Coins** (Popular • 17 Hints or 8 Wands) | 
| `coins_25000` | Chest of Coins (25,000) | **18.99 SAR** | \~\$5.06 | **+25,000 Coins** (Best Value • 50 Hints or 25 Wands) | 
| `coins_65000` | Cosmic Vault (65,000) | **37.99 SAR** | \~\$10.13 | **+65,000 Coins** (Mega Pack • 130 Hints or 65 Wands) | 

### Tactical Powerup Bundles (Consumable)

| Product ID | Product Title | Price (SAR) | Content Breakdown & Player Value | 
| ----- | ----- | ----- | ----- | 
| `bundle_explorer` | Explorer Starter Pack | **7.99 SAR** | **5,000 Coins** + **5 Hints** + **5 Erasers** + **3 Wands** (13,000 Coins total value) | 
| `bundle_strategist` | Master Strategist Bundle | **18.99 SAR** | **15,000 Coins** + **12 Hints** + **12 Erasers** + **8 Wands** (Hot Deal • 35,000 Coins value) | 
| `bundle_apex` | Apex Solver Crate | **37.99 SAR** | **45,000 Coins** + **30 Hints** + **30 Erasers** + **20 Wands** (VIP Crate • 95,000 Coins value) | 

## 4. How to Test Real Purchases for FREE (License Testing)

You do **not** need to spend your own money to test in-app purchases on your phone:

1. In Google Play Console, go to **Settings → Developer account → License testing**.

2. Add your own Gmail address (and your testers' Gmails) to the list.

3. Set **License response** to `RESPOND_NORMALLY`.

4. When you open the test build on your phone and tap `$4.99`, Google Play will display:

   > *"Test card, always approves"*

5. You can complete the purchase, test coin crediting, and verify inventory without any real charges to your credit card!

## 5. Setting Up Your Google Payments Merchant Account

To receive money from game purchases:

1. In Google Play Console, navigate to **Settings → Developer account → Payment settings**.

2. Click **Set up a merchant profile**.

3. Enter your business or personal legal name, business address, and link your **Bank Account** (IBAN / Swift).

4. Complete the brief tax form (W-8BEN for non-US developers or W-9 for US developers) so Google can disburse payouts directly to your account.

## 6. Store Visual Assets (Ready in Bundle)

| Asset | Dimensions & Format | File Name | Status | 
| ----- | ----- | ----- | ----- | 
| **App Icon** | 512 × 512 px, 32-bit PNG, max 1MB | `play_store_icon_512x512.png` | **Ready** (339 KB) | 
| **Feature Graphic** | 1024 × 500 px, 24-bit PNG/JPG (no alpha), max 1MB | `play_store_feature_graphic_1024x500.png` | **Ready** (640 KB) | 

## 7. Updated GitHub Actions Workflow

When you push code to GitHub:

1. GitHub Actions automatically executes `./gradlew bundleRelease` and `./gradlew assembleDebug`.

2. Go to the **Actions** tab in GitHub, select the latest run, and download:

   * **`ArrowCube3D-Release-AAB`**: Upload this `.aab` file to Google Play Console (Internal / Closed testing).

   * **`ArrowCube3D-Debug-APK`**: Install directly on any Android phone for instant sideload testing.

## 8. Store Listing Copy (Copy-Paste Ready)

* **App Title:** `Arrow Cube 3D`

* **Short Description (78/80 chars):**

  > `Untangle 3D arrow labyrinths across crystal multi-cube puzzles in deep space!`

* **Full Description:**

```
Dive into Arrow Cube 3D by Yebee Games, a mind-bending spatial puzzle where logic, geometry, and foresight collide! Rotate intricate solid and translucent crystal cubes to liberate interlocking arrows and unravel dense 3D labyrinths.

Each vector has only one escape path into the void. Tap arrows in the correct sequence to navigate around barriers, avoid head-on deadlocks, and clear complex compound structures!

FEATURES:
🧊 3D SPATIAL LABYRINTHS: Rotate cubes freely in 360 degrees to spot open escape trajectories.
🧩 250+ HAND-CRAFTED PROCEDURAL LEVELS: Balanced progression scaling from casual 5x5 monoliths up to massive 450-arrow multi-cube apex megastructures.
✨ CRYSTAL MULTI-BLOCK ARCHITECTURE: Navigate puzzles spanning interconnected monolithic blocks, L-shapes, and 3D compound hubs.
💡 TACTICAL TOOL VAULT:
  • Hint Radar: Illuminates the next safe unblocked arrow.
  • Eraser Tool: Vaporizes a stubborn blocking vector with a single tap.
  • Magic Wand: Clears multi-vector deadlocks in an instant!
🛍️ COSMIC STORE & VALUE PACKS: Choose from tailored coin packs and tactical bundles, or earn rewards through daily gifts and quests.
🎨 CUSTOMIZATION: Unlock collectible player frames, avatars, and daily vault rewards.
⚡ 100% SOLVABLE: Every level is mathematically verified with a guaranteed, cycle-free solution.

Can you untangle the cosmic labyrinth? Download Arrow Cube 3D by Yebee Games and test your spatial reasoning today!


```