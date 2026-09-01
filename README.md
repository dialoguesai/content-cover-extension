<p align="center">
  <img src="icons/icon-48.png" alt="Content Cover" width="96" height="96" />
</p>

<h1 align="center">Content Cover</h1>

<p align="center">
  <strong>Cover posts and headlines until you choose to see them.</strong>
</p>

<p align="center">
  <a href="https://github.com/dialoguesai/content-cover-extension">GitHub</a>
  ·
  Chrome · Arc · Edge (Chromium)
  ·
  Manifest V3
</p>

<p align="center">
  Don’t-show hides what you asked not to see. Pinned focus keeps what you asked to see and covers the rest.<br />
  Scoring runs on your machine with a bundled MiniLM model — nothing is sent to a network.
</p>

---

## Why use it

Feeds are designed to keep you scrolling. Content Cover puts a light grey block over posts and headlines that do not match the filters you set. Click a block to uncover that item for the rest of the visit.

| You get | What it means |
|--------|----------------|
| **Don’t show** | Hide items whose title or text matches, or is similar to, your phrases. |
| **Pinned focus** | Type what you want to see. Items that are not close to that text are covered. |
| **On-device scoring** | A bundled MiniLM model runs locally. No account. No analytics. No phone-home. |
| **Click to reveal** | One click uncovers a single item until you reload. |
| **History** | See titles and links the filters hid, then open or clear them. |

This is a standalone browser extension. It does not sync filters, upload page content, or talk to any Dialogues product.

---

## Install from GitHub

```bash
git clone https://github.com/dialoguesai/content-cover-extension.git
cd content-cover-extension
```

Load the unpacked folder in Chromium:

### Chrome

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the cloned folder (the directory that contains `manifest.json`)

Pin the extension if you want the icon always visible.

### Arc

1. Open **Extensions** → **Manage extensions**, or go to `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select the cloned folder

### Edge

Same steps at `edge://extensions`.

Reload the unpacked extension after updates.

> **Chrome Web Store:** A store listing may use a fixed extension ID; install steps will match the store page when published.

---

## Use

