// Ads for Arrow Cube 3D through Unity LevelPlay (capacitor-levelplay), the same
// setup Drop 2048 uses. App key and ad unit IDs are public SDK identifiers.
// Formats: rewarded (player chooses to watch) and interstitial (between levels).
(function () {
  const CONFIG = {
    appKey: '800403098',
    rewardedId: '',       // LevelPlay > Arrow Cube 3D > Ad units > Rewarded
    interstitialId: '',   // LevelPlay > Arrow Cube 3D > Ad units > Interstitial
    loadTimeoutMs: 30000,
    userWaitMs: 12000,    // how long a player waits for a video after tapping Watch
  };

  function plugin() {
    const c = window.Capacitor;
    if (!c || !c.isNativePlatform || !c.isNativePlatform()) return null;
    return (c.Plugins && c.Plugins.LevelPlay) || null;
  }

  const Ads = {
    initialized: false,
    initPromise: null,
    pending: {},
    busy: false,
    lastError: '',

    isNative() { return !!plugin(); },

    note(msg) {
      this.lastError = msg;
      console.warn('[Ads] ' + msg);
    },

    idFor(kind) { return kind === 'rewarded' ? CONFIG.rewardedId : CONFIG.interstitialId; },

    async init() {
      if (this.initialized) return true;
      if (this.initPromise) return this.initPromise;
      const p = plugin();
      if (!p) { this.note('Ads only run inside the Android app.'); return false; }
      if (!CONFIG.appKey || !CONFIG.rewardedId || !CONFIG.interstitialId) {
        this.note('Ad unit IDs are not set yet.');
        return false;
      }
      this.initPromise = (async () => {
        try {
          await p.addListener('loaded', e => this.finishLoad(e, true));
          await p.addListener('loadFailed', e => this.finishLoad(e, false));
          // No consent manager yet: do not signal consent to personalized ads.
          await p.initialize({ appKey: CONFIG.appKey, consent: { gdprConsent: false } });
          this.initialized = true;
          this.loadAd('rewarded');
          this.loadAd('interstitial');
          return true;
        } catch (e) {
          this.note('Init failed: ' + (e && e.message ? e.message : e));
          return false;
        } finally {
          this.initPromise = null;
        }
      })();
      return this.initPromise;
    },

    finishLoad(event, ok) {
      if (!event || !['rewarded', 'interstitial'].includes(event.format)) return;
      if (event.adUnitId !== this.idFor(event.format)) return;
      const pend = this.pending[event.format];
      if (!pend) return;
      if (!ok) this.note(event.format + ' load failed: ' + (event.error && event.error.message ? event.error.message : JSON.stringify(event.error || 'unknown')));
      pend.finish(ok);
    },

    // Resolves true once an ad of this kind is ready to show.
    loadAd(kind) {
      const p = plugin();
      if (!p || !this.initialized) return Promise.resolve(false);
      if (this.pending[kind]) return this.pending[kind].promise;
      const adUnitId = this.idFor(kind);
      let resolve;
      const pend = { promise: new Promise(r => { resolve = r; }) };
      pend.finish = ok => {
        if (this.pending[kind] !== pend) return;
        clearTimeout(pend.timer);
        delete this.pending[kind];
        resolve(ok);
      };
      this.pending[kind] = pend;
      pend.timer = setTimeout(() => { this.note(kind + ' load timed out'); pend.finish(false); }, CONFIG.loadTimeoutMs);
      (async () => {
        try {
          const s = await p.isReady({ format: kind, adUnitId });
          if (s && s.ready) pend.finish(true);
          else if (kind === 'rewarded') await p.loadRewarded({ adUnitId });
          else await p.loadInterstitial({ adUnitId });
        } catch (e) {
          this.note(kind + ' load request failed: ' + (e && e.message ? e.message : e));
          pend.finish(false);
        }
      })();
      return pend.promise;
    },

    async isReady(kind) {
      const p = plugin();
      if (!p || !this.initialized) return false;
      try { const s = await p.isReady({ format: kind, adUnitId: this.idFor(kind) }); return !!(s && s.ready); }
      catch (e) { return false; }
    },

    // Interstitial: never blocks the game. If nothing is ready, carry on at once.
    async showInterstitial(onDone) {
      const done = () => { onDone && onDone(); };
      if (this.busy || !this.initialized || !(await this.isReady('interstitial'))) {
        if (this.initialized) this.loadAd('interstitial');
        done();
        return;
      }
      this.busy = true;
      try {
        const r = await plugin().showInterstitial({ adUnitId: CONFIG.interstitialId });
        if (r && r.error) this.note('Interstitial failed: ' + JSON.stringify(r.error));
      } catch (e) {
        this.note('Interstitial failed: ' + (e && e.message ? e.message : e));
      }
      this.busy = false;
      this.loadAd('interstitial');
      done();
    },

    // Rewarded: the reward is granted only when the player finishes the video.
    // onUnavailable(reason): reason is 'closed' (skipped) or 'none' (no video).
    async showRewarded(onReward, onUnavailable, onLoading) {
      if (!plugin()) {               // browser preview: simulate a completed video
        setTimeout(() => onReward && onReward(), 400);
        return;
      }
      if (this.busy) return;
      this.busy = true;
      try {
        if (!(await this.init())) { onUnavailable && onUnavailable('none'); return; }
        if (!(await this.isReady('rewarded'))) {
          onLoading && onLoading();
          const ok = await Promise.race([
            this.loadAd('rewarded'),
            new Promise(r => setTimeout(() => r(false), CONFIG.userWaitMs)),
          ]);
          if (!ok) { onUnavailable && onUnavailable('none'); return; }
        }
        const r = await plugin().showRewarded({ adUnitId: CONFIG.rewardedId });
        if (r && r.rewarded === true) onReward && onReward();
        else if (r && r.error) { this.note('Rewarded failed: ' + JSON.stringify(r.error)); onUnavailable && onUnavailable('none'); }
        else onUnavailable && onUnavailable('closed');
      } catch (e) {
        this.note('Rewarded failed: ' + (e && e.message ? e.message : e));
        onUnavailable && onUnavailable('none');
      } finally {
        this.busy = false;
        if (this.initialized) this.loadAd('rewarded');
      }
    },
  };

  window.Ads = Ads;
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => Ads.init(), 800));
})();
