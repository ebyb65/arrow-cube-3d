// Ads for Arrow Cube 3D through Unity LevelPlay mediation (capacitor-levelplay), the same
// setup Drop 2048 uses: Unity Ads, ironSource and other networks compete for each ad.
// App key and ad unit IDs are public SDK identifiers.
// Formats: rewarded (player chooses), interstitial (between levels), banner (bottom of screen).
(function () {
  const CONFIG = {
    appKey: '29c1bafdd',           // LevelPlay > Apps > Arrow Cube 3D > App key
    rewardedId: '7osr38c4s9h4roh0',       // LevelPlay > Arrow Cube 3D > Ad units > Rewarded
    interstitialId: '07nu4ybfn5zi2ume',   // LevelPlay > Arrow Cube 3D > Ad units > Interstitial
    bannerId: 'zehbz0n3zrawvnk1',         // LevelPlay > Arrow Cube 3D > Ad units > Banner (empty = no banner)
    bannerRetryMs: 30000,
    loadTimeoutMs: 30000,
    userWaitMs: 12000,    // how long a player waits for a video after tapping Watch
  };

  function plugin() {
    const c = window.Capacitor;
    if (!c || !c.isNativePlatform || !c.isNativePlatform()) return null;
    return (c.Plugins && c.Plugins.LevelPlay) || null;
  }

  // --- Play Age Signals (California AB 1043 / Brazil, Jan 2027) ---
  // On every launch, before ads start, ask Google Play for the player's age signal
  // (plugins/play-age-signals). An age range under 18 means child-directed, non-personalized ads
  // (LevelPlay COPPA + "do not sell").
  // No signal (most regions) or an error: today's behaviour. Ads shown are the same either way.
  const AGE = { timeoutMs: 4000, retryMs: 1500 };

  function agePlugin() {
    const c = window.Capacitor;
    if (!c || !c.isNativePlatform || !c.isNativePlatform()) return null;
    return (c.Plugins && c.Plugins.PlayAgeSignals) || null;
  }

  // 'minor' | 'adult' | 'none' (no signal / not available). Play 0.0.6 answers with an age range:
  // ageUpper null with an ageLower means 18 or over; both null means Play has no age for this user.
  function ageGroup(r) {
    if (!r || !r.ok) return 'none';
    if (typeof r.ageUpper === 'number' && r.ageUpper < 18) return 'minor';
    if (typeof r.ageLower === 'number' && r.ageLower < 18 && typeof r.ageUpper !== 'number') return 'minor'; // open range from a child age: play safe
    if (typeof r.ageLower === 'number') return 'adult';
    return 'none';
  }

  async function askAgeOnce(p) {
    try {
      return await Promise.race([
        p.check(),
        new Promise(r => setTimeout(() => r({ ok: false, error: 'timeout' }), AGE.timeoutMs)),
      ]);
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : String(e) };
    }
  }

  async function checkAge() {
    const p = agePlugin();
    if (!p) return { group: 'none', result: { ok: false, error: 'no plugin' } };
    let r = await askAgeOnce(p);
    if (!r || (!r.ok && r.error !== 'timeout')) {      // transient Play errors: one retry
      await new Promise(res => setTimeout(res, AGE.retryMs));
      r = await askAgeOnce(p);
    }
    return { group: ageGroup(r), result: r };
  }

  const Ads = {
    initialized: false,
    initPromise: null,
    ageGroup: 'none',     // from Play Age Signals: minor | adult | none
    ageResult: null,
    pending: {},
    busy: false,
    lastError: '',
    bannerState: 'none',   // none | creating | loading | shown | failed
    bannerEverLoaded: false,

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
          await p.addListener('bannerLoaded', e => this.onBannerLoaded(e));
          await p.addListener('bannerLoadFailed', e => this.onBannerFailed(e));
          await p.addListener('bannerDisplayFailed', e => this.onBannerFailed(e));
          // No consent manager yet: do not signal consent to personalized ads.
          const consent = { gdprConsent: false };
          const age = await checkAge();
          this.ageGroup = age.group;
          this.ageResult = age.result;
          if (age.group === 'minor') { consent.coppa = true; consent.ccpaDoNotSell = true; }
          if (age.result && !age.result.ok && age.result.error !== 'no plugin') this.note('Age signal unavailable: ' + age.result.error);
          await p.initialize({ appKey: CONFIG.appKey, consent });
          this.initialized = true;
          this.loadAd('rewarded');
          this.loadAd('interstitial');
          this.setupBanner();
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

  // --- Banner: bottom of the screen; the game reserves room so it never covers the puzzle ---
  Object.assign(Ads, {
    async setupBanner() {
      const p = plugin();
      if (!CONFIG.bannerId || !p || !this.initialized) return false;
      if (this.bannerState !== 'none' && this.bannerState !== 'failed') return true;
      this.bannerState = 'creating';
      try {
        await p.destroyBanner({ bannerId: 'main' });
        const created = await p.createBanner({ adUnitId: CONFIG.bannerId, bannerId: 'main', size: 'BANNER', position: 'bottom' });
        this.applyBannerSpace(created && created.frame);
        this.bannerState = 'loading';
        await p.loadBanner({ bannerId: 'main' });
        const shown = await p.showBanner({ bannerId: 'main' });
        this.applyBannerSpace(shown && shown.frame);
        return true;
      } catch (e) {
        this.note('Banner setup failed: ' + (e && e.message ? e.message : e));
        this.bannerState = 'failed';
        this.retryBanner();
        return false;
      }
    },
    onBannerLoaded(e) {
      if (!e || e.bannerId !== 'main') return;
      this.bannerState = 'shown';
      this.bannerEverLoaded = true;
      this.applyBannerSpace(e.frame);
    },
    onBannerFailed(e) {
      if (!e || e.bannerId !== 'main') return;
      if (this.bannerEverLoaded) return;   // refresh found no new ad: SDK keeps the current one
      this.note('Banner failed: ' + JSON.stringify(e.error || 'unknown'));
      this.bannerState = 'failed';
      this.retryBanner();
    },
    retryBanner() {
      clearTimeout(this.bannerTimer);
      this.bannerTimer = setTimeout(() => this.setupBanner(), CONFIG.bannerRetryMs);
    },
    applyBannerSpace(frame) {
      if (!frame || !frame.height) return;
      document.documentElement.style.setProperty('--banner-space', Math.ceil(frame.height) + 'px');
    },
  });

  Ads._ageGroup = ageGroup;   // for tests
  window.Ads = Ads;
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => Ads.init(), 800));
})();
