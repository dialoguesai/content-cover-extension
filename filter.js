const ContentCoverFilter = (() => {
  const DEFAULTS = {
    randomEnabled: false,
    coveragePercent: 0,
    dontShowEnabled: false,
    dontShow: [],
    focusEnabled: false,
    focusText: "",
    dontShowThreshold: 0.45,
    focusThreshold: 0.42,
  };

  function normalizeSettings(raw) {
    const s = { ...DEFAULTS, ...(raw || {}) };
    s.randomEnabled = false;
    s.dontShowEnabled = Boolean(s.dontShowEnabled);
    s.focusEnabled = Boolean(s.focusEnabled);
    s.coveragePercent = 0;
    s.dontShow = Array.isArray(s.dontShow)
      ? s.dontShow.map((p) => String(p || "").trim()).filter(Boolean).slice(0, 40)
      : [];
    s.focusText = String(s.focusText || "").trim().slice(0, 400);
    s.dontShowThreshold = clamp(s.dontShowThreshold, 0.15, 0.85, DEFAULTS.dontShowThreshold);
    s.focusThreshold = clamp(s.focusThreshold, 0.28, 0.75, DEFAULTS.focusThreshold);
    return s;
  }

  function filtersActive(settings) {
    const s = normalizeSettings(settings);
    const dontShowOn = s.dontShowEnabled && s.dontShow.length > 0;
    const focusOn = s.focusEnabled && Boolean(s.focusText);
    return dontShowOn || focusOn;
  }

  function needsEmbedding(settings) {
    const s = normalizeSettings(settings);
    return (s.dontShowEnabled && s.dontShow.length > 0) || (s.focusEnabled && Boolean(s.focusText));
  }

  function flattenMeta(meta) {
    const parts = [meta && meta.title, meta && meta.subtitle, meta && meta.description, meta && meta.source];
    return parts
      .map((p) => String(p || "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(" \n ");
  }

  const FOCUS_STOP = new Set([
    "this", "that", "with", "from", "about", "your", "their", "have", "been",
    "were", "what", "when", "where", "will", "just", "more", "some", "than",
    "then", "them", "they", "into", "over", "after", "before", "video", "videos",
    "watch", "official", "news", "show", "shows", "thing", "things",
    "technology", "technologies", "tech",
  ]);

  const SHORT_FOCUS = new Set(["ai", "ml"]);

  const FOCUS_SYNONYMS = {
    ai: ["ai", "chatgpt", "openai", "llm", "chatbot", "machine learning", "generative"],
  };

  function normalizeFocusBlob(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/\ba\s*\.\s*i\.?\b/g, " ai ")
      .replace(/\bartificial\s+intelligence\b/g, " ai ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function focusTokens(focusText) {
    return normalizeFocusBlob(focusText)
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => {
        if (!token || FOCUS_STOP.has(token)) return false;
        if (SHORT_FOCUS.has(token)) return true;
        return token.length >= 4;
      });
  }

  function blobHas(hay, needle) {
    const n = String(needle || "").trim();
    if (!hay || !n) return false;
    if (n.length <= 2) return new RegExp(`(?:^| )${n}(?: |$)`).test(hay);
    return hay.includes(n);
  }

  function lexicalFocusHit(text, focusText) {
    const hay = normalizeFocusBlob(text);
    const focus = normalizeFocusBlob(focusText);
    if (!hay || !focus) return false;
    if (focus.length >= 3 && hay.includes(focus)) return true;
    const tokens = focusTokens(focusText);
    if (tokens.some((token) => blobHas(hay, token))) return true;
    if (tokens.includes("ai") || tokens.includes("artificial") || tokens.includes("intelligence")) {
      return FOCUS_SYNONYMS.ai.some((alias) => blobHas(hay, normalizeFocusBlob(alias)));
    }
    return false;
  }

  function matchingKeyword(text, phrases) {
    const hay = String(text || "").toLowerCase();
    if (!hay) return "";
    for (const phrase of phrases || []) {
      const raw = String(phrase || "").trim();
      const needle = raw.toLowerCase();
      if (needle.length >= 2 && hay.includes(needle)) return raw;
    }
    return "";
  }

  function keywordHit(text, phrases) {
    return Boolean(matchingKeyword(text, phrases));
  }

  function cosine(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let sum = 0;
    for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
    return sum;
  }

  function maxSimilarity(vector, others) {
    let best = 0;
    for (const other of others || []) {
      const score = cosine(vector, other);
      if (score > best) best = score;
    }
    return best;
  }

  const COVERED_LIMIT = 200;

  function mergeCovered(existing, entry) {
    const id = String((entry && entry.id) || "");
    const url = String((entry && entry.url) || "");
    const next = (Array.isArray(existing) ? existing : []).filter((item) => {
      if (id && item.id === id) return false;
      if (url && item.url === url) return false;
      return true;
    });
    next.unshift({
      id,
      title: String((entry && entry.title) || "Untitled").slice(0, 160),
      url,
      site: String((entry && entry.site) || ""),
      reason: String((entry && entry.reason) || ""),
      why: sanitizeWhy(entry && entry.why),
      at: Number(entry && entry.at) || Date.now(),
    });
    return next.slice(0, COVERED_LIMIT);
  }

  function decideFromScores({ id, text, settings, hashPercent, scores, modelReady }) {
    const s = normalizeSettings(settings);
    const result = { cover: false, reason: "", pending: false, why: null };

    if (s.randomEnabled && s.coveragePercent > 0 && hashPercent < s.coveragePercent) {
      return {
        cover: true,
        reason: "random",
        pending: false,
        why: { chip: "random", coveragePercent: s.coveragePercent },
      };
    }

    if (s.dontShowEnabled) {
      const hit = matchingKeyword(text, s.dontShow);
      if (hit) {
        return {
          cover: true,
          reason: "keyword",
          pending: false,
          why: { chip: "banned", phrase: hit, match: "keyword" },
        };
      }
    }

    const focusOn = s.focusEnabled && Boolean(s.focusText);
    const focusLexical = focusOn && lexicalFocusHit(text, s.focusText);
    if (focusLexical && !(s.dontShowEnabled && s.dontShow.length)) {
      return result;
    }
    if (focusOn && !focusLexical && !modelReady) {
      return {
        cover: true,
        reason: "focus",
        pending: false,
        why: { chip: "focus", phrase: s.focusText, match: "lexical" },
      };
    }

    const embedNeeded = needsEmbedding(s);
    if (!embedNeeded) return result;

    if (!modelReady) {
      if (focusOn) return result;
      return { cover: false, reason: "", pending: true, why: null };
    }

    const dontShowMax = scores && typeof scores.dontShowMax === "number" ? scores.dontShowMax : 0;
    const focusScore = scores && typeof scores.focusScore === "number" ? scores.focusScore : 0;
    const dontShowPhrase = scores && scores.dontShowPhrase ? String(scores.dontShowPhrase) : "";

    if (s.dontShowEnabled && s.dontShow.length && dontShowMax >= s.dontShowThreshold) {
      return {
        cover: true,
        reason: "dont-show",
        pending: false,
        why: {
          chip: "banned",
          phrase: dontShowPhrase,
          match: "similar",
          score: dontShowMax,
          threshold: s.dontShowThreshold,
        },
      };
    }

    if (focusOn && !focusLexical && focusScore < s.focusThreshold) {
      return {
        cover: true,
        reason: "focus",
        pending: false,
        why: {
          chip: "focus",
          phrase: s.focusText,
          score: focusScore,
          threshold: s.focusThreshold,
        },
      };
    }

    void id;
    return result;
  }

  function sanitizeWhy(raw) {
    if (!raw || typeof raw !== "object") return null;
    const chip = raw.chip === "random" || raw.chip === "banned" || raw.chip === "focus" ? raw.chip : "";
    if (!chip) return null;
    const why = { chip };
    if (raw.phrase) why.phrase = String(raw.phrase).slice(0, 160);
    if (raw.match === "keyword" || raw.match === "similar" || raw.match === "lexical") why.match = raw.match;
    if (Number.isFinite(Number(raw.coveragePercent))) why.coveragePercent = Number(raw.coveragePercent);
    if (Number.isFinite(Number(raw.score))) why.score = Number(raw.score);
    if (Number.isFinite(Number(raw.threshold))) why.threshold = Number(raw.threshold);
    return why;
  }

  function whyFromReason(reason) {
    if (reason === "random") return { chip: "random" };
    if (reason === "focus") return { chip: "focus" };
    if (reason === "keyword" || reason === "dont-show") return { chip: "banned" };
    return null;
  }

  function explainCover(why) {
    const detail = sanitizeWhy(why);
    if (!detail) return "";
    if (detail.chip === "random") {
      return Number.isFinite(detail.coveragePercent)
        ? `Random cover · ${Math.round(detail.coveragePercent)}% of items`
        : "Random cover";
    }
    if (detail.chip === "banned") {
      const phrase = detail.phrase ? `“${detail.phrase}”` : "a banned phrase";
      if (detail.match === "keyword") return `Banned phrase ${phrase} · exact text match`;
      const bits = [`Banned phrase ${phrase}`];
      const score = formatPct(detail.score);
      const sensitivity = formatPct(detail.threshold);
      if (score) bits.push(`similarity ${score}`);
      if (sensitivity) bits.push(`sensitivity ${sensitivity}`);
      return bits.join(" · ");
    }
    const phrase = detail.phrase ? `“${detail.phrase}”` : "your focus";
    if (detail.match === "lexical") return `Not close to focus ${phrase} · no matching words`;
    const bits = [`Not close to focus ${phrase}`];
    const score = formatPct(detail.score);
    const needed = formatPct(detail.threshold);
    if (score) bits.push(`similarity ${score}`);
    if (needed) bits.push(`needed ${needed}`);
    return bits.join(" · ");
  }

  function formatPct(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "";
    return `${Math.round(n * 100)}%`;
  }

  function clamp(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  return {
    DEFAULTS,
    normalizeSettings,
    filtersActive,
    needsEmbedding,
    flattenMeta,
    matchingKeyword,
    lexicalFocusHit,
    keywordHit,
    cosine,
    maxSimilarity,
    mergeCovered,
    decideFromScores,
    whyFromReason,
    explainCover,
  };
})();
