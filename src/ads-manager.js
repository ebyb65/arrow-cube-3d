// Unity Ads Integration Manager for Capacitor Android
// Plug in your Unity Game ID from the Unity Monetization Dashboard

export const UnityAdsConfig = {
  gameId: 'YOUR_UNITY_GAME_ID_HERE', // e.g., '5432109'
  testMode: true, // Set to false before Play Store release
  bannerPlacement: 'Banner_Android',
  interstitialPlacement: 'Interstitial_Android'
};

export class AdsManager {
  static async initialize() {
    console.log('[Unity Ads] Initializing with Game ID:', UnityAdsConfig.gameId);
    // In Capacitor Android, delegates to Unity Ads SDK or AdMob bridge
  }

  static async showBanner() {
    console.log('[Unity Ads] Loading Banner 320x50 on placement:', UnityAdsConfig.bannerPlacement);
  }

  static async showInterstitial(onDismissed) {
    console.log('[Unity Ads] Showing Interstitial on placement:', UnityAdsConfig.interstitialPlacement);
    if (onDismissed) onDismissed();
  }
}
