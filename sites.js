const ContentCoverSites = (() => {
  const YT_CARD =
    "ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-playlist-video-renderer, yt-lockup-view-model, ytd-shorts-lockup-view-model, ytd-shorts-lockup-view-model-v2, ytm-shorts-lockup-view-model";

  const NYT_HIDE =
    'section.story-wrapper, div.story-wrapper, a[href*="cooking.nytimes.com/recipes"], a[href*="/athletic/"], [data-testid="carouselOuterClass"] a[href], aside a[href*="/20"], [data-testid*="recirc" i] a[href], [data-testid*="more-in" i] a[href]';

  function youtubeCards(root) {
    const found = [];
    for (const el of root.querySelectorAll(YT_CARD)) {
      if (el.closest("ytd-ad-slot-renderer, ytd-display-ad-renderer, ytd-player, #player, ytd-comments")) {
        continue;
      }
      if (
        el.matches("yt-lockup-view-model, ytd-shorts-lockup-view-model, ytd-shorts-lockup-view-model-v2, ytm-shorts-lockup-view-model") &&
        el.closest("ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer")
      ) {
        continue;
      }
      if (isTiny(el)) continue;
      found.push(el);
    }
    return found;
  }

  function youtubeId(el) {
    const link = el.querySelector('a[href*="/watch"], a[href*="/shorts/"], a[href*="/playlist"], a[href*="/@"]');
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) return `yt:${href}`;
    return fallbackId(el, "yt");
  }

  function youtubeLink(el) {
    const link = el.querySelector('a[href*="/watch"], a[href*="/shorts/"], a[href*="/playlist"]');
    return absoluteHref(link && link.getAttribute("href"));
  }

  function youtubeMeta(el) {
    const title =
      textOf(
        el.querySelector(
          "#video-title, #video-title-link, a#video-title, .yt-lockup-metadata-view-model__title, .shortsLockupViewModelHostMetadataTitle, h3"
        )
      ) ||
      textOf(el.querySelector("a[href*='/watch'][title], a[href*='/shorts/'][title]")) ||
      textOf(el.querySelector("a[href*='/watch'], a[href*='/shorts/']"));
    const source = textOf(
      el.querySelector("#channel-name, ytd-channel-name, .yt-lockup-metadata-view-model__title + *, .ytd-channel-name")
    );
    const description = textOf(
      el.querySelector("#metadata-line, .yt-content-metadata-view-model, #description-text, .metadata-snippet-text")
    );
    return { title, subtitle: "", description, source };
  }

  function nytCards(root) {
    const found = [];
    const seen = new Set();

    const wrappers = root.querySelectorAll("section.story-wrapper, div.story-wrapper");
    for (const el of wrappers) {
      if (seen.has(el)) continue;
      if (nytSkipChrome(el)) continue;
      if (el.querySelector("section.story-wrapper, div.story-wrapper")) continue;
      if (!nytLooksLikeTeaser(el)) continue;
      if (nytArticlePaths(el).every((path) => nytIsCurrentArticle(path))) continue;
      if (isTiny(el, 80, 40)) continue;
      seen.add(el);
      found.push(el);
    }

    const extraLinks = root.querySelectorAll(
      'a[href*="cooking.nytimes.com/recipes"], a[href*="/athletic/"], a[href*="/video/"], a[href*="/20"], a[href*="/live/"], a[href*="/interactive/"], a[href*="/paidpost/"]'
    );
    for (const link of extraLinks) {
      if (link.closest("section.story-wrapper, div.story-wrapper")) continue;
      if (nytSkipChrome(link)) continue;
      if (!nytStoryishHref(link.getAttribute("href") || "")) continue;
      if (nytIsCurrentArticle(link.getAttribute("href") || "")) continue;
      const card = nytLinkCard(link);
      if (!card || seen.has(card)) continue;
      const minH = nytInRecirc(link) ? 22 : 48;
      if (isTiny(card, nytInRecirc(link) ? 80 : 140, minH)) continue;
      if (nytOversized(card)) continue;
      const title = rawText(card);
      if (title.length < 8) continue;
      seen.add(card);
      found.push(card);
    }

    return found;
  }

  function nytSkipChrome(el) {
    if (el.closest("nav, [role='navigation']")) return true;
    if (el.closest("[data-testid='article-body'], section[name='articleBody']")) return true;
    if (nytInRecirc(el)) return false;
    return Boolean(el.closest("header, footer"));
  }

  function nytInRecirc(el) {
    if (
      el.closest(
        '[data-testid*="recirc" i], [data-testid*="more-in" i], [data-testid*="trending" i], [data-testid*="editors" i], [class*="recirc" i]'
      )
    ) {
      return true;
    }
    let node = el;
    for (let i = 0; i < 14 && node && node !== document.body; i += 1) {
      if (node.matches && node.matches("aside, section, [role='complementary']")) {
        const heading = node.querySelector("h2, h3");
        const text = `${(heading && heading.textContent) || ""} ${node.getAttribute("aria-label") || ""}`;
        if (/\b(more in|trending|editors['’]? picks)\b/i.test(text)) return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function nytIsCurrentArticle(href) {
    try {
      const path = new URL(href, location.origin).pathname.replace(/\/$/, "");
      return path && path === location.pathname.replace(/\/$/, "");
    } catch {
      return false;
    }
  }

  function nytStoryishHref(href) {
    return (
      /\/20\d\d\//.test(href) ||
      /\/live\//.test(href) ||
      /\/interactive\//.test(href) ||
      /\/video\/\d{4}\//.test(href) ||
      /cooking\.nytimes\.com\/recipes\//.test(href) ||
      /\/athletic\//.test(href) ||
      /wirecutter\.nytimes\.com\//.test(href) ||
      /\/paidpost\//.test(href)
    );
  }

  function nytArticlePaths(el) {
    const paths = [];
    for (const link of el.querySelectorAll("a[href]")) {
      const href = normalizeHref(link.getAttribute("href"));
      if (!href) continue;
      if (/\/(privacy|cookie|subscription|account|login|tips)\b/i.test(href)) continue;
      if (nytStoryishHref(href)) paths.push(href.split("?")[0]);
    }
    if (el.matches("a[href]") && nytStoryishHref(el.getAttribute("href") || "")) {
      paths.push(normalizeHref(el.getAttribute("href")).split("?")[0]);
    }
    return [...new Set(paths)];
  }

  function nytLooksLikeTeaser(el) {
    const paths = nytArticlePaths(el);
    if (paths.length !== 1) return false;
    const text = rawText(el);
    return Boolean(el.querySelector("img, picture") || text.length > 20);
  }

  function nytLinkCard(link) {
    const recirc = nytInRecirc(link);
    const item = link.closest("li, article, figure");
    if (item && !nytOversized(item) && (recirc || !isTiny(item, 80, 24))) return item;
    const rect = link.getBoundingClientRect();
    const minH = recirc ? 22 : 48;
    if (rect.width >= 80 && rect.height >= minH && rect.height < window.innerHeight * 1.1) return link;
    const parent = link.parentElement;
    if (!parent || parent === document.body) return recirc ? link : null;
    if (nytOversized(parent)) return link;
    return parent;
  }

  function nytOversized(el) {
    const rect = el.getBoundingClientRect();
    return rect.height > window.innerHeight * 1.15;
  }

  function nytId(el) {
    const paths = nytArticlePaths(el);
    if (paths[0]) return `nyt:${paths[0]}`;
    return fallbackId(el, "nyt");
  }

  function nytLink(el) {
    const paths = nytArticlePaths(el);
    if (paths[0]) return absoluteHref(paths[0]);
    const link = el.matches("a[href]") ? el : el.querySelector("a[href]");
    return absoluteHref(link && link.getAttribute("href"));
  }

  function nytMeta(el) {
    const title =
      textOf(el.querySelector("p.indicate-hover, h2, h3, h4")) ||
      textOf(el.matches("a") ? el : el.querySelector("a"));
    const subtitle = textOf(el.querySelector("p.summary-class, [class*='summary'], p[class*='dek']"));
    const source = textOf(el.querySelector("[class*='kicker'], [data-testid='kicker'], .kicker"));
    const description = textOf(el.querySelector("[class*='byline'], time, [class*='dateline']"));
    return { title, subtitle, description, source };
  }

  function nytClassifyHide(el) {
    if (nytSkipChrome(el)) return "ready";
    if (el.querySelector && el.querySelector("section.story-wrapper, div.story-wrapper")) return "ready";
    if (nytIsIncomplete(el)) return "hold";
    return "ready";
  }

  function nytIsIncomplete(el) {
    const text = rawText(el);
    const paths = nytArticlePaths(el);
    if (el.querySelector("img, picture") && paths.length) return false;
    if (paths.length && text.length >= 8) return false;
    if (!paths.length && text.length < 12) return true;
    if (paths.length && text.length < 8) return true;
    return false;
  }

  function instagramCards(root) {
    const found = [];
    const seen = new Set();
    const path = location.pathname;
    if (/^\/(direct|stories)\b/.test(path)) return found;

    for (const article of root.querySelectorAll("article")) {
      if (article.closest("nav, [role='navigation']")) continue;
      if (isTiny(article, 200, 200)) continue;
      if (seen.has(article)) continue;
      seen.add(article);
      found.push(article);
    }

    const tileLinks = root.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');
    for (const link of tileLinks) {
      if (link.closest("article, nav, header, [role='navigation']")) continue;
      const tile = igTileRoot(link);
      if (!tile || seen.has(tile)) continue;
      if (isTiny(tile, 80, 80)) continue;
      if (tile.querySelector("article")) continue;
      seen.add(tile);
      found.push(tile);
    }

    return found;
  }

  function igTileRoot(link) {
    const rect = link.getBoundingClientRect();
    if (rect.width >= 80 && rect.height >= 80) return link;
    const parent = link.parentElement;
    if (parent && parent !== document.body) return parent;
    return link;
  }

  function instagramId(el) {
    const link = el.querySelector('a[href*="/p/"], a[href*="/reel/"]') || (el.matches("a") ? el : null);
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) {
      const match = href.match(/\/(p|reel)\/([^/?#]+)/);
      if (match) return `ig:${match[1]}/${match[2]}`;
      return `ig:${href}`;
    }
    return fallbackId(el, "ig");
  }

  function instagramLink(el) {
    const link = el.querySelector('a[href*="/p/"], a[href*="/reel/"]') || (el.matches("a") ? el : null);
    return absoluteHref(link && link.getAttribute("href"));
  }

  function instagramMeta(el) {
    const source = textOf(el.querySelector("header a, a[href^='/']"));
    const caption = textOf(el.querySelector("h1, [class*='Caption'], ul li span"));
    const title = caption || textOf(el);
    return { title, subtitle: "", description: caption, source };
  }

  function instagramClassifyHide(el) {
    const text = rawText(el);
    const href = el.getAttribute && el.getAttribute("href");
    if (el.matches("a") && href && /\/(p|reel)\//.test(href)) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 80) return "ready";
      if (rect.width === 0 && rect.height === 0) return "hold";
    }
    if (el.matches("article") && text.length < 8) return "hold";
    return "ready";
  }

  function youtubeClassifyHide(el) {
    if (el.closest("ytd-ad-slot-renderer, ytd-display-ad-renderer, ytd-player, #player, ytd-comments, nav, ytd-masthead")) {
      return "ready";
    }
    if (
      el.matches("yt-lockup-view-model, ytd-shorts-lockup-view-model, ytd-shorts-lockup-view-model-v2, ytm-shorts-lockup-view-model") &&
      el.closest("ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer")
    ) {
      return "ready";
    }
    const text = rawText(el);
    if (text.length < 8 && !el.querySelector("a[href*='/watch'], a[href*='/shorts/']")) return "hold";
    return "ready";
  }

  const X_CARD = 'article[data-testid="tweet"]';

  function xCards(root) {
    const found = [];
    for (const el of root.querySelectorAll(X_CARD)) {
      if (el.closest('[data-testid="sidebarColumn"], nav, [role="navigation"], [aria-label*="Trending"]')) continue;
      if (isTiny(el, 160, 48)) continue;
      found.push(el);
    }
    return found;
  }

  function xId(el) {
    const link = el.querySelector('a[href*="/status/"]');
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) return `x:${href}`;
    return fallbackId(el, "x");
  }

  function xLink(el) {
    const link = el.querySelector('a[href*="/status/"]');
    return absoluteHref(link && link.getAttribute("href"));
  }

  function xMeta(el) {
    const title = textOf(el.querySelector('[data-testid="tweetText"]')) || textOf(el);
    const source = textOf(el.querySelector('[data-testid="User-Name"]'));
    return { title, subtitle: "", description: title, source };
  }

  function xClassifyHide(el) {
    if (el.closest('[data-testid="sidebarColumn"], nav, [role="navigation"]')) return "ready";
    if (rawText(el).length < 4 && !el.querySelector('a[href*="/status/"]')) return "hold";
    return "ready";
  }

  const FACEBOOK_CARD = 'div[role="article"]';

  function facebookCards(root) {
    const found = [];
    for (const el of root.querySelectorAll(FACEBOOK_CARD)) {
      if (el.closest("nav, [role='navigation'], [role='banner'], [role='contentinfo']")) continue;
      if (el.querySelector('[role="article"]')) continue;
      if (isTiny(el, 180, 80)) continue;
      if (oversized(el)) continue;
      found.push(el);
    }
    return found;
  }

  function facebookId(el) {
    const link = el.querySelector('a[href*="/posts/"], a[href*="/permalink"], a[href*="/videos/"], a[href*="/reel/"]');
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) return `fb:${href}`;
    return fallbackId(el, "fb");
  }

  function facebookLink(el) {
    const link = el.querySelector('a[href*="/posts/"], a[href*="/permalink"], a[href*="/videos/"], a[href*="/reel/"]') || el.querySelector("a[href]");
    return absoluteHref(link && link.getAttribute("href"));
  }

  function facebookMeta(el) {
    const source = textOf(el.querySelector("h2, h3, strong, a[role='link']"));
    const title = textOf(el.querySelector('[data-ad-preview="message"], [dir="auto"]')) || textOf(el);
    return { title, subtitle: "", description: title, source };
  }

  function facebookClassifyHide(el) {
    if (el.querySelector('[role="article"]')) return "ready";
    if (rawText(el).length < 8) return "hold";
    return "ready";
  }

  const REDDIT_CARD = "shreddit-post, [data-testid='post-container'], .thing.link";

  function redditCards(root) {
    const found = [];
    const seen = new Set();
    for (const el of root.querySelectorAll(REDDIT_CARD)) {
      if (el.closest("nav, shreddit-comment, [slot='comment']")) continue;
      if (el.matches(".thing.link") && el.classList.contains("comment")) continue;
      if (seen.has(el) || isTiny(el, 120, 40)) continue;
      seen.add(el);
      found.push(el);
    }
    return found;
  }

  function redditId(el) {
    const permalink = el.getAttribute && (el.getAttribute("permalink") || el.getAttribute("content-href"));
    if (permalink) return `reddit:${normalizeHref(permalink)}`;
    const link = el.querySelector('a[data-click-id="body"], a[href*="/comments/"], a.title');
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) return `reddit:${href}`;
    return fallbackId(el, "reddit");
  }

  function redditLink(el) {
    const permalink = el.getAttribute && (el.getAttribute("permalink") || el.getAttribute("content-href"));
    if (permalink) return absoluteHref(permalink);
    const link = el.querySelector('a[data-click-id="body"], a[href*="/comments/"], a.title');
    return absoluteHref(link && link.getAttribute("href"));
  }

  function redditMeta(el) {
    const title =
      textOf(el.querySelector('[slot="title"], a[data-click-id="body"], a.title, h1, h3')) ||
      (el.getAttribute && el.getAttribute("post-title")) ||
      textOf(el);
    const source = textOf(el.querySelector('[slot="credit-bar"], .subreddit, a[data-click-id="subreddit"]'));
    return { title, subtitle: "", description: title, source };
  }

  function redditClassifyHide(el) {
    if (el.closest("shreddit-comment")) return "ready";
    if (rawText(el).length < 6 && !(el.getAttribute && el.getAttribute("post-title"))) return "hold";
    return "ready";
  }

  // 2026 feed wrappers use data-id (not data-urn) and have dropped
  // feed-shared-update-v2 on many homepage renders. Prefer the outermost
  // post shell so nested comment/share URNs do not steal the card.
  const LINKEDIN_CARD = [
    "div.feed-shared-update-v2",
    "article.feed-shared-update-v2",
    "div.update-components-update",
    "article.update-components-update",
    "div.update-v2",
    "[data-view-name='feed-full-update']",
    "[data-view-name='feed-discovery-update']",
    "div.occludable-update",
    "div.fie-impression-container",
    "div[data-id^='urn:li:activity']",
    "article[data-id^='urn:li:activity']",
    "div[data-id^='urn:li:ugcPost']",
    "div[data-id^='urn:li:share']",
    "div[data-id^='urn:li:aggregated']",
    "div[data-urn^='urn:li:activity']",
    "div[data-urn^='urn:li:ugcPost']",
    "div[data-urn^='urn:li:share']",
    "div[data-urn^='urn:li:aggregatedShare']",
  ].join(", ");

  const LINKEDIN_CHROME =
    "nav, header, footer, [role='banner'], [role='navigation'], .global-nav, " +
    ".scaffold-layout__sidebar, aside.scaffold-layout__aside, .scaffold-layout__aside, " +
    ".msg-overlay-list-bubble, .msg-overlay-conversation-bubble, #msg-overlay, .msg-overlay-container, " +
    ".comments-comments-list, .comments-comment-item, .comments-comment-entity, .comments-comment-box, " +
    ".share-box-feed-entry, [data-view-name='share-box'], .feed-identity-module, [data-view-name='feed-identity-module']";

  function linkedinCards(root) {
    const found = [];
    const seen = new Set();
    const add = (el) => {
      if (!el || seen.has(el) || found.includes(el)) return;
      if (linkedinSkipChrome(el)) return;
      if (linkedinNestedInCard(el)) return;
      if (isTiny(el, 180, 60)) return;
      if (oversized(el)) return;
      seen.add(el);
      found.push(el);
    };

    for (const el of queryLightOrShadow(root, LINKEDIN_CARD)) add(el);

    if (!found.length) {
      for (const link of root.querySelectorAll('a[href*="/feed/update/"], a[href*="/posts/"]')) {
        if (linkedinSkipChrome(link)) continue;
        add(linkedinWalkUp(link));
      }
    }

    if (!found.length) {
      for (const el of linkedinFeedFallbacks(root)) add(el);
    }

    return found.filter((el) => !found.some((other) => other !== el && other.contains(el)));
  }

  function linkedinSkipChrome(el) {
    return Boolean(el.closest(LINKEDIN_CHROME));
  }

  function linkedinNestedInCard(el) {
    const parent = el.parentElement;
    if (!parent || !parent.closest) return false;
    const outer = parent.closest(LINKEDIN_CARD);
    if (!outer || outer === el) return false;
    if (oversized(outer)) return false;
    return true;
  }

  function linkedinWalkUp(link) {
    let node = link;
    for (let i = 0; i < 14 && node && node !== document.body; i += 1) {
      if (linkedinSkipChrome(node)) break;
      const rect = node.getBoundingClientRect();
      if (rect.width >= 240 && rect.height >= 80 && rect.height < window.innerHeight * 0.95) {
        if (node.querySelector(".update-components-text, .update-components-actor, .feed-shared-update-v2__description, img")) {
          return node;
        }
      }
      node = node.parentElement;
    }
    return link.closest("article, div") || link;
  }

  function linkedinFeedFallbacks(root) {
    const found = [];
    const scroller = root.querySelector(".scaffold-finite-scroll__content");
    if (!scroller) return found;
    for (const child of scroller.children) {
      let card = child;
      if (child.children.length === 1 && child.children[0].matches("div, article")) card = child.children[0];
      if (rawText(card).length < 24) continue;
      if (!card.querySelector("a[href], img, .update-components-actor")) continue;
      found.push(card);
    }
    return found;
  }

  function linkedinUrn(el) {
    const direct = (el.getAttribute && (el.getAttribute("data-id") || el.getAttribute("data-urn"))) || "";
    if (/urn:li:(activity|ugcPost|share|aggregated)/i.test(direct)) return direct;
    const nested =
      el.querySelector &&
      el.querySelector(
        "[data-id^='urn:li:activity'], [data-id^='urn:li:ugcPost'], [data-urn^='urn:li:activity'], [data-urn^='urn:li:ugcPost']"
      );
    return (nested && (nested.getAttribute("data-id") || nested.getAttribute("data-urn"))) || "";
  }

  function linkedinId(el) {
    const urn = linkedinUrn(el);
    if (urn) return `linkedin:${urn}`;
    const link = el.querySelector('a[href*="/feed/update/"], a[href*="/posts/"]');
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) return `linkedin:${href}`;
    return fallbackId(el, "linkedin");
  }

  function linkedinLink(el) {
    const urn = linkedinUrn(el);
    const activity = urn && urn.match(/urn:li:activity:(\d+)/);
    if (activity) return `https://www.linkedin.com/feed/update/urn:li:activity:${activity[1]}/`;
    const link = el.querySelector('a[href*="/feed/update/"], a[href*="/posts/"]') || el.querySelector("a[href]");
    return absoluteHref(link && link.getAttribute("href"));
  }

  function linkedinMeta(el) {
    const title =
      textOf(
        el.querySelector(
          ".update-components-text, .feed-shared-update-v2__description, .feed-shared-update-v2__commentary, .feed-shared-text, [data-test-id='main-feed-activity-card'] .break-words, span[dir='ltr']"
        )
      ) || textOf(el);
    const source = textOf(
      el.querySelector(".update-components-actor__title, .update-components-actor__name, .feed-shared-actor__name, .hoverable-link-text")
    );
    return { title, subtitle: "", description: title, source };
  }

  function linkedinClassifyHide(el) {
    if (linkedinSkipChrome(el) || linkedinNestedInCard(el)) return "ready";
    if (isTiny(el, 180, 60)) return "hold";
    if (rawText(el).length < 8) return "hold";
    return "ready";
  }

  function queryLightOrShadow(root, selector) {
    const found = [];
    try {
      found.push(...root.querySelectorAll(selector));
    } catch (_err) {}
    if (found.length) return found;
    const all = root.querySelectorAll ? root.querySelectorAll("*") : [];
    for (const el of all) {
      if (!el.shadowRoot) continue;
      try {
        found.push(...el.shadowRoot.querySelectorAll(selector));
      } catch (_err) {}
    }
    return found;
  }

  const TIKTOK_CARD =
    '[data-e2e="recommend-list-item-container"], [data-e2e="user-post-item"], [data-e2e="search-card-container"], [class*="DivItemContainer"]';

  function tiktokCards(root) {
    const found = [];
    const seen = new Set();
    for (const el of root.querySelectorAll(TIKTOK_CARD)) {
      if (el.closest("nav, [data-e2e='nav'], header")) continue;
      if (seen.has(el) || isTiny(el, 80, 80)) continue;
      seen.add(el);
      found.push(el);
    }
    return found;
  }

  function tiktokId(el) {
    const link = el.querySelector('a[href*="/video/"]') || (el.matches("a") ? el : null);
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) return `tiktok:${href}`;
    return fallbackId(el, "tiktok");
  }

  function tiktokLink(el) {
    const link = el.querySelector('a[href*="/video/"]') || (el.matches("a") ? el : null);
    return absoluteHref(link && link.getAttribute("href"));
  }

  function tiktokMeta(el) {
    const title = textOf(el.querySelector('[data-e2e="video-desc"], [data-e2e="search-card-desc"], [data-e2e="browse-video-desc"]')) || textOf(el);
    const source = textOf(el.querySelector('[data-e2e="video-author-uniqueid"], [data-e2e="search-card-user-unique-id"]'));
    return { title, subtitle: "", description: title, source };
  }

  function tiktokClassifyHide(el) {
    if (rawText(el).length < 4 && !el.querySelector('a[href*="/video/"]')) return "hold";
    return "ready";
  }

  const THREADS_CARD = 'article, div[data-pressable-container]';

  function threadsCards(root) {
    const found = [];
    const seen = new Set();
    const path = location.pathname;
    if (/^\/(login|intent)\b/.test(path)) return found;

    for (const article of root.querySelectorAll("article")) {
      if (article.closest("nav, [role='navigation']")) continue;
      if (isTiny(article, 160, 80)) continue;
      seen.add(article);
      found.push(article);
    }

    for (const link of root.querySelectorAll('a[href*="/post/"]')) {
      if (link.closest("article, nav, header")) continue;
      const tile = link.closest("div") || link;
      if (seen.has(tile) || isTiny(tile, 80, 80)) continue;
      if (tile.querySelector("article")) continue;
      seen.add(tile);
      found.push(tile);
    }
    return found;
  }

  function threadsId(el) {
    const link = el.querySelector('a[href*="/post/"]') || (el.matches("a") ? el : null);
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) return `threads:${href}`;
    return fallbackId(el, "threads");
  }

  function threadsLink(el) {
    const link = el.querySelector('a[href*="/post/"]') || (el.matches("a") ? el : null);
    return absoluteHref(link && link.getAttribute("href"));
  }

  function threadsMeta(el) {
    const source = textOf(el.querySelector("header a, a[href^='/@']"));
    const title = textOf(el.querySelector("[dir='auto']")) || textOf(el);
    return { title, subtitle: "", description: title, source };
  }

  function threadsClassifyHide(el) {
    if (el.matches("article") && rawText(el).length < 8) return "hold";
    return "ready";
  }

  const BLUESKY_CARD = '[data-testid="feedItem"], [data-testid^="feedItem-"]';

  function blueskyCards(root) {
    const found = [];
    for (const el of root.querySelectorAll(`${BLUESKY_CARD}, a[href*="/post/"]`)) {
      if (el.closest("nav, [role='navigation'], aside")) continue;
      const card = el.matches("a") ? el.closest("[data-testid]") || el.parentElement || el : el;
      if (isTiny(card, 140, 48)) continue;
      if (found.includes(card)) continue;
      found.push(card);
    }
    return found;
  }

  function blueskyId(el) {
    const link = el.querySelector('a[href*="/post/"]') || (el.matches("a") ? el : null);
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) return `bsky:${href}`;
    return fallbackId(el, "bsky");
  }

  function blueskyLink(el) {
    const link = el.querySelector('a[href*="/post/"]') || (el.matches("a") ? el : null);
    return absoluteHref(link && link.getAttribute("href"));
  }

  function blueskyMeta(el) {
    const title = textOf(el.querySelector("[data-testid='postText'], [data-word-wrap='1']")) || textOf(el);
    const source = textOf(el.querySelector("a[href^='/profile/']"));
    return { title, subtitle: "", description: title, source };
  }

  function blueskyClassifyHide(el) {
    if (rawText(el).length < 4 && !el.querySelector('a[href*="/post/"]')) return "hold";
    return "ready";
  }

  const PINTEREST_CARD = '[data-test-id="pin"], [data-test-id="pinWrapper"], [data-grid-item="true"]';

  function pinterestCards(root) {
    const found = [];
    for (const el of root.querySelectorAll(PINTEREST_CARD)) {
      if (el.closest("nav, header, [data-test-id='header']")) continue;
      if (isTiny(el, 80, 80)) continue;
      found.push(el);
    }
    return found;
  }

  function pinterestId(el) {
    const link = el.querySelector('a[href*="/pin/"]') || (el.matches("a") ? el : null);
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) return `pin:${href}`;
    return fallbackId(el, "pin");
  }

  function pinterestLink(el) {
    const link = el.querySelector('a[href*="/pin/"]') || (el.matches("a") ? el : null);
    return absoluteHref(link && link.getAttribute("href"));
  }

  function pinterestMeta(el) {
    const img = el.querySelector("img");
    const title =
      textOf(el.querySelector("[data-test-id='pinrep-title'], h1, h2")) ||
      (img && img.getAttribute("alt")) ||
      textOf(el);
    return { title, subtitle: "", description: title, source: "Pinterest" };
  }

  function pinterestClassifyHide(el) {
    if (!el.querySelector("img, a[href*='/pin/']") && rawText(el).length < 4) return "hold";
    return "ready";
  }

  const TUMBLR_CARD = "article, .post, [data-id]";

  function tumblrCards(root) {
    const found = [];
    for (const el of root.querySelectorAll("article, .post")) {
      if (el.closest("nav, header, footer, .ui_search")) continue;
      if (el.querySelector("article, .post")) continue;
      if (isTiny(el, 140, 60)) continue;
      found.push(el);
    }
    return found;
  }

  function tumblrId(el) {
    const id = el.getAttribute && (el.getAttribute("data-id") || el.getAttribute("data-post-id"));
    if (id) return `tumblr:${id}`;
    const link = el.querySelector('a[href*="/post/"], a[rel="bookmark"]');
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) return `tumblr:${href}`;
    return fallbackId(el, "tumblr");
  }

  function tumblrLink(el) {
    const link = el.querySelector('a[href*="/post/"], a[rel="bookmark"]') || el.querySelector("a[href]");
    return absoluteHref(link && link.getAttribute("href"));
  }

  function tumblrMeta(el) {
    const title = textOf(el.querySelector("h1, h2, .post-title, figcaption, p")) || textOf(el);
    const source = textOf(el.querySelector(".username, a.blog-name"));
    return { title, subtitle: "", description: title, source };
  }

  function tumblrClassifyHide(el) {
    if (rawText(el).length < 4 && !el.querySelector("img")) return "hold";
    return "ready";
  }

  const TWITCH_CARD = '[data-a-target="preview-card"], .preview-card, article, a[data-a-target="preview-card-image-link"]';

  function twitchCards(root) {
    const found = [];
    const seen = new Set();
    for (const el of root.querySelectorAll('[data-a-target="preview-card"], .preview-card, article')) {
      if (el.closest("nav, [data-a-target='top-nav']")) continue;
      if (seen.has(el) || isTiny(el, 120, 60)) continue;
      seen.add(el);
      found.push(el);
    }
    return found;
  }

  function twitchId(el) {
    const link = el.querySelector('a[href*="/videos/"], a[href*="/clip/"], a[data-a-target="preview-card-image-link"]') || (el.matches("a") ? el : null);
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) return `twitch:${href}`;
    return fallbackId(el, "twitch");
  }

  function twitchLink(el) {
    const link = el.querySelector("a[href]") || (el.matches("a") ? el : null);
    return absoluteHref(link && link.getAttribute("href"));
  }

  function twitchMeta(el) {
    const title = textOf(el.querySelector("h2, h3, [data-a-target='preview-card-title']")) || textOf(el);
    const source = textOf(el.querySelector("[data-a-target='preview-card-channel-link']"));
    return { title, subtitle: "", description: title, source };
  }

  function twitchClassifyHide(el) {
    if (rawText(el).length < 4) return "hold";
    return "ready";
  }

  const TRUTH_CARD = "article.status, .status, [data-id].status, article";

  function truthsocialCards(root) {
    const found = [];
    for (const el of root.querySelectorAll("article, .status")) {
      if (el.closest("nav, .drawer, .tabs-bar, .column-header")) continue;
      if (el.querySelector("article, .status") && !el.matches(".status")) continue;
      if (isTiny(el, 140, 48)) continue;
      found.push(el);
    }
    return found;
  }

  function truthsocialId(el) {
    const id = el.getAttribute && (el.getAttribute("data-id") || el.getAttribute("data-status-id"));
    if (id) return `truth:${id}`;
    const link = el.querySelector('a[href*="/posts/"], a[href*="/statuses/"], time a, a[class*="status"]');
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) return `truth:${href}`;
    return fallbackId(el, "truth");
  }

  function truthsocialLink(el) {
    const link = el.querySelector('a[href*="/posts/"], a[href*="/statuses/"], time a') || el.querySelector("a[href]");
    return absoluteHref(link && link.getAttribute("href"));
  }

  function truthsocialMeta(el) {
    const title = textOf(el.querySelector(".status__content, .e-content, p")) || textOf(el);
    const source = textOf(el.querySelector(".display-name, .status__display-name"));
    return { title, subtitle: "", description: title, source };
  }

  function truthsocialClassifyHide(el) {
    if (rawText(el).length < 6) return "hold";
    return "ready";
  }

  const NEWS_SEED =
    "article, [data-testid*='card' i], [class*='story-wrapper' i], [class*='StoryCard'], [class*='story-card' i], [class*='teaser' i], [data-qa*='card' i], [data-qa*='teaser' i], [data-type='article']";
  const NEWS_HEADING =
    "h2 a[href], h3 a[href], h4 a[href], a[href] h2, a[href] h3, a[href] h4, [data-testid='headline' i], [data-qa='headline' i], a[href] [data-testid='headline' i]";
  const NEWS_UNIT =
    "article, li, figure, [class*='card' i], [class*='teaser' i], [class*='story-card' i], [data-qa*='card' i], [data-testid*='card' i], [data-qa*='teaser' i]";
  const NEWS_TITLE = "h1, h2, h3, h4, [data-testid='headline' i], [data-qa='headline' i], [class*='headline' i]";
  const NEWS_HIDE = `${NEWS_SEED}, ${NEWS_HEADING}`;

  function newsCards(root) {
    const found = [];
    const seen = new Set();
    const seeds = [];

    for (const el of root.querySelectorAll(NEWS_SEED)) seeds.push(el);
    for (const heading of root.querySelectorAll(NEWS_HEADING)) {
      const link = heading.closest("a[href]") || heading.querySelector("a[href]") || heading;
      seeds.push(link);
    }

    for (const seed of seeds) {
      if (newsSkipChrome(seed) || newsIsArticleBody(seed) || newsIsBareAd(seed)) continue;
      const card = newsTeaserRoot(seed);
      if (!card || seen.has(card)) continue;
      if (!looksLikeNewsCard(card, seen)) continue;
      seen.add(card);
      found.push(card);
    }

    return found.filter((el) => !found.some((other) => other !== el && other.contains(el)));
  }

  function looksLikeNewsCard(el, seen) {
    if (!el || seen.has(el)) return false;
    if (newsSkipChrome(el)) return false;
    if (newsIsArticleBody(el)) return false;
    if (newsIsBareAd(el)) return false;
    if (!el.matches("article")) {
      const inner = el.querySelector && el.querySelector("article");
      if (inner && !isNewsFragment(inner) && !isNewsTooSmall(inner) && !oversized(inner) && inner !== el) {
        return false;
      }
    }
    if (isNewsTooSmall(el) || isNewsFragment(el)) return false;
    if (oversized(el)) return false;
    const text = rawText(el);
    if (text.length < 12) return false;
    const link = el.matches("a[href]") ? el : el.querySelector("a[href]");
    if (!link) return false;
    if (!newsStoryHref(link.getAttribute("href") || "") && !newsStoryPaths(el).length) return false;
    return true;
  }

  function newsSkipChrome(el) {
    return Boolean(
      el.closest(
        "nav, header, footer, [role='navigation'], [role='banner'], [role='contentinfo'], [itemprop='articleBody'], [data-testid='article-body'], #story, section[name='articleBody']"
      )
    );
  }

  function newsIsArticleBody(el) {
    return Boolean(
      el.matches(
        "[itemprop='articleBody'], [data-testid='article-body'], [class*='ArticleBody'], [class*='article-body'], #story"
      )
    );
  }

  function newsIsBareAd(el) {
    const slot = el.closest(
      "[data-qa$='-ad'], [data-ad-module], [id*='taboola' i], .OUTBRAIN, [class*='ad-slot' i], [data-testid*='ad-slot' i]"
    );
    if (!slot) return false;
    const title = textOf(el.querySelector(NEWS_TITLE));
    if (title.length >= 16 && newsStoryPaths(el).length) return false;
    return true;
  }

  function newsStoryHref(href) {
    if (!href || /^(javascript:|mailto:|#)/i.test(href)) return false;
    const path = normalizeHref(href).split("?")[0];
    if (path.length < 6) return false;
    if (/\/(login|signin|subscribe|privacy|cookie|account|settings|help|contact|about|advertis|terms)\b/i.test(path)) {
      return false;
    }
    return /\/20\d\d\//.test(path) || path.split("/").filter(Boolean).length >= 2;
  }

  function newsArticleHref(href) {
    if (!href || /^(javascript:|mailto:|#)/i.test(href)) return false;
    const path = normalizeHref(href).split("?")[0];
    if (/\.(jpg|jpeg|png|gif|webp|svg|js|css)(\?|$)/i.test(path)) return false;
    if (/\/(wp-apps|wp-stat|imrs\.php|resizer)\b/i.test(path)) return false;
    return /\/20\d\d\//.test(path) || /\/(live|interactive|video)\/\d{4}\//.test(path);
  }

  function newsStoryPaths(el) {
    const paths = [];
    const push = (href) => {
      if (!newsArticleHref(href || "")) return;
      paths.push(normalizeHref(href).split("?")[0].replace(/\/$/, ""));
    };
    if (el.querySelectorAll) {
      for (const link of el.querySelectorAll("a[href]")) push(link.getAttribute("href"));
    }
    if (el.matches && el.matches("a[href]")) push(el.getAttribute("href"));
    return [...new Set(paths)];
  }

  function newsHasTitle(el) {
    return Boolean((el.matches && el.matches(NEWS_TITLE)) || (el.querySelector && el.querySelector(NEWS_TITLE))) ||
      (el.matches && el.matches("a") && rawText(el).length >= 12);
  }

  function isNewsFragment(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const hasTitle = newsHasTitle(el);
    if (rect.width > 0 && rect.height > 0 && rect.width < 140 && rect.height < 72 && !hasTitle) return true;
    if (rect.height > 0 && rect.height < 36 && rect.width < 160) return true;
    if (!hasTitle && rawText(el).length < 24 && rect.width > 0 && rect.width < 140) return true;
    return false;
  }

  function isNewsTooSmall(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    if (rect.width >= 140 && rect.height >= 18) return false;
    if (rect.width >= 96 && rect.height >= 72) return false;
    return true;
  }

  function newsTeaserRoot(start) {
    if (!start) return null;
    let best = start;
    let node = start;
    for (let i = 0; i < 14 && node && node !== document.documentElement; i += 1) {
      const parent = node.parentElement;
      if (!parent || parent === document.body) break;
      if (newsSkipChrome(parent) || newsIsArticleBody(parent)) break;
      if (parent.matches("main, [role='main'], body, html")) break;
      if (oversized(parent)) break;

      const parentRect = parent.getBoundingClientRect();
      const childRect = node.getBoundingClientRect();
      if (parentRect.height > window.innerHeight * 0.85 || parentRect.width > window.innerWidth * 0.98) break;

      const childPaths = newsStoryPaths(node);
      const parentPaths = newsStoryPaths(parent);
      if (parentPaths.length >= 3 && parentPaths.length > Math.max(childPaths.length, 1)) break;

      const parentIsUnit = parent.matches(NEWS_UNIT);
      const parentHasTitle = newsHasTitle(parent);
      const parentHasMedia = Boolean(parent.querySelector("img, picture, video"));
      const childTiny = isNewsFragment(node) || isNewsTooSmall(node);
      const singleStory = parentPaths.length <= 2;
      const parentCompact = parentRect.height < 640 && parentRect.height <= Math.max(childRect.height * 8, 560);

      if (childTiny && singleStory && (parentIsUnit || parentHasTitle)) {
        best = parent;
        node = parent;
        continue;
      }
      if (parentIsUnit && parentHasTitle && singleStory && parentCompact) {
        best = parent;
        node = parent;
        continue;
      }
      if (singleStory && parentHasTitle && (parentHasMedia || parentIsUnit) && parentCompact && parentRect.height > childRect.height + 8) {
        best = parent;
        node = parent;
        continue;
      }
      // Anonymous wrappers between a headline link and the real card
      // (WaPo `div.card-left` / `div.card-top`) — keep climbing.
      if (singleStory && parentCompact && !parentIsUnit) {
        node = parent;
        continue;
      }
      break;
    }
    return best;
  }

  function newsLinkCard(link) {
    return newsTeaserRoot(link) || link;
  }

  function newsId(el) {
    const link = el.matches("a[href]") ? el : el.querySelector("a[href]");
    const href = normalizeHref(link && link.getAttribute("href"));
    if (href) return `news:${href}`;
    return fallbackId(el, "news");
  }

  function newsLink(el) {
    const link = el.matches("a[href]") ? el : el.querySelector("a[href]");
    return absoluteHref(link && link.getAttribute("href"));
  }

  function newsMeta(el) {
    const title =
      textOf(el.querySelector(NEWS_TITLE)) ||
      textOf(el.matches("a") ? el : el.querySelector("a"));
    const subtitle = textOf(el.querySelector("[class*='summary' i], [class*='dek' i], [class*='standfirst' i], p"));
    const source = textOf(el.querySelector("[class*='kicker' i], [class*='byline' i], time"));
    return { title, subtitle, description: subtitle, source };
  }

  function newsClassifyHide(el) {
    if (newsSkipChrome(el) || newsIsArticleBody(el) || newsIsBareAd(el)) return "ready";
    if (isNewsFragment(el) || isNewsTooSmall(el)) return "hold";
    if (rawText(el).length < 12 && !el.querySelector("img, picture")) return "hold";
    return "ready";
  }

  function oversized(el) {
    const rect = el.getBoundingClientRect();
    return rect.height > window.innerHeight * 1.15;
  }

  function skipChrome(el) {
    return Boolean(
      el.closest("nav, header, footer, [role='navigation'], [role='banner'], [role='contentinfo']")
    );
  }

  function firstHref(el, extraSel) {
    if (el.matches && el.matches("a[href]")) return el.getAttribute("href") || "";
    const link = (extraSel && el.querySelector(extraSel)) || el.querySelector("a[href]");
    return (link && link.getAttribute("href")) || "";
  }

  function holdIfSparse(el, minText = 8) {
    if (skipChrome(el)) return "ready";
    if (el.querySelector && el.querySelector("article") && !el.matches("article")) return "ready";
    const text = rawText(el);
    const titled = el.getAttribute && (el.getAttribute("title") || el.getAttribute("aria-label"));
    if (text.length < minText && !(titled && titled.length >= 8) && !el.querySelector("img, picture")) return "hold";
    return "ready";
  }

  function collectSelectorCards(root, selector, opts = {}) {
    const found = [];
    const seen = new Set();
    const minW = opts.minW ?? 80;
    const minH = opts.minH ?? 36;
    const minText = opts.minText ?? 8;
    const innerSel = typeof opts.innermost === "string" ? opts.innermost : selector;
    for (const el of root.querySelectorAll(selector)) {
      if (seen.has(el)) continue;
      if (!opts.allowChrome && skipChrome(el)) continue;
      if (opts.skip && opts.skip(el)) continue;
      if (opts.innermost && el.querySelector(innerSel)) continue;
      if (opts.skipTiny !== false && isTiny(el, minW, minH)) continue;
      if (!opts.allowOversized && oversized(el)) continue;
      const text = rawText(el);
      const titled = el.getAttribute && (el.getAttribute("title") || el.getAttribute("aria-label"));
      if (text.length < minText && !(titled && titled.length >= 8) && !el.querySelector("img, picture")) continue;
      if (!opts.allowNoLink) {
        const href = firstHref(el, opts.linkSel);
        if (!href || /^(javascript:|mailto:|#)/i.test(href)) continue;
      }
      seen.add(el);
      found.push(el);
    }
    return found;
  }

  function hrefId(el, prefix, extraSel) {
    const href = normalizeHref(firstHref(el, extraSel));
    if (href) return `${prefix}:${href}`;
    return fallbackId(el, prefix);
  }

  function hrefLink(el, extraSel) {
    return absoluteHref(firstHref(el, extraSel));
  }

  function headingMeta(el, source) {
    const title =
      textOf(el.querySelector("h1, h2, h3, h4, [class*='title' i], [data-testid*='title' i]")) ||
      (el.getAttribute && (el.getAttribute("title") || el.getAttribute("aria-label"))) ||
      textOf(el.matches("a") ? el : el.querySelector("a")) ||
      textOf(el);
    return { title, subtitle: "", description: title, source: source || textOf(el.querySelector("[class*='source' i], [class*='byline' i]")) };
  }

  const GOOGLE_CARD = "#center_col .g, #rso .g, #search .g, #res .g, #rso .MjjYud, #search .MjjYud, #rso .tF2Cxc";

  function googleCards(root) {
    if (!document.querySelector("#rso, #search .g, #res .g, .tF2Cxc, #center_col")) return [];
    return collectSelectorCards(root, GOOGLE_CARD, {
      minW: 160,
      minH: 36,
      minText: 8,
      innermost: ".g, .tF2Cxc",
      skip(el) {
        if (el.closest("#searchform, form[role='search'], #rhs, #taw, #top_nav, #sfcnt")) return true;
        if (el.matches(".MjjYud") && el.querySelector(".g, .tF2Cxc")) return true;
        return !el.querySelector("h3, .yuRUbf, a[href] h3, a[ping]");
      },
    });
  }

  const BING_CARD = "ol#b_results > li.b_algo, ol#b_results > li.b_ad, li.b_algo";

  function bingCards(root) {
    return collectSelectorCards(root, BING_CARD, {
      minW: 160,
      minH: 40,
      innermost: "li.b_algo, li.b_ad",
      skip: (el) => el.closest("#b_header, #b_context, #b_footer"),
    });
  }

  const DDG_CARD = 'article[data-testid="result"], li[data-layout="organic"] article';

  function duckduckgoCards(root) {
    return collectSelectorCards(root, DDG_CARD, {
      minW: 160,
      minH: 40,
      innermost: "article",
    });
  }

  const FLIPBOARD_CARD = "article.post, article.post--card";

  function flipboardCards(root) {
    return collectSelectorCards(root, FLIPBOARD_CARD, {
      minW: 120,
      minH: 80,
      innermost: "article.post",
    });
  }

  const GROUND_CARD = '[data-testid="story-item"]';

  function groundnewsCards(root) {
    return collectSelectorCards(root, GROUND_CARD, {
      minW: 120,
      minH: 48,
      innermost: '[data-testid="story-item"]',
      linkSel: 'a[href*="/article/"]',
    });
  }

  const SUBSTACK_CARD =
    'a[href*="/p/"], .post-preview, .portable-archive-post, [class*="post-preview"], [data-testid="post-preview"], .container-post, .post';

  function substackCards(root) {
    const found = [];
    const seen = new Set();
    const onPost = /\/p\//.test(location.pathname);
    for (const el of root.querySelectorAll(SUBSTACK_CARD)) {
      if (seen.has(el)) continue;
      if (skipChrome(el)) continue;
      if (onPost && el.matches(".post, article.post, .container-post") && !el.matches(".post-preview, [class*='post-preview']")) {
        continue;
      }
      if (el.closest(".available-content, .body.markup, [data-testid='post-content'], article.post")) {
        if (onPost && el.closest(".available-content, .body.markup, [data-testid='post-content']")) continue;
      }
      if (el.matches("a[href*='/p/']") && el.closest(".post-preview, .portable-archive-post, [class*='post-preview']")) {
        continue;
      }
      const card = el.matches("a") ? el : el;
      if (isTiny(card, 120, 48)) continue;
      if (oversized(card)) continue;
      const href = firstHref(card, 'a[href*="/p/"]');
      if (!/\/p\//.test(href || "")) continue;
      if (rawText(card).length < 8) continue;
      seen.add(card);
      found.push(card);
    }
    return found;
  }

  const HN_CARD = "tr.athing";

  function hackernewsCards(root) {
    const found = [];
    for (const el of root.querySelectorAll(HN_CARD)) {
      if (el.classList.contains("comtr")) continue;
      if (!el.querySelector(".titleline, a.storylink, .title a[href]")) continue;
      found.push(el);
      const next = el.nextElementSibling;
      if (next && next.matches("tr") && next.querySelector(".subtext, .score")) found.push(next);
    }
    return found;
  }

  function hackernewsId(el) {
    const row = el.classList && el.classList.contains("athing") ? el : el.previousElementSibling;
    const id = row && (row.id || (row.getAttribute && row.getAttribute("id")));
    if (id) return `hn:${id}`;
    return hrefId(el, "hn", ".titleline a, a.storylink");
  }

  function hackernewsMeta(el) {
    const title = textOf(el.querySelector(".titleline, a.storylink, .title a")) || textOf(el);
    const source = textOf(el.querySelector(".sitestr, .sitebit"));
    return { title, subtitle: "", description: title, source };
  }

  const SO_CARD = ".s-post-summary, .js-post-summary, .question-summary";

  function stackoverflowCards(root) {
    return collectSelectorCards(root, SO_CARD, {
      minW: 160,
      minH: 40,
      innermost: ".s-post-summary",
      skip(el) {
        return Boolean(el.closest("#question, #answers, .question, .answercell, aside, .js-sidebar"));
      },
    });
  }

  const NEXTDOOR_CARD =
    '[data-testid*="post" i], [data-click-id="post"], [class*="FeedItem"], [class*="feed-item"], article';

  function nextdoorCards(root) {
    if (/\/(login|choose_address)\b/.test(location.pathname)) return [];
    return collectSelectorCards(root, NEXTDOOR_CARD, {
      minW: 160,
      minH: 60,
      innermost: "article",
      skip(el) {
        if (el.querySelector && el.querySelector("article") && !el.matches("article")) return true;
        return Boolean(el.closest("[data-testid='sign-in-layout-container']"));
      },
    });
  }

  const DISCORD_CARD = 'li[id^="chat-messages-"], li[class*="messageListItem"]';

  function discordCards(root) {
    if (/^\/channels\/@me\b/.test(location.pathname) || /\/login\b/.test(location.pathname)) return [];
    return collectSelectorCards(root, DISCORD_CARD, {
      minW: 120,
      minH: 24,
      minText: 4,
      skipTiny: false,
      innermost: 'li[id^="chat-messages-"], li[class*="messageListItem"]',
    });
  }

  const MASTODON_CARD = "article[data-id], .status";

  function mastodonCards(root) {
    const found = [];
    const seen = new Set();
    for (const el of root.querySelectorAll(MASTODON_CARD)) {
      if (seen.has(el)) continue;
      if (skipChrome(el)) continue;
      if (el.closest(".drawer, .column-header, .tabs-bar, .compose-form")) continue;
      if (el.matches(".status") && el.closest("article[data-id]")) continue;
      if (el.querySelector("article[data-id]") && el.matches("article")) continue;
      if (isTiny(el, 140, 48)) continue;
      if (oversized(el)) continue;
      if (rawText(el).length < 6) continue;
      seen.add(el);
      found.push(el);
    }
    return found;
  }

  function mastodonId(el) {
    const id = el.getAttribute && (el.getAttribute("data-id") || el.getAttribute("data-status-id"));
    if (id) return `masto:${id}`;
    return hrefId(el, "masto", 'a[href*="/@"], time a');
  }

  const LEMMY_CARD = "article.post-listing, .post-listing, article.post";

  function lemmyCards(root) {
    return collectSelectorCards(root, LEMMY_CARD, {
      minW: 140,
      minH: 40,
      innermost: "article.post-listing, .post-listing",
      skip(el) {
        return Boolean(el.closest(".post-body, .md-div, .post-content"));
      },
    });
  }

  const RUMBLE_CARD = ".videostream, article.video-item";

  function rumbleCards(root) {
    return collectSelectorCards(root, RUMBLE_CARD, {
      minW: 120,
      minH: 80,
      innermost: ".videostream",
      skip(el) {
        if (el.closest("nav, header, footer, #videoPlayer, .video-player")) return true;
        return false;
      },
    });
  }

  const VIMEO_CARD = '[data-testid="content-card-link"], a[data-testid="content-card-link"]';

  function vimeoCards(root) {
    const found = [];
    const seen = new Set();
    for (const el of root.querySelectorAll(VIMEO_CARD)) {
      if (el.closest("#player, .player, [data-player], nav, header")) continue;
      let card = el.closest("article, li, [class*='card' i]") || el.parentElement || el;
      if (oversized(card)) card = el;
      if (seen.has(card) || skipChrome(card)) continue;
      if (isTiny(card, 120, 80)) continue;
      const href = firstHref(card) || firstHref(el);
      if (!href) continue;
      seen.add(card);
      found.push(card);
    }
    return found;
  }

  const BR_CARD = 'a.MuiCardActionArea-root[href*="/articles/"], a[href*="/articles/"]';

  function bleacherreportCards(root) {
    return collectSelectorCards(root, BR_CARD, {
      minW: 120,
      minH: 48,
      skip(el) {
        if (el.closest("nav, header, footer")) return true;
        if (el.matches("a") && el.closest("a.MuiCardActionArea-root") && !el.matches(".MuiCardActionArea-root")) {
          return true;
        }
        return false;
      },
    });
  }

  const YF_CARD = 'li.js-stream-content, section[data-testid="storyitem"], [data-testid="storyitem"], [data-testid="recent-news"] li, [data-testid="topic-stream"] li';

  function yfStoryHref(href) {
    if (!href || /^(javascript:|mailto:|#)/i.test(href)) return false;
    const path = normalizeHref(href).split("?")[0];
    if (/\/(login|signup|watchlist|screener|portfolios)\b/i.test(path)) return false;
    return /\/(article|news|video|live)\//.test(path) || /-\d{6,}\.html$/.test(path);
  }

  function yahoofinanceCards(root) {
    const found = [];
    const seen = new Set();
    for (const el of root.querySelectorAll(YF_CARD)) {
      if (seen.has(el) || skipChrome(el)) continue;
      if (el.closest("[data-testid='ticker-list-item'], .notification-list-item, .submenu-item, .flyout-list-item")) {
        continue;
      }
      if (el.querySelector("section[data-testid='storyitem'], li.js-stream-content") && !el.matches("li, section")) continue;
      if (isTiny(el, 120, 36) || oversized(el)) continue;
      if (!yfStoryHref(firstHref(el))) continue;
      seen.add(el);
      found.push(el);
    }
    for (const heading of root.querySelectorAll("h3 a[href], a[href] h3, h2 a[href]")) {
      const link = heading.closest("a[href]") || heading;
      if (!yfStoryHref(link.getAttribute("href") || "")) continue;
      if (link.closest("nav, header, footer, .notification-list-item, .submenu-item, [data-testid='ticker-list-item']")) {
        continue;
      }
      const card = newsLinkCard(link);
      if (!card || seen.has(card) || oversized(card) || isTiny(card, 120, 28)) continue;
      seen.add(card);
      found.push(card);
    }
    return found;
  }

  const SA_CARD = '[data-test-id="post-list-item"]';

  function seekingalphaCards(root) {
    return collectSelectorCards(root, SA_CARD, {
      minW: 140,
      minH: 36,
      innermost: '[data-test-id="post-list-item"]',
      skip(el) {
        return Boolean(el.closest("[data-test-id='article-content'], [data-test-id='content-container'], article[data-id] .paywall"));
      },
    });
  }

  const AMAZON_CARD = '[data-component-type="s-search-result"], .s-result-item[data-asin], .a-carousel-card';

  function amazonIsPdp() {
    return /\/(dp|gp\/product|gp\/aw\/d)\//i.test(location.pathname);
  }

  function amazonCards(root) {
    const found = [];
    const seen = new Set();
    const asins = new Set();
    const hasSearch = Boolean(root.querySelector("[data-component-type='s-search-result']"));
    for (const el of root.querySelectorAll(AMAZON_CARD)) {
      if (seen.has(el) || skipChrome(el)) continue;
      if (el.closest("#navbar, #nav-belt, #nav-flyout-anchor, #nav-main, footer, #navFooter")) continue;
      if (amazonIsPdp() && el.closest("#ppd, #centerCol, #dp-container, #productDescription, #dpx-container")) continue;
      if (hasSearch && el.matches(".a-carousel-card")) continue;
      if (el.matches(".a-carousel-card") && el.closest("[data-component-type='s-search-result'], .s-result-item")) continue;
      const asin = el.getAttribute && el.getAttribute("data-asin");
      if (el.matches(".s-result-item, [data-component-type='s-search-result']") && !asin) continue;
      if (asin && asins.has(asin)) continue;
      if (el.querySelector("[data-component-type='s-search-result']") && !el.matches("[data-component-type='s-search-result']")) {
        continue;
      }
      if (isTiny(el, 120, 80) || oversized(el)) continue;
      const href = firstHref(el, 'a[href*="/dp/"], a[href*="/gp/product/"]');
      if (!href) continue;
      if (rawText(el).length < 8 && !el.querySelector("img")) continue;
      if (asin) asins.add(asin);
      seen.add(el);
      found.push(el);
    }
    return found;
  }

  const EBAY_CARD = "li.s-card, .srp-results .s-item, li[id^='item'], .s-item";

  function ebayCards(root) {
    return collectSelectorCards(root, EBAY_CARD, {
      minW: 120,
      minH: 80,
      innermost: "li.s-card, .s-item",
      skip(el) {
        if (el.closest("nav, header, footer, .s-answer-region-hidden-count")) return true;
        const href = firstHref(el);
        if (/\/sch\/i\.html$/.test(normalizeHref(href).split("?")[0])) return true;
        const text = rawText(el);
        if (/^shop on ebay$/i.test(text)) return true;
        return false;
      },
    });
  }

  const GITHUB_CARD =
    ".js-feed-item-component, [data-testid='feed-item'], .feed-item, [class*='feed-item'], #dashboard .body > .border, article.border.rounded";

  function githubOnFeedPage() {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    return path === "/" || path === "/dashboard" || /^\/orgs\/[^/]+\/dashboard$/.test(path);
  }

  function githubCards(root) {
    if (!githubOnFeedPage()) return [];
    return collectSelectorCards(root, GITHUB_CARD, {
      minW: 160,
      minH: 40,
      innermost: ".js-feed-item-component, [data-testid='feed-item'], .feed-item",
      skip(el) {
        if (el.closest("#repository-container-header, .file-header, .blob-wrapper, .js-file-line-container, .PullRequest-module, turbo-frame[id*='repo']")) {
          return true;
        }
        if (el.matches("article") && el.querySelector(".js-feed-item-component, [data-testid='feed-item']")) return true;
        return false;
      },
    });
  }

  function normalizeHref(href) {
    if (!href) return "";
    try {
      const url = new URL(href, location.origin);
      url.hash = "";
      ["si", "pp", "t", "feature", "utm_source", "utm_medium", "utm_campaign", "igsh"].forEach((key) => {
        url.searchParams.delete(key);
      });
      return `${url.pathname}${url.search}`;
    } catch {
      return href.split("#")[0];
    }
  }

  function absoluteHref(href) {
    if (!href) return "";
    try {
      return new URL(href, location.origin).toString();
    } catch {
      return href;
    }
  }

  function fallbackId(el, prefix) {
    const text = rawText(el).slice(0, 80);
    return `${prefix}:fb:${text || el.tagName}`;
  }

  function rawText(el) {
    return String((el && el.textContent) || "").replace(/\s+/g, " ").trim();
  }

  function textOf(el) {
    if (!el) return "";
    return rawText(el).slice(0, 280);
  }

  function isTiny(el, minW = 120, minH = 80) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    return rect.width > 0 && rect.height > 0 && (rect.width < minW || rect.height < minH);
  }

  const ADAPTERS = {
    youtube: () => ({
      hideSelector: YT_CARD,
      cards: youtubeCards,
      id: youtubeId,
      link: youtubeLink,
      meta: youtubeMeta,
      classifyHide: youtubeClassifyHide,
    }),
    instagram: () => ({
      hideSelector: 'article, main a[href*="/p/"], main a[href*="/reel/"]',
      cards: instagramCards,
      id: instagramId,
      link: instagramLink,
      meta: instagramMeta,
      classifyHide: instagramClassifyHide,
    }),
    nyt: () => ({
      hideSelector: NYT_HIDE,
      cards: nytCards,
      id: nytId,
      link: nytLink,
      meta: nytMeta,
      classifyHide: nytClassifyHide,
    }),
    x: () => ({
      hideSelector: X_CARD,
      cards: xCards,
      id: xId,
      link: xLink,
      meta: xMeta,
      classifyHide: xClassifyHide,
    }),
    facebook: () => ({
      hideSelector: FACEBOOK_CARD,
      cards: facebookCards,
      id: facebookId,
      link: facebookLink,
      meta: facebookMeta,
      classifyHide: facebookClassifyHide,
    }),
    reddit: () => ({
      hideSelector: REDDIT_CARD,
      cards: redditCards,
      id: redditId,
      link: redditLink,
      meta: redditMeta,
      classifyHide: redditClassifyHide,
    }),
    linkedin: () => ({
      hideSelector: LINKEDIN_CARD,
      cards: linkedinCards,
      id: linkedinId,
      link: linkedinLink,
      meta: linkedinMeta,
      classifyHide: linkedinClassifyHide,
    }),
    tiktok: () => ({
      hideSelector: TIKTOK_CARD,
      cards: tiktokCards,
      id: tiktokId,
      link: tiktokLink,
      meta: tiktokMeta,
      classifyHide: tiktokClassifyHide,
    }),
    threads: () => ({
      hideSelector: 'article, a[href*="/post/"]',
      cards: threadsCards,
      id: threadsId,
      link: threadsLink,
      meta: threadsMeta,
      classifyHide: threadsClassifyHide,
    }),
    bluesky: () => ({
      hideSelector: `${BLUESKY_CARD}, a[href*="/post/"]`,
      cards: blueskyCards,
      id: blueskyId,
      link: blueskyLink,
      meta: blueskyMeta,
      classifyHide: blueskyClassifyHide,
    }),
    pinterest: () => ({
      hideSelector: PINTEREST_CARD,
      cards: pinterestCards,
      id: pinterestId,
      link: pinterestLink,
      meta: pinterestMeta,
      classifyHide: pinterestClassifyHide,
    }),
    tumblr: () => ({
      hideSelector: TUMBLR_CARD,
      cards: tumblrCards,
      id: tumblrId,
      link: tumblrLink,
      meta: tumblrMeta,
      classifyHide: tumblrClassifyHide,
    }),
    twitch: () => ({
      hideSelector: TWITCH_CARD,
      cards: twitchCards,
      id: twitchId,
      link: twitchLink,
      meta: twitchMeta,
      classifyHide: twitchClassifyHide,
    }),
    truthsocial: () => ({
      hideSelector: TRUTH_CARD,
      cards: truthsocialCards,
      id: truthsocialId,
      link: truthsocialLink,
      meta: truthsocialMeta,
      classifyHide: truthsocialClassifyHide,
    }),
    news: () => ({
      hideSelector: NEWS_HIDE,
      cards: newsCards,
      id: newsId,
      link: newsLink,
      meta: newsMeta,
      classifyHide: newsClassifyHide,
    }),
    google: () => ({
      hideSelector: GOOGLE_CARD,
      cards: googleCards,
      id: (el) => hrefId(el, "google"),
      link: (el) => hrefLink(el),
      meta: (el) => headingMeta(el, "Google"),
      classifyHide: (el) => holdIfSparse(el, 8),
    }),
    bing: () => ({
      hideSelector: BING_CARD,
      cards: bingCards,
      id: (el) => hrefId(el, "bing", "h2 a, a"),
      link: (el) => hrefLink(el, "h2 a, a"),
      meta: (el) => headingMeta(el, "Bing"),
      classifyHide: (el) => holdIfSparse(el, 8),
    }),
    duckduckgo: () => ({
      hideSelector: DDG_CARD,
      cards: duckduckgoCards,
      id: (el) => hrefId(el, "ddg", '[data-testid="result-title-a"]'),
      link: (el) => hrefLink(el, '[data-testid="result-title-a"]'),
      meta: (el) => headingMeta(el, "DuckDuckGo"),
      classifyHide: (el) => holdIfSparse(el, 8),
    }),
    flipboard: () => ({
      hideSelector: FLIPBOARD_CARD,
      cards: flipboardCards,
      id: (el) => hrefId(el, "flip"),
      link: (el) => hrefLink(el),
      meta: (el) => headingMeta(el, "Flipboard"),
      classifyHide: (el) => holdIfSparse(el, 12),
    }),
    groundnews: () => ({
      hideSelector: GROUND_CARD,
      cards: groundnewsCards,
      id: (el) => hrefId(el, "ground", 'a[href*="/article/"]'),
      link: (el) => hrefLink(el, 'a[href*="/article/"]'),
      meta: (el) => headingMeta(el, "Ground News"),
      classifyHide: (el) => holdIfSparse(el, 12),
    }),
    substack: () => ({
      hideSelector: SUBSTACK_CARD,
      cards: substackCards,
      id: (el) => hrefId(el, "substack", 'a[href*="/p/"]'),
      link: (el) => hrefLink(el, 'a[href*="/p/"]'),
      meta: (el) => headingMeta(el, "Substack"),
      classifyHide: (el) => holdIfSparse(el, 8),
    }),
    hackernews: () => ({
      hideSelector: HN_CARD,
      cards: hackernewsCards,
      id: hackernewsId,
      link: (el) => hrefLink(el, ".titleline a, a.storylink"),
      meta: hackernewsMeta,
      classifyHide: (el) => (el.classList.contains("comtr") ? "ready" : holdIfSparse(el, 6)),
    }),
    stackoverflow: () => ({
      hideSelector: SO_CARD,
      cards: stackoverflowCards,
      id: (el) => hrefId(el, "so", "a.s-link, .s-post-summary--content-title a"),
      link: (el) => hrefLink(el, "a.s-link, .s-post-summary--content-title a"),
      meta: (el) => headingMeta(el, "Stack Overflow"),
      classifyHide: (el) => holdIfSparse(el, 8),
    }),
    nextdoor: () => ({
      hideSelector: NEXTDOOR_CARD,
      cards: nextdoorCards,
      id: (el) => hrefId(el, "nd"),
      link: (el) => hrefLink(el),
      meta: (el) => headingMeta(el, "Nextdoor"),
      classifyHide: (el) => holdIfSparse(el, 8),
    }),
    discord: () => ({
      hideSelector: DISCORD_CARD,
      cards: discordCards,
      id: (el) => {
        const id = el.id || (el.getAttribute && el.getAttribute("id"));
        if (id) return `discord:${id}`;
        return fallbackId(el, "discord");
      },
      link: (el) => hrefLink(el, 'a[href*="/channels/"]'),
      meta: (el) => headingMeta(el, "Discord"),
      classifyHide: (el) => holdIfSparse(el, 4),
    }),
    mastodon: () => ({
      hideSelector: MASTODON_CARD,
      cards: mastodonCards,
      id: mastodonId,
      link: (el) => hrefLink(el, "time a, a[href*='/@']"),
      meta: (el) => headingMeta(el),
      classifyHide: (el) => holdIfSparse(el, 6),
    }),
    lemmy: () => ({
      hideSelector: LEMMY_CARD,
      cards: lemmyCards,
      id: (el) => hrefId(el, "lemmy", "a[href*='/post/']"),
      link: (el) => hrefLink(el, "a[href*='/post/']"),
      meta: (el) => headingMeta(el, "Lemmy"),
      classifyHide: (el) => holdIfSparse(el, 8),
    }),
    rumble: () => ({
      hideSelector: RUMBLE_CARD,
      cards: rumbleCards,
      id: (el) => hrefId(el, "rumble", "a.videostream__link, a[href]"),
      link: (el) => hrefLink(el, "a.videostream__link, a[href]"),
      meta: (el) => headingMeta(el, "Rumble"),
      classifyHide: (el) => holdIfSparse(el, 6),
    }),
    vimeo: () => ({
      hideSelector: VIMEO_CARD,
      cards: vimeoCards,
      id: (el) => hrefId(el, "vimeo"),
      link: (el) => hrefLink(el),
      meta: (el) => headingMeta(el, "Vimeo"),
      classifyHide: (el) => holdIfSparse(el, 6),
    }),
    bleacherreport: () => ({
      hideSelector: BR_CARD,
      cards: bleacherreportCards,
      id: (el) => hrefId(el, "br"),
      link: (el) => hrefLink(el),
      meta: (el) => headingMeta(el, "Bleacher Report"),
      classifyHide: (el) => holdIfSparse(el, 8),
    }),
    yahoofinance: () => ({
      hideSelector: `${YF_CARD}, h3 a[href], a[href] h3`,
      cards: yahoofinanceCards,
      id: (el) => hrefId(el, "yf"),
      link: (el) => hrefLink(el),
      meta: (el) => headingMeta(el, "Yahoo Finance"),
      classifyHide: (el) => holdIfSparse(el, 10),
    }),
    seekingalpha: () => ({
      hideSelector: SA_CARD,
      cards: seekingalphaCards,
      id: (el) => hrefId(el, "sa"),
      link: (el) => hrefLink(el),
      meta: (el) => headingMeta(el, "Seeking Alpha"),
      classifyHide: (el) => holdIfSparse(el, 8),
    }),
    amazon: () => ({
      hideSelector: AMAZON_CARD,
      cards: amazonCards,
      id: (el) => {
        const asin = el.getAttribute && el.getAttribute("data-asin");
        if (asin) return `amazon:${asin}`;
        return hrefId(el, "amazon", 'a[href*="/dp/"]');
      },
      link: (el) => hrefLink(el, 'a[href*="/dp/"], a[href*="/gp/product/"]'),
      meta: (el) => headingMeta(el, "Amazon"),
      classifyHide: (el) => holdIfSparse(el, 8),
    }),
    ebay: () => ({
      hideSelector: EBAY_CARD,
      cards: ebayCards,
      id: (el) => hrefId(el, "ebay"),
      link: (el) => hrefLink(el),
      meta: (el) => headingMeta(el, "eBay"),
      classifyHide: (el) => holdIfSparse(el, 8),
    }),
    github: () => ({
      hideSelector: GITHUB_CARD,
      cards: githubCards,
      id: (el) => hrefId(el, "gh"),
      link: (el) => hrefLink(el),
      meta: (el) => headingMeta(el, "GitHub"),
      classifyHide: (el) => holdIfSparse(el, 8),
    }),
  };

  function forHost(hostname) {
    const catalog = typeof ContentCoverCatalog !== "undefined" ? ContentCoverCatalog.forHost(hostname) : null;
    if (!catalog) return null;
    const factory = ADAPTERS[catalog.adapter];
    if (!factory) return null;
    return {
      site: catalog.id,
      displayName: catalog.name,
      ...factory(),
    };
  }

  return { forHost };
})();