1. Open any [supported site](#supported-sites).
2. Click the extension icon and set filters:
   - **Don’t show** — hide items whose title or text matches, or is similar to, your phrases. Add a phrase, then set how strict the match should be.
   - **Pinned focus** — type what you want to see, then click **Filter**. Items that are not close to that text are covered.
3. Click a grey block once to uncover that item for the rest of the page visit.
4. Right-click a visible post and choose **Hide this kind of thing** to add its title to Don’t show.
5. Open the **History** tab to see titles and links the filters hid. Click a row to open it; **Clear** empties the log.
6. Open the **Sites** tab to see every host the filter can cover.

If every filter is off, a toast says you are reading with full exposure to that site.

---

## How it works

```text
  Page cards  →  Site adapter  →  Local MiniLM score  →  Grey cover (or leave visible)
```

1. A site adapter finds posts and headlines on the current page.
2. The background worker scores title and text against your Don’t-show phrases and pinned-focus text.
3. Matching items get a grey overlay. You can uncover one item with a click.
4. Covered titles and links are stored in extension history until you clear them.

Scoring uses [Transformers.js](https://github.com/huggingface/transformers.js) and a quantized [all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2) model bundled in this repository. Chrome extensions cannot load scripts from a CDN, so the model and ONNX Runtime WASM live in `vendor/` and `models/`.

---

## Supported sites

The filter engine is the same everywhere. Each site has an adapter that only answers “what is a post or headline on this page?” YouTube, Instagram, and The New York Times use specialized adapters. Other social networks have their own adapters. Newsrooms share a generic article/teaser adapter.

<!-- supported-sites:start -->
Content Cover works on **181 sites**: 11 social networks, 4 video sites, 148 newsrooms, 5 search and aggregators, 1 newsletter, 6 forums, 3 sports and finance sites, 2 marketplaces, 1 work feed.

### Social

- **Instagram** (`www.instagram.com`)
- **X** (`www.x.com`)
- **Facebook** (`www.facebook.com`)
- **Reddit** (`www.reddit.com`)
- **LinkedIn** (`www.linkedin.com`)
- **TikTok** (`www.tiktok.com`)
- **Threads** (`www.threads.net`)
- **Bluesky** (`bsky.app`)
- **Pinterest** (`www.pinterest.com`)
- **Tumblr** (`www.tumblr.com`)
- **Truth Social** (`www.truthsocial.com`)

### Video

- **YouTube** (`www.youtube.com`)
- **Twitch** (`www.twitch.tv`)
- **Rumble** (`www.rumble.com`)
- **Vimeo** (`www.vimeo.com`)

### News

- **The New York Times** (`www.nytimes.com`)
- **The Washington Post** (`www.washingtonpost.com`)
- **The Wall Street Journal** (`www.wsj.com`)
- **USA Today** (`www.usatoday.com`)
- **Los Angeles Times** (`www.latimes.com`)
- **Chicago Tribune** (`www.chicagotribune.com`)
- **The Boston Globe** (`www.bostonglobe.com`)
- **New York Post** (`www.nypost.com`)
- **CNN** (`www.cnn.com`)
- **Fox News** (`www.foxnews.com`)
- **NBC News** (`www.nbcnews.com`)
- **ABC News** (`abcnews.go.com`)
- **CBS News** (`www.cbsnews.com`)
- **MSNBC** (`www.msnbc.com`)
- **NPR** (`www.npr.org`)
- **PBS News** (`www.pbs.org`)
- **Politico** (`www.politico.com`)
- **The Hill** (`www.thehill.com`)
- **Axios** (`www.axios.com`)
- **The Atlantic** (`www.theatlantic.com`)
- **The New Yorker** (`www.newyorker.com`)
- **Time** (`time.com`)
- **Newsweek** (`www.newsweek.com`)
- **HuffPost** (`www.huffpost.com`)
- **Vox** (`www.vox.com`)
- **Slate** (`slate.com`)
- **Salon** (`www.salon.com`)
- **The Intercept** (`theintercept.com`)
- **ProPublica** (`www.propublica.org`)
- **The Daily Beast** (`www.thedailybeast.com`)
- **Mother Jones** (`www.motherjones.com`)
- **The Nation** (`www.thenation.com`)
- **Reason** (`reason.com`)
- **National Review** (`www.nationalreview.com`)
- **The Daily Wire** (`www.dailywire.com`)
- **Breitbart** (`www.breitbart.com`)
- **Newsmax** (`www.newsmax.com`)
- **AP News** (`apnews.com`)
- **Reuters** (`www.reuters.com`)
- **Bloomberg** (`www.bloomberg.com`)
- **Business Insider** (`www.businessinsider.com`)
- **Forbes** (`www.forbes.com`)
- **Fortune** (`fortune.com`)
- **CNBC** (`www.cnbc.com`)
- **MarketWatch** (`www.marketwatch.com`)
- **Yahoo News** (`news.yahoo.com`)
- **Google News** (`news.google.com`)
- **MSN** (`www.msn.com`)
- **The Christian Science Monitor** (`www.csmonitor.com`)
- **San Francisco Chronicle** (`www.sfchronicle.com`)
- **Miami Herald** (`www.miamiherald.com`)
- **Houston Chronicle** (`www.houstonchronicle.com`)
- **The Seattle Times** (`www.seattletimes.com`)
- **The Denver Post** (`www.denverpost.com`)
- **The Atlanta Journal-Constitution** (`www.ajc.com`)
- **Star Tribune** (`www.startribune.com`)
- **The Philadelphia Inquirer** (`www.inquirer.com`)
- **The Dallas Morning News** (`www.dallasnews.com`)
- **Wired** (`www.wired.com`)
- **The Verge** (`www.theverge.com`)
- **TechCrunch** (`techcrunch.com`)
- **Ars Technica** (`arstechnica.com`)
- **CNET** (`www.cnet.com`)
- **Engadget** (`www.engadget.com`)
- **Vice** (`www.vice.com`)
- **Rolling Stone** (`www.rollingstone.com`)
- **ESPN** (`www.espn.com`)
- **BBC News** (`www.bbc.com`)
- **The Guardian** (`www.theguardian.com`)
- **The Telegraph** (`www.telegraph.co.uk`)
- **The Independent** (`www.independent.co.uk`)
- **The Times** (`www.thetimes.com`)
- **Financial Times** (`www.ft.com`)
- **The Economist** (`www.economist.com`)
- **Sky News** (`news.sky.com`)
- **Daily Mail** (`www.dailymail.co.uk`)
- **Daily Mirror** (`www.mirror.co.uk`)
- **Evening Standard** (`www.standard.co.uk`)
- **The Irish Times** (`www.irishtimes.com`)
- **RTÉ** (`www.rte.ie`)
- **CBC News** (`www.cbc.ca`)
- **The Globe and Mail** (`www.theglobeandmail.com`)
- **Toronto Star** (`www.thestar.com`)
- **National Post** (`www.nationalpost.com`)
- **ABC News Australia** (`www.abc.net.au`)
- **The Sydney Morning Herald** (`www.smh.com.au`)
- **The Age** (`www.theage.com.au`)
- **news.com.au** (`www.news.com.au`)
- **Australian Financial Review** (`www.afr.com`)
- **NZ Herald** (`www.nzherald.co.nz`)
- **Al Jazeera** (`www.aljazeera.com`)
- **DW** (`www.dw.com`)
- **France 24** (`www.france24.com`)
- **Le Monde** (`www.lemonde.fr`)
- **El País** (`www.elpais.com`)
- **Der Spiegel** (`www.spiegel.de`)
- **Die Zeit** (`www.zeit.de`)
- **South China Morning Post** (`www.scmp.com`)
- **The Japan Times** (`www.japantimes.co.jp`)
- **NHK World** (`www3.nhk.or.jp`)
- **The Straits Times** (`www.straitstimes.com`)
- **The Times of India** (`timesofindia.indiatimes.com`)
- **Hindustan Times** (`www.hindustantimes.com`)
- **The Indian Express** (`www.indianexpress.com`)
- **The Hindu** (`www.thehindu.com`)
- **NDTV** (`www.ndtv.com`)
- **Haaretz** (`www.haaretz.com`)
- **The Times of Israel** (`www.timesofisrael.com`)
- **The Jerusalem Post** (`www.jpost.com`)
- **Semafor** (`www.semafor.com`)
- **The Dispatch** (`thedispatch.com`)
- **Foreign Policy** (`foreignpolicy.com`)
- **Foreign Affairs** (`www.foreignaffairs.com`)
- **STAT** (`www.statnews.com`)
- **KFF Health News** (`kffhealthnews.org`)
- **Scientific American** (`www.scientificamerican.com`)
- **National Geographic** (`www.nationalgeographic.com`)
- **PolitiFact** (`www.politifact.com`)
- **FactCheck.org** (`www.factcheck.org`)
- **Variety** (`variety.com`)
- **Deadline** (`deadline.com`)
- **The Hollywood Reporter** (`www.hollywoodreporter.com`)
- **The Conversation** (`theconversation.com`)
- **New Statesman** (`www.newstatesman.com`)
- **The Spectator** (`www.spectator.co.uk`)
- **The Sun** (`www.thesun.co.uk`)
- **Metro** (`metro.co.uk`)
- **Daily Express** (`www.express.co.uk`)
- **Channel 4 News** (`www.channel4.com`)
- **ITV News** (`www.itv.com`)
- **CNA** (`www.channelnewsasia.com`)
- **Radio Free Europe** (`www.rferl.org`)
- **Voice of America** (`www.voanews.com`)
- **The Kyiv Independent** (`www.kyivindependent.com`)
- **Meduza** (`meduza.io`)
- **Middle East Eye** (`www.middleeasteye.net`)
- **Al-Monitor** (`www.al-monitor.com`)
- **Arab News** (`www.arabnews.com`)
- **Dawn** (`www.dawn.com`)
- **Bangkok Post** (`www.bangkokpost.com`)
- **The Jakarta Post** (`www.thejakartapost.com`)
- **The Korea Herald** (`www.koreaherald.com`)
- **The Korea Times** (`www.koreatimes.co.kr`)
- **Stuff** (`www.stuff.co.nz`)
- **RNZ** (`www.rnz.co.nz`)
- **The Australian** (`www.theaustralian.com.au`)
- **Maclean's** (`www.macleans.ca`)
- **UnHerd** (`unherd.com`)

### Search

- **Google Search** (`www.google.com`)
- **Bing** (`www.bing.com`)
- **DuckDuckGo** (`duckduckgo.com`)
- **Flipboard** (`www.flipboard.com`)
- **Ground News** (`ground.news`)

### Newsletters

- **Substack** (`www.substack.com`)

### Forums

- **Hacker News** (`news.ycombinator.com`)
- **Stack Overflow** (`www.stackoverflow.com`)
- **Nextdoor** (`www.nextdoor.com`)
- **Discord** (`www.discord.com`)
- **Mastodon** (`mastodon.social`)
- **Lemmy** (`lemmy.world`)

### Sports & finance

- **Bleacher Report** (`www.bleacherreport.com`)
- **Yahoo Finance** (`finance.yahoo.com`)
- **Seeking Alpha** (`www.seekingalpha.com`)

### Shopping

- **Amazon** (`www.amazon.com`)
- **eBay** (`www.ebay.com`)

### Work

- **GitHub** (`github.com`)
<!-- supported-sites:end -->

The news list is major national and international newsrooms, not every local paper. Open an issue if you want a site added.

Search adapters cover result cards only, not the search box. Shopping adapters cover product tiles, not a product-page body. GitHub covers the home/dashboard feed, not file viewers, pull requests, or code. Discord channel messages are best-effort: the web app is login-walled and uses shifting class names. Direct messages are skipped.

Site layouts change. If covers miss cards after a redesign, the selectors in `sites.js` are the place to update. Hosts and display names live in `catalog.js` — keep `manifest.json` and this list in sync with:

```bash
node scripts/sync-public-docs.mjs
```

---

## Other sites we may support

Nothing in this section is covered today. Mail, DMs, documents, and banking stay out of scope.

- **Long-form and newsletters** — Medium (`medium.com`), Ghost (`*.ghost.io` and publisher hosts), Beehiiv (`www.beehiiv.com`). Substack already ships, including `*.substack.com` publication hosts.
- **Forums and link boards** — Lobsters (`lobste.rs`), Discourse forums (for example `meta.discourse.org`). Hacker News, Stack Overflow, Lemmy (`lemmy.world`), Mastodon (`mastodon.social`), Nextdoor, and Discord already ship.
- **More video** — Dailymotion (`www.dailymotion.com`). YouTube, Twitch, Rumble, and Vimeo already ship. Subscription entertainment catalogs such as Netflix or Hulu would be optional at most, not a goal.
- **Sports and finance terminals** — CBS Sports (`www.cbssports.com`). ESPN is in the news list; Bleacher Report, Yahoo Finance, and Seeking Alpha already ship.
- **Shopping and marketplaces** — Etsy (`www.etsy.com`), Facebook Marketplace (`www.facebook.com/marketplace`). Amazon and eBay already ship.
- **Work feeds** — Slack and Microsoft Teams activity, Notion home (`www.notion.so`). GitHub’s dashboard feed already ships.

---

## Privacy

- Filters, history, and model progress stay in `chrome.storage` on this device.
- The extension does not need an account and does not phone home.
- The content security policy is `script-src 'self' 'wasm-unsafe-eval'` with `connect-src 'self'`. The local model never fetches weights from Hugging Face.
- Uncovered items stay revealed until you reload the page.
- The extension does not cover video players, comments, article bodies, Instagram stories, or DMs.
- Don’t-show fails open if the local model is still loading (items stay visible unless a keyword matched). Pinned focus fails closed for unmatched items until a score is ready.

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Nothing is covered | Turn on **Don’t show** with at least one phrase, or **Pinned focus** with text, then reload the page. |
| Model stuck on “starting” | Wait for the first-use progress bar. If it fails, reload the extension and reopen the popup. |
| Covers miss cards after a site redesign | Update selectors in `sites.js`, then reload the extension and the tab. |
| History is empty | History only records items the filter hid. Clear it from the **History** tab. |
| Debug logging | `chrome://extensions` → **Content Cover** → **Service worker** → Console. |

---

## For developers

| Item | Value |
|------|--------|
| Manifest | V3 |
| Filter engine | `filter.js` |
| Site catalog | `catalog.js` |
| Site adapters | `sites.js` |
| Local model | `offscreen.js` + `models/Xenova/all-MiniLM-L6-v2/` |
| Vendored runtime | `vendor/transformers.js` and ONNX Runtime WASM |

To add a site: add it to `catalog.js`, write or reuse an adapter in `sites.js`, then run `node scripts/sync-public-docs.mjs` so `manifest.json` and this README stay in sync.

---

## License

Copyright 2026 Dialogues and contributors.

Licensed under the [Apache License, Version 2.0](LICENSE).

Third-party notices for the bundled model and runtime are in [NOTICE](NOTICE).

---

## Version

**1.4.3** — Content Cover (Manifest V3)
