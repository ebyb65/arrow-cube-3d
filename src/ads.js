// Real Unity Ads integration (same Capacitor bridge as Drop 2048).
// Only rewarded and interstitial formats: the bridge has no banner support,
// and banners stay off the puzzle screen anyway.
(function () {
  const CONFIG = {
    gameId: '800403098',         // Unity Android Game ID for Arrow Cube 3D: confirm in the Unity dashboard
    testMode: true,              // keep true for closed testing; set false for the production release
    rewardedId: 'Rewarded_Android',
    interstitialId: 'Interstitial_Android',
  };

  const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  function plugin() {
    const p = window.Capacitor && window.Capacitor.Plugins;
    return (p && (p.Unityads || p.UnityAds)) || null;
  }

  const Ads = {
    ready: false,
    rewardedLoaded: false,
    interstitialLoaded: false,
    busy: false,

    async init() {
      const p = plugin();
      if (!isNative || !p || this.ready) return;
      try {
        await p.initialize({ gameId: CONFIG.gameId, testMode: CONFIG.testMode });
        this.ready = true;
        this.loadRewarded();
        setTimeout(() => this.loadInterstitial(), 1500);
      } catch (e) {
        console.warn('[Ads] init failed', e);
        setTimeout(() => this.init(), 15000);
      }
    },

    async loadRewarded() {
      const p = plugin();
      if (!p || !this.ready) return;
      try {
        await p.loadRewardedVideo({ placementId: CONFIG.rewardedId });
        this.rewardedLoaded = true;
      } catch (e) {
        this.rewardedLoaded = false;
        setTimeout(() => this.loadRewarded(), 20000);
      }
    },

    async loadInterstitial() {
      const p = plugin();
      if (!p || !this.ready) return;
      try {
        await p.loadInterstitial({ placementId: CONFIG.interstitialId });
        this.interstitialLoaded = true;
      } catch (e) {
        this.interstitialLoaded = false;
        setTimeout(() => this.loadInterstitial(), 20000);
      }
    },

    // Interstitial: never blocks the game. If no ad is loaded, continue immediately.
    async showInterstitial(onDone) {
      const p = plugin();
      if (!p || !this.ready || !this.interstitialLoaded || this.busy) { onDone && onDone(); return; }
      this.busy = true;
      this.interstitialLoaded = false;
      try { await p.showInterstitial(); } catch (e) { console.warn('[Ads] interstitial', e); }
      this.busy = false;
      onDone && onDone();
      setTimeout(() => this.loadInterstitial(), 1000);
    },

    // Rewarded: reward is granted only when the player actually finishes the ad.
    async showRewarded(onReward, onUnavailable) {
      if (!isNative) {               // browser preview: simulate a completed ad so the flow can be tested
        setTimeout(() => onReward && onReward(), 400);
        return;
      }
      const p = plugin();
      if (!p || !this.ready || !this.rewardedLoaded || this.busy) {
        onUnavailable && onUnavailable();
        this.ready ? this.loadRewarded() : this.init();
        return;
      }
      this.busy = true;
      this.rewardedLoaded = false;
      let earned = false;
      try {
        const res = await p.showRewardedVideo();
        earned = !!(res && res.success);
      } catch (e) { console.warn('[Ads] rewarded', e); }
      this.busy = false;
      if (earned) onReward && onReward();
      else onUnavailable && onUnavailable(true);
      setTimeout(() => this.loadRewarded(), 1000);
    },
  };

  window.Ads = Ads;
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => Ads.init(), 800));
})();
