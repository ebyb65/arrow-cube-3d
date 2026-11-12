// Unity Ads for Arrow Cube 3D (capacitor-unity-ads bridge).
// Formats: rewarded (player chooses to watch) and interstitial (between levels).
(function () {
  const CONFIG = {
    gameId: '800403098',              // Unity dashboard > Arrow Cube 3D > Monetization > Game ID
    testMode: true,                   // keep true for closed testing; set false for the production release
    rewardedId: 'Rewarded_Android',   // Unity dashboard > Monetization > Ad Units
    interstitialId: 'Interstitial_Android',
    userWaitMs: 12000,                // how long a player waits for a video after tapping Watch
  };

  function plugin() {
    const c = window.Capacitor;
    if (!c || !c.isNativePlatform || !c.isNativePlatform()) return null;
    return (c.Plugins && (c.Plugins.Unityads || c.Plugins.UnityAds)) || null;
  }

  function msg(e) { return e && e.message ? e.message : String(e); }

  const Ads = {
    initialized: false,
    initPromise: null,
    loading: {},
    loaded: { rewarded: false, interstitial: false },
    busy: false,
    lastError: '',

    note(m) { this.lastError = m; console.warn('[Ads] ' + m); },

    async init() {
      if (this.initialized) return true;
      if (this.initPromise) return this.initPromise;
      const p = plugin();
      if (!p) { this.note('Ads only run inside the Android app.'); return false; }
      this.initPromise = (async () => {
        try {
          await p.initialize({ gameId: CONFIG.gameId, testMode: CONFIG.testMode });
          this.initialized = true;
          this.loadAd('rewarded');
          setTimeout(() => this.loadAd('interstitial'), 1500);
          return true;
        } catch (e) {
          this.note('Init failed: ' + msg(e));
          setTimeout(() => this.init(), 20000);
          return false;
        } finally {
          this.initPromise = null;
        }
      })();
      return this.initPromise;
    },

    // Resolves true once an ad of this kind is loaded.
    loadAd(kind) {
      const p = plugin();
      if (!p || !this.initialized) return Promise.resolve(false);
      if (this.loaded[kind]) return Promise.resolve(true);
      if (this.loading[kind]) return this.loading[kind];
      const placementId = kind === 'rewarded' ? CONFIG.rewardedId : CONFIG.interstitialId;
      const call = kind === 'rewarded' ? p.loadRewardedVideo({ placementId }) : p.loadInterstitial({ placementId });
      this.loading[kind] = call.then(() => {
        this.loaded[kind] = true;
        return true;
      }).catch(e => {
        this.note(kind + ' load failed: ' + msg(e));
        setTimeout(() => this.loadAd(kind), 20000);
        return false;
      }).finally(() => { delete this.loading[kind]; });
      return this.loading[kind];
    },

    // Interstitial: never blocks the game. If nothing is loaded, carry on at once.
    async showInterstitial(onDone) {
      const done = () => { onDone && onDone(); };
      const p = plugin();
      if (!p || this.busy || !this.loaded.interstitial) {
        if (this.initialized) this.loadAd('interstitial');
        done();
        return;
      }
      this.busy = true;
      this.loaded.interstitial = false;
      try { await p.showInterstitial(); } catch (e) { this.note('Interstitial failed: ' + msg(e)); }
      this.busy = false;
      setTimeout(() => this.loadAd('interstitial'), 1000);
      done();
    },

    // Rewarded: reward only when the player finishes the video.
    // onUnavailable(reason): 'closed' (skipped) or 'none' (no video available).
    async showRewarded(onReward, onUnavailable, onLoading) {
      const p = plugin();
      if (!p) {                       // browser preview: simulate a completed video
        setTimeout(() => onReward && onReward(), 400);
        return;
      }
      if (this.busy) return;
      this.busy = true;
      try {
        if (!(await this.init())) { onUnavailable && onUnavailable('none'); return; }
        if (!this.loaded.rewarded) {
          onLoading && onLoading();
          const ok = await Promise.race([
            this.loadAd('rewarded'),
            new Promise(r => setTimeout(() => r(false), CONFIG.userWaitMs)),
          ]);
          if (!ok) { onUnavailable && onUnavailable('none'); return; }
        }
        this.loaded.rewarded = false;
        const r = await p.showRewardedVideo();
        if (r && r.success) onReward && onReward();
        else onUnavailable && onUnavailable('closed');
      } catch (e) {
        this.note('Rewarded failed: ' + msg(e));
        onUnavailable && onUnavailable('none');
      } finally {
        this.busy = false;
        setTimeout(() => this.loadAd('rewarded'), 1000);
      }
    },
  };

  window.Ads = Ads;
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => Ads.init(), 800));
})();
