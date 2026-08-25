(() => {
  const LOOKAHEAD_PX = 1500;
  const OVERLAY_CLASS = "cc-overlay";
  const HOST_CLASS = "cc-host";
  const COVERED_CLASS = "cc-covered";
  const READY_ATTR = "data-cc-ready";
  const PENDING_CLASS = "cc-pending";
  const TOAST_ID = "cc-exposure-toast";
  const SETUP_ID = "cc-setup-banner";

  const adapter = ContentCoverSites.forHost(location.hostname);
  if (!adapter) return;

  document.documentElement.dataset.ccSite = adapter.site;

  let settings = ContentCoverFilter.normalizeSettings(ContentCoverFilter.DEFAULTS);
  let started = false;
  let lastFilterActive = null;
  const revealed = new Set();
  const observed = new WeakSet();
  const scoreCache = new Map();
  const pendingScores = new Map();
  let coveredQueue = [];
  let coveredFlush = null;
  let scanQueued = false;
  let modelReady = false;
  let lastContextCard = null;
  let scanTimer = null;
  let pingTimer = null;
  let navTimer = null;
  let mutationObserver = null;

  const io = new IntersectionObserver(onIntersect, {
    root: null,
    rootMargin: `0px 0px ${LOOKAHEAD_PX}px 0px`,
    threshold: 0,
  });

  observeMutations();
  listenForHideThisKind();
  listenForSetupProgress();
  loadSettings(() => {
    start();
    maybeToast();
  });

  onStorageChanged((changes, area) => {
    if (area !== "sync") return;
    const keys = [
      "randomEnabled",
      "coveragePercent",
      "dontShowEnabled",
      "dontShow",
      "focusEnabled",
      "focusText",
      "dontShowThreshold",
      "focusThreshold",
    ];
    if (!keys.some((key) => changes[key])) return;
    loadSettings(() => {
      scoreCache.clear();
      maybeToast();
      if (slowFilterOn() && !pingTimer) {
        pingModel();
        pingTimer = window.setInterval(pingModel, 2000);
      }
      if (!slowFilterOn() && pingTimer) {
        window.clearInterval(pingTimer);
        pingTimer = null;
      }
      if (started) rescan();
    });
  });

  function alive() {
    try {
      return Boolean(chrome.runtime && chrome.runtime.id);
    } catch (_error) {
      return false;
    }
  }

  function invalidated(error) {
    return /context invalidated/i.test(String((error && error.message) || error || ""));
  }

  function retire() {
    if (!started && !scanTimer && !pingTimer) return;
    started = false;
    if (scanTimer) window.clearInterval(scanTimer);
    if (pingTimer) window.clearInterval(pingTimer);
    if (navTimer) window.clearInterval(navTimer);
    scanTimer = null;
    pingTimer = null;
    navTimer = null;
    try {
      io.disconnect();
    } catch (_error) {}
    if (mutationObserver) {
      try {
        mutationObserver.disconnect();
      } catch (_error) {}
      mutationObserver = null;
    }
  }

  function sendBackground(message) {
    if (!alive()) {
      retire();
      return Promise.resolve(null);
    }
    try {
      return chrome.runtime.sendMessage(message).catch((error) => {
        if (invalidated(error)) retire();
        return null;
      });
    } catch (error) {
      if (invalidated(error)) retire();
      return Promise.resolve(null);
    }
  }

  function onStorageChanged(listener) {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (!alive()) {
          retire();
          return;
        }
        listener(changes, area);
      });
    } catch (_error) {
      retire();
    }
  }

  function storageGet(area, defaults, done) {
    if (!alive()) {
      retire();
      return;
    }
    try {
      chrome.storage[area].get(defaults, (stored) => {
        if (chrome.runtime.lastError || !alive()) {
          retire();
          return;
        }
        if (done) done(stored);
      });
    } catch (_error) {
      retire();
    }
  }

  function storageSet(area, value) {
    if (!alive()) {
      retire();
      return;
    }
    try {
      chrome.storage[area].set(value, () => {
        if (chrome.runtime.lastError) retire();
      });
    } catch (_error) {
      retire();
    }
  }

  function loadSettings(done) {
    storageGet("sync", ContentCoverFilter.DEFAULTS, (stored) => {
      settings = ContentCoverFilter.normalizeSettings(stored);
      if (done) done();
    });
  }

  function start() {
    if (!alive()) return;
    started = true;
    scan();
    watchSpaNavigation();
    scanTimer = window.setInterval(() => {
      if (started && alive()) scan();
      else if (!alive()) retire();
    }, 2000);
    if (slowFilterOn()) {
      pingModel();
      pingTimer = window.setInterval(pingModel, 2000);
    }
  }

  function slowFilterOn() {
    return ContentCoverFilter.needsEmbedding(settings);
  }

  function onIntersect(entries) {
    if (!started) return;
    for (const entry of entries) {
      if (entry.isIntersecting) releaseCard(entry.target);
    }
  }

  function scan() {
    if (!alive()) {
      retire();
      return;
    }
    const coverTargets = new Set(adapter.cards(document));

    for (const el of document.querySelectorAll(adapter.hideSelector)) {
      if (coverTargets.has(el)) continue;
      if (adapter.classifyHide && adapter.classifyHide(el) === "hold") continue;
      markReady(el);
    }

    for (const card of coverTargets) {
      if (adapter.classifyHide && adapter.classifyHide(card) === "hold") continue;
      if (!observed.has(card)) {
        observed.add(card);
        io.observe(card);
      }
      if (inLookahead(card)) releaseCard(card);
    }
  }

  function queueScan() {
    if (!started) return;
    if (scanQueued) return;
    scanQueued = true;
    window.setTimeout(() => {
      scanQueued = false;
      if (started) scan();
    }, 80);
  }

  function rescan() {
    for (const overlay of document.querySelectorAll(`.${OVERLAY_CLASS}`)) {
      const host = overlay.parentElement;
      overlay.remove();
      if (host) resetHost(host);
    }
    document.querySelectorAll(`[${READY_ATTR}]`).forEach((el) => el.removeAttribute(READY_ATTR));
    document.querySelectorAll(`.${PENDING_CLASS}`).forEach((el) => el.classList.remove(PENDING_CLASS));
    scan();
  }

  function releaseCard(card) {
    if (card.dataset.ccBusy === "1" || card.getAttribute(READY_ATTR) === "1") return;
    const id = adapter.id(card);
    if (revealed.has(id)) {
      uncover(card);
      markReady(card);
      return;
    }

    const meta = adapter.meta ? adapter.meta(card) : { title: "", subtitle: "", description: "", source: "" };
    const text =
      ContentCoverFilter.flattenMeta(meta) ||
      String(card.textContent || "").replace(/\s+/g, " ").trim().slice(0, 500);
    const hashPercent = hashId(id) % 100;
    const instant = ContentCoverFilter.decideFromScores({
      id,
      text,
      settings,
      hashPercent,
      scores: null,
      modelReady: false,
    });

    if (instant.cover) {
      cover(card, id, instant);
      markReady(card);
      return;
    }

    const focusKeep = settings.focusEnabled && ContentCoverFilter.lexicalFocusHit(text, settings.focusText);
    if (focusKeep && !(settings.dontShowEnabled && settings.dontShow.length)) {
      uncover(card);
      markReady(card);
      return;
    }

    if (!slowFilterOn()) {
      uncover(card);
      markReady(card);
      return;
    }

    // Focus hides unmatched cards until we know they are on-topic.
    // Lexical hits stay visible. Don’t-show never hides while scoring.
    const hideWhileScoring = settings.focusEnabled && Boolean(settings.focusText) && !focusKeep;
    if (hideWhileScoring) card.classList.add(PENDING_CLASS);
    card.dataset.ccBusy = "1";
    scoreText(text)
      .then((scores) => {
        if (!card.isConnected || revealed.has(id)) return;
        const decision = scores && scores.ready
          ? ContentCoverFilter.decideFromScores({
              id,
              text,
              settings,
              hashPercent,
              scores,
              modelReady: true,
            })
          : fallbackDecision(instant, text);
        if (decision.pending) {
          uncover(card);
          markReady(card);
          return;
        }
        if (decision.cover) cover(card, id, decision);
        else uncover(card);
        markReady(card);
      })
      .finally(() => {
        delete card.dataset.ccBusy;
      });
  }

  function fallbackDecision(instant, text) {
    if (instant && instant.cover) return instant;
    if (settings.focusEnabled && ContentCoverFilter.lexicalFocusHit(text, settings.focusText)) {
      return { cover: false, reason: "", pending: false, why: null };
    }
    const focusOn = settings.focusEnabled && Boolean(settings.focusText);
    if (focusOn) {
      return {
        cover: true,
        reason: "focus",
        pending: false,
        why: { chip: "focus", phrase: settings.focusText, match: "lexical" },
      };
    }
    return { cover: false, reason: "", pending: false, why: null };
  }

  function scoreText(text) {
    const key = text.slice(0, 500);
    if (scoreCache.has(key)) return Promise.resolve(scoreCache.get(key));
    if (pendingScores.has(key)) return pendingScores.get(key);

    const req = Promise.race([
      sendBackground({
        target: "background",
        type: "score",
        text: key,
        dontShow: settings.dontShow,
        focusText: settings.focusText,
      }),
      new Promise((resolve) => {
        window.setTimeout(() => resolve({ ok: false, timedOut: true }), 8000);
      }),
    ])
      .then((result) => {
        const scores = result && result.ok
          ? {
              ready: true,
              dontShowMax: result.dontShowMax || 0,
              dontShowPhrase: result.dontShowPhrase || "",
              focusScore: result.focusScore || 0,
            }
          : { ready: false, dontShowMax: 0, dontShowPhrase: "", focusScore: 0 };
        if (scores.ready) {
          modelReady = true;
          scoreCache.set(key, scores);
        }
        return scores;
      })
      .catch(() => ({ ready: false, dontShowMax: 0, dontShowPhrase: "", focusScore: 0 }))
      .finally(() => pendingScores.delete(key));

    pendingScores.set(key, req);
    return req;
  }

  function pingModel() {
    sendBackground({ target: "background", type: "modelStatus" }).then((result) => {
      if (!result) return;
      const ready = Boolean(result.ready);
      const becameReady = ready && !modelReady;
      modelReady = ready;
      if (becameReady && started) scan();
    });
  }

  function cover(card, id, decision) {
    if (card.querySelector(`:scope > .${OVERLAY_CLASS}`)) return;

    const style = getComputedStyle(card);
    if (style.position === "static") {
      card.style.position = "relative";
      card.dataset.ccPos = "1";
    }
    card.classList.add(HOST_CLASS, COVERED_CLASS);

    const overlay = document.createElement("div");
    overlay.className = OVERLAY_CLASS;
    overlay.dataset.ccId = id;
    overlay.setAttribute("aria-label", "Covered item. Click to reveal.");
    overlay.setAttribute("role", "button");

    overlay.addEventListener("click", (event) => onUncoverClick(event, card, id), true);
    overlay.addEventListener("auxclick", (event) => event.preventDefault(), true);
    card.appendChild(overlay);
    recordCovered(card, id, decision);
  }

  function recordCovered(card, id, decision) {
    const meta = adapter.meta ? adapter.meta(card) : {};
    const title = (meta.title || card.innerText || "").replace(/\s+/g, " ").trim().slice(0, 160);
    const url = adapter.link ? adapter.link(card) : "";
    if (!title && !url) return;
    coveredQueue.push({
      id,
      title: title || url || "Untitled",
      url,
      site: adapter.displayName,
      reason: (decision && decision.reason) || "",
      why: (decision && decision.why) || null,
      at: Date.now(),
    });
    if (coveredFlush) return;
    coveredFlush = window.setTimeout(flushCovered, 200);
  }

  function flushCovered() {
    coveredFlush = null;
    const batch = coveredQueue;
    coveredQueue = [];
    storageGet("local", { coveredItems: [] }, (stored) => {
      let list = stored.coveredItems || [];
      for (const entry of batch) list = ContentCoverFilter.mergeCovered(list, entry);
      storageSet("local", { coveredItems: list });
    });
  }

  function listenForHideThisKind() {
    document.addEventListener(
      "contextmenu",
      (event) => {
        const target = event.target;
        if (target && target.closest && target.closest(`.${OVERLAY_CLASS}`)) {
          lastContextCard = null;
          return;
        }
        lastContextCard = findCardFromNode(target);
      },
      true
    );

    try {
      chrome.runtime.onMessage.addListener((message) => {
        if (!alive()) {
          retire();
          return;
        }
        if (!message || message.type !== "hideThisKind") return;
        if (lastContextCard && lastContextCard.isConnected) addDontShow(lastContextCard);
      });
    } catch (_error) {
      retire();
    }
  }

  function findCardFromNode(node) {
    if (!node || !node.closest) return null;
    const cards = adapter.cards(document);
    for (const card of cards) {
      if (card === node || card.contains(node)) return card;
    }
    return null;
  }

  function addDontShow(card) {
    const meta = adapter.meta ? adapter.meta(card) : {};
    const title = (meta.title || card.innerText || "").replace(/\s+/g, " ").trim().slice(0, 80);
    if (!title) return;
    const next = ContentCoverFilter.normalizeSettings({
      ...settings,
      dontShowEnabled: true,
      dontShow: [...settings.dontShow, title],
    });
    storageSet("sync", {
      dontShowEnabled: true,
      dontShow: next.dontShow,
    });
  }

  function onUncoverClick(event, card, id) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    revealed.add(id);
    uncover(card);
  }

  function uncover(card) {
    const overlay = card.querySelector(`:scope > .${OVERLAY_CLASS}`);
    if (overlay) overlay.remove();
    resetHost(card);
  }

  function resetHost(card) {
    card.classList.remove(COVERED_CLASS);
    if (card.dataset.ccPos === "1" && !card.querySelector(`:scope > .${OVERLAY_CLASS}`)) {
      card.style.removeProperty("position");
      delete card.dataset.ccPos;
      card.classList.remove(HOST_CLASS);
    }
  }

  function markReady(el) {
    el.classList.remove(PENDING_CLASS);
    if (el.getAttribute(READY_ATTR) === "1") return;
    el.setAttribute(READY_ATTR, "1");
  }

  function inLookahead(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    return rect.top < window.innerHeight + LOOKAHEAD_PX && rect.bottom > -80;
  }

  function observeMutations() {
    mutationObserver = new MutationObserver((mutations) => {
      if (!alive()) {
        retire();
        return;
      }
      for (const mutation of mutations) {
        if (mutation.type === "characterData" || mutation.type === "attributes") {
          queueScan();
          return;
        }
        if (mutation.type !== "childList") continue;
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.classList && (node.classList.contains(OVERLAY_CLASS) || node.classList.contains(PENDING_CLASS) || node.id === TOAST_ID || node.id === SETUP_ID)) continue;
          queueScan();
          return;
        }
      }
    });
    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function watchSpaNavigation() {
    let last = location.href;
    const onNav = () => {
      if (location.href === last) return;
      last = location.href;
      lastFilterActive = null;
      maybeToast();
      queueScan();
    };
    window.addEventListener("yt-navigate-finish", onNav, true);
    window.addEventListener("popstate", onNav);
    navTimer = window.setInterval(onNav, 800);
  }

  function listenForSetupProgress() {
    const apply = (info) => showSetupProgress(info);
    storageGet("local", { modelProgress: null }, (stored) => {
      if (stored && stored.modelProgress) apply(stored.modelProgress);
    });
    onStorageChanged((changes, area) => {
      if ((area === "session" || area === "local") && changes.modelProgress) {
        apply(changes.modelProgress.newValue);
      }
    });
  }

  let setupShowTimer = null;
  let pendingSetup = null;

  function showSetupProgress(info) {
    const state = info && info.status;
    if (state === "ready" || state === "error" || !state) {
      window.clearTimeout(setupShowTimer);
      setupShowTimer = null;
      pendingSetup = null;
      removeSetupBanner();
      return;
    }
    pendingSetup = info;
    if (document.getElementById(SETUP_ID)) {
      renderSetupBanner(info);
      return;
    }
    if (setupShowTimer) return;
    setupShowTimer = window.setTimeout(() => {
      setupShowTimer = null;
      if (pendingSetup) renderSetupBanner(pendingSetup);
    }, 400);
  }

  function renderSetupBanner(info) {
    if (!info || info.status === "ready" || info.status === "error") {
      removeSetupBanner();
      return;
    }
    let banner = document.getElementById(SETUP_ID);
    if (!banner) {
      banner = document.createElement("div");
      banner.id = SETUP_ID;
      banner.className = "cc-setup";
      banner.innerHTML =
        '<div class="cc-setup-title">Setting up Content Cover</div>' +
        '<div class="cc-setup-track"><div class="cc-setup-fill"></div></div>' +
        '<div class="cc-setup-meta"></div>';
      (document.body || document.documentElement).appendChild(banner);
    }
    const percent = Math.max(0, Math.min(100, Number(info.percent) || 0));
    const fill = banner.querySelector(".cc-setup-fill");
    const meta = banner.querySelector(".cc-setup-meta");
    const hasBytes = Number(info.total) > 0;
    fill.classList.toggle("indeterminate", !hasBytes && percent < 2);
    fill.style.width = hasBytes || percent ? `${Math.max(percent, 6)}%` : "";
    const bits = ["Loading model"];
    if (hasBytes) bits.push(`${formatMb(info.loaded)} of ${formatMb(info.total)}`);
    else if (percent) bits.push(`${percent}%`);
    if (info.file) bits.push(info.file);
    meta.textContent = bits.join(" · ");
  }

  function removeSetupBanner() {
    const existing = document.getElementById(SETUP_ID);
    if (existing) existing.remove();
  }

  function formatMb(bytes) {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return "0 MB";
    if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  function maybeToast() {
    const active = ContentCoverFilter.filtersActive(settings);
    if (active) {
      lastFilterActive = true;
      removeToast();
      return;
    }
    if (lastFilterActive === false) return;
    lastFilterActive = false;
    showToast(`You are exposed to ${adapter.displayName}'s full reality!`);
  }

  function showToast(message) {
    removeToast();
    const toast = document.createElement("div");
    toast.id = TOAST_ID;
    toast.className = "cc-toast";
    toast.textContent = message;
    (document.body || document.documentElement).appendChild(toast);
    window.setTimeout(() => {
      toast.classList.add("cc-toast-out");
      window.setTimeout(removeToast, 400);
    }, 4200);
  }

  function removeToast() {
    const existing = document.getElementById(TOAST_ID);
    if (existing) existing.remove();
  }

  function hashId(id) {
    let hash = 2166136261;
    for (let i = 0; i < id.length; i += 1) {
      hash ^= id.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
})();
