const ContentCoverCatalog = (() => {
  const SITES = [
    // Social
    { id: "instagram", name: "Instagram", kind: "social", adapter: "instagram", hosts: ["instagram.com", "www.instagram.com"] },
    { id: "x", name: "X", kind: "social", adapter: "x", hosts: ["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"] },
    { id: "facebook", name: "Facebook", kind: "social", adapter: "facebook", hosts: ["facebook.com", "www.facebook.com", "m.facebook.com"] },
    { id: "reddit", name: "Reddit", kind: "social", adapter: "reddit", hosts: ["reddit.com", "www.reddit.com", "old.reddit.com", "sh.reddit.com", "new.reddit.com"] },
    { id: "linkedin", name: "LinkedIn", kind: "social", adapter: "linkedin", hosts: ["linkedin.com", "www.linkedin.com"] },
    { id: "tiktok", name: "TikTok", kind: "social", adapter: "tiktok", hosts: ["tiktok.com", "www.tiktok.com"] },
    { id: "threads", name: "Threads", kind: "social", adapter: "threads", hosts: ["threads.net", "www.threads.net"] },
    { id: "bluesky", name: "Bluesky", kind: "social", adapter: "bluesky", hosts: ["bsky.app"] },
    { id: "pinterest", name: "Pinterest", kind: "social", adapter: "pinterest", hosts: ["pinterest.com", "www.pinterest.com"] },
    { id: "tumblr", name: "Tumblr", kind: "social", adapter: "tumblr", hosts: ["tumblr.com", "www.tumblr.com"] },
    { id: "truthsocial", name: "Truth Social", kind: "social", adapter: "truthsocial", hosts: ["truthsocial.com", "www.truthsocial.com"] },

    // Search & aggregators
    { id: "google", name: "Google Search", kind: "search", adapter: "google", hosts: ["google.com", "www.google.com"] },
    { id: "bing", name: "Bing", kind: "search", adapter: "bing", hosts: ["bing.com", "www.bing.com"] },
    { id: "duckduckgo", name: "DuckDuckGo", kind: "search", adapter: "duckduckgo", hosts: ["duckduckgo.com"] },
    { id: "flipboard", name: "Flipboard", kind: "search", adapter: "flipboard", hosts: ["flipboard.com", "www.flipboard.com"] },
    { id: "groundnews", name: "Ground News", kind: "search", adapter: "groundnews", hosts: ["ground.news"] },

    // Newsletters
    {
      id: "substack",
      name: "Substack",
      kind: "newsletter",
      adapter: "substack",
      hosts: ["substack.com", "www.substack.com"],
      patterns: ["*://*.substack.com/*"],
    },

    // Forums & link boards
    { id: "hackernews", name: "Hacker News", kind: "forum", adapter: "hackernews", hosts: ["news.ycombinator.com"] },
    { id: "stackoverflow", name: "Stack Overflow", kind: "forum", adapter: "stackoverflow", hosts: ["stackoverflow.com", "www.stackoverflow.com"] },
    { id: "nextdoor", name: "Nextdoor", kind: "forum", adapter: "nextdoor", hosts: ["nextdoor.com", "www.nextdoor.com"] },
    { id: "discord", name: "Discord", kind: "forum", adapter: "discord", hosts: ["discord.com", "www.discord.com"] },
    { id: "mastodon", name: "Mastodon", kind: "forum", adapter: "mastodon", hosts: ["mastodon.social"] },
    { id: "lemmy", name: "Lemmy", kind: "forum", adapter: "lemmy", hosts: ["lemmy.world"] },

    // Video
    { id: "youtube", name: "YouTube", kind: "video", adapter: "youtube", hosts: ["youtube.com", "www.youtube.com", "m.youtube.com"] },
    { id: "twitch", name: "Twitch", kind: "video", adapter: "twitch", hosts: ["twitch.tv", "www.twitch.tv"] },
    { id: "rumble", name: "Rumble", kind: "video", adapter: "rumble", hosts: ["rumble.com", "www.rumble.com"] },
    { id: "vimeo", name: "Vimeo", kind: "video", adapter: "vimeo", hosts: ["vimeo.com", "www.vimeo.com"] },

    // Sports & finance
    { id: "bleacherreport", name: "Bleacher Report", kind: "markets", adapter: "bleacherreport", hosts: ["bleacherreport.com", "www.bleacherreport.com"] },
    { id: "yahoofinance", name: "Yahoo Finance", kind: "markets", adapter: "yahoofinance", hosts: ["finance.yahoo.com"] },
    { id: "seekingalpha", name: "Seeking Alpha", kind: "markets", adapter: "seekingalpha", hosts: ["seekingalpha.com", "www.seekingalpha.com"] },

    // Shopping
    { id: "amazon", name: "Amazon", kind: "commerce", adapter: "amazon", hosts: ["amazon.com", "www.amazon.com"] },
    { id: "ebay", name: "eBay", kind: "commerce", adapter: "ebay", hosts: ["ebay.com", "www.ebay.com"] },

    // Work feeds
    { id: "github", name: "GitHub", kind: "work", adapter: "github", hosts: ["github.com"] },

    // News — United States
    { id: "nyt", name: "The New York Times", kind: "news", adapter: "nyt", hosts: ["nytimes.com", "www.nytimes.com", "cooking.nytimes.com"] },
    { id: "wapo", name: "The Washington Post", kind: "news", adapter: "news", hosts: ["washingtonpost.com", "www.washingtonpost.com"] },
    { id: "wsj", name: "The Wall Street Journal", kind: "news", adapter: "news", hosts: ["wsj.com", "www.wsj.com"] },
    { id: "usatoday", name: "USA Today", kind: "news", adapter: "news", hosts: ["usatoday.com", "www.usatoday.com"] },
    { id: "latimes", name: "Los Angeles Times", kind: "news", adapter: "news", hosts: ["latimes.com", "www.latimes.com"] },
    { id: "chicagotribune", name: "Chicago Tribune", kind: "news", adapter: "news", hosts: ["chicagotribune.com", "www.chicagotribune.com"] },
    { id: "bostonglobe", name: "The Boston Globe", kind: "news", adapter: "news", hosts: ["bostonglobe.com", "www.bostonglobe.com"] },
    { id: "nypost", name: "New York Post", kind: "news", adapter: "news", hosts: ["nypost.com", "www.nypost.com"] },
    { id: "cnn", name: "CNN", kind: "news", adapter: "news", hosts: ["cnn.com", "www.cnn.com", "edition.cnn.com"] },
    { id: "foxnews", name: "Fox News", kind: "news", adapter: "news", hosts: ["foxnews.com", "www.foxnews.com"] },
    { id: "nbcnews", name: "NBC News", kind: "news", adapter: "news", hosts: ["nbcnews.com", "www.nbcnews.com"] },
    { id: "abcnews", name: "ABC News", kind: "news", adapter: "news", hosts: ["abcnews.go.com"] },
    { id: "cbsnews", name: "CBS News", kind: "news", adapter: "news", hosts: ["cbsnews.com", "www.cbsnews.com"] },
    { id: "msnbc", name: "MSNBC", kind: "news", adapter: "news", hosts: ["msnbc.com", "www.msnbc.com"] },
    { id: "npr", name: "NPR", kind: "news", adapter: "news", hosts: ["npr.org", "www.npr.org"] },
    { id: "pbs", name: "PBS News", kind: "news", adapter: "news", hosts: ["pbs.org", "www.pbs.org"] },
    { id: "politico", name: "Politico", kind: "news", adapter: "news", hosts: ["politico.com", "www.politico.com"] },
    { id: "thehill", name: "The Hill", kind: "news", adapter: "news", hosts: ["thehill.com", "www.thehill.com"] },
    { id: "axios", name: "Axios", kind: "news", adapter: "news", hosts: ["axios.com", "www.axios.com"] },
    { id: "theatlantic", name: "The Atlantic", kind: "news", adapter: "news", hosts: ["theatlantic.com", "www.theatlantic.com"] },
    { id: "newyorker", name: "The New Yorker", kind: "news", adapter: "news", hosts: ["newyorker.com", "www.newyorker.com"] },
    { id: "time", name: "Time", kind: "news", adapter: "news", hosts: ["time.com"] },
    { id: "newsweek", name: "Newsweek", kind: "news", adapter: "news", hosts: ["newsweek.com", "www.newsweek.com"] },
    { id: "huffpost", name: "HuffPost", kind: "news", adapter: "news", hosts: ["huffpost.com", "www.huffpost.com", "huffingtonpost.com", "www.huffingtonpost.com"] },
    { id: "vox", name: "Vox", kind: "news", adapter: "news", hosts: ["vox.com", "www.vox.com"] },
    { id: "slate", name: "Slate", kind: "news", adapter: "news", hosts: ["slate.com"] },
    { id: "salon", name: "Salon", kind: "news", adapter: "news", hosts: ["salon.com", "www.salon.com"] },
    { id: "theintercept", name: "The Intercept", kind: "news", adapter: "news", hosts: ["theintercept.com"] },
    { id: "propublica", name: "ProPublica", kind: "news", adapter: "news", hosts: ["propublica.org", "www.propublica.org"] },
    { id: "dailybeast", name: "The Daily Beast", kind: "news", adapter: "news", hosts: ["thedailybeast.com", "www.thedailybeast.com"] },
    { id: "motherjones", name: "Mother Jones", kind: "news", adapter: "news", hosts: ["motherjones.com", "www.motherjones.com"] },
    { id: "thenation", name: "The Nation", kind: "news", adapter: "news", hosts: ["thenation.com", "www.thenation.com"] },
    { id: "reason", name: "Reason", kind: "news", adapter: "news", hosts: ["reason.com"] },
    { id: "nationalreview", name: "National Review", kind: "news", adapter: "news", hosts: ["nationalreview.com", "www.nationalreview.com"] },
    { id: "dailywire", name: "The Daily Wire", kind: "news", adapter: "news", hosts: ["dailywire.com", "www.dailywire.com"] },
    { id: "breitbart", name: "Breitbart", kind: "news", adapter: "news", hosts: ["breitbart.com", "www.breitbart.com"] },
    { id: "newsmax", name: "Newsmax", kind: "news", adapter: "news", hosts: ["newsmax.com", "www.newsmax.com"] },
    { id: "apnews", name: "AP News", kind: "news", adapter: "news", hosts: ["apnews.com"] },
    { id: "reuters", name: "Reuters", kind: "news", adapter: "news", hosts: ["reuters.com", "www.reuters.com"] },
    { id: "bloomberg", name: "Bloomberg", kind: "news", adapter: "news", hosts: ["bloomberg.com", "www.bloomberg.com"] },
    { id: "businessinsider", name: "Business Insider", kind: "news", adapter: "news", hosts: ["businessinsider.com", "www.businessinsider.com"] },
    { id: "forbes", name: "Forbes", kind: "news", adapter: "news", hosts: ["forbes.com", "www.forbes.com"] },
    { id: "fortune", name: "Fortune", kind: "news", adapter: "news", hosts: ["fortune.com"] },
    { id: "cnbc", name: "CNBC", kind: "news", adapter: "news", hosts: ["cnbc.com", "www.cnbc.com"] },
    { id: "marketwatch", name: "MarketWatch", kind: "news", adapter: "news", hosts: ["marketwatch.com", "www.marketwatch.com"] },
    { id: "yahoonews", name: "Yahoo News", kind: "news", adapter: "news", hosts: ["news.yahoo.com"] },
    { id: "googlenews", name: "Google News", kind: "news", adapter: "news", hosts: ["news.google.com"] },
    { id: "msn", name: "MSN", kind: "news", adapter: "news", hosts: ["msn.com", "www.msn.com"] },
    { id: "csmonitor", name: "The Christian Science Monitor", kind: "news", adapter: "news", hosts: ["csmonitor.com", "www.csmonitor.com"] },
    { id: "sfchronicle", name: "San Francisco Chronicle", kind: "news", adapter: "news", hosts: ["sfchronicle.com", "www.sfchronicle.com"] },
    { id: "miamiherald", name: "Miami Herald", kind: "news", adapter: "news", hosts: ["miamiherald.com", "www.miamiherald.com"] },
    { id: "houstonchronicle", name: "Houston Chronicle", kind: "news", adapter: "news", hosts: ["houstonchronicle.com", "www.houstonchronicle.com"] },
    { id: "seattletimes", name: "The Seattle Times", kind: "news", adapter: "news", hosts: ["seattletimes.com", "www.seattletimes.com"] },
    { id: "denverpost", name: "The Denver Post", kind: "news", adapter: "news", hosts: ["denverpost.com", "www.denverpost.com"] },
    { id: "ajc", name: "The Atlanta Journal-Constitution", kind: "news", adapter: "news", hosts: ["ajc.com", "www.ajc.com"] },
    { id: "startribune", name: "Star Tribune", kind: "news", adapter: "news", hosts: ["startribune.com", "www.startribune.com"] },
    { id: "inquirer", name: "The Philadelphia Inquirer", kind: "news", adapter: "news", hosts: ["inquirer.com", "www.inquirer.com"] },
    { id: "dallasnews", name: "The Dallas Morning News", kind: "news", adapter: "news", hosts: ["dallasnews.com", "www.dallasnews.com"] },
    { id: "wired", name: "Wired", kind: "news", adapter: "news", hosts: ["wired.com", "www.wired.com"] },
    { id: "theverge", name: "The Verge", kind: "news", adapter: "news", hosts: ["theverge.com", "www.theverge.com"] },
    { id: "techcrunch", name: "TechCrunch", kind: "news", adapter: "news", hosts: ["techcrunch.com"] },
    { id: "arstechnica", name: "Ars Technica", kind: "news", adapter: "news", hosts: ["arstechnica.com"] },
    { id: "cnet", name: "CNET", kind: "news", adapter: "news", hosts: ["cnet.com", "www.cnet.com"] },
    { id: "engadget", name: "Engadget", kind: "news", adapter: "news", hosts: ["engadget.com", "www.engadget.com"] },
    { id: "vice", name: "Vice", kind: "news", adapter: "news", hosts: ["vice.com", "www.vice.com"] },
    { id: "rollingstone", name: "Rolling Stone", kind: "news", adapter: "news", hosts: ["rollingstone.com", "www.rollingstone.com"] },
    { id: "espn", name: "ESPN", kind: "news", adapter: "news", hosts: ["espn.com", "www.espn.com"] },

    // News — United Kingdom & Ireland
    { id: "bbc", name: "BBC News", kind: "news", adapter: "news", hosts: ["bbc.com", "www.bbc.com", "bbc.co.uk", "www.bbc.co.uk"] },
    { id: "guardian", name: "The Guardian", kind: "news", adapter: "news", hosts: ["theguardian.com", "www.theguardian.com"] },
    { id: "telegraph", name: "The Telegraph", kind: "news", adapter: "news", hosts: ["telegraph.co.uk", "www.telegraph.co.uk"] },
    { id: "independent", name: "The Independent", kind: "news", adapter: "news", hosts: ["independent.co.uk", "www.independent.co.uk"] },
    { id: "thetimes", name: "The Times", kind: "news", adapter: "news", hosts: ["thetimes.com", "www.thetimes.com", "thetimes.co.uk", "www.thetimes.co.uk"] },
    { id: "ft", name: "Financial Times", kind: "news", adapter: "news", hosts: ["ft.com", "www.ft.com"] },
    { id: "economist", name: "The Economist", kind: "news", adapter: "news", hosts: ["economist.com", "www.economist.com"] },
    { id: "skynews", name: "Sky News", kind: "news", adapter: "news", hosts: ["news.sky.com", "sky.com"] },
    { id: "dailymail", name: "Daily Mail", kind: "news", adapter: "news", hosts: ["dailymail.co.uk", "www.dailymail.co.uk"] },
    { id: "mirror", name: "Daily Mirror", kind: "news", adapter: "news", hosts: ["mirror.co.uk", "www.mirror.co.uk"] },
    { id: "standard", name: "Evening Standard", kind: "news", adapter: "news", hosts: ["standard.co.uk", "www.standard.co.uk"] },
    { id: "irishtimes", name: "The Irish Times", kind: "news", adapter: "news", hosts: ["irishtimes.com", "www.irishtimes.com"] },
    { id: "rte", name: "RTÉ", kind: "news", adapter: "news", hosts: ["rte.ie", "www.rte.ie"] },

    // News — Canada, Australia, New Zealand
    { id: "cbc", name: "CBC News", kind: "news", adapter: "news", hosts: ["cbc.ca", "www.cbc.ca"] },
    { id: "globemail", name: "The Globe and Mail", kind: "news", adapter: "news", hosts: ["theglobeandmail.com", "www.theglobeandmail.com"] },
    { id: "torontostar", name: "Toronto Star", kind: "news", adapter: "news", hosts: ["thestar.com", "www.thestar.com"] },
    { id: "nationalpost", name: "National Post", kind: "news", adapter: "news", hosts: ["nationalpost.com", "www.nationalpost.com"] },
    { id: "abcau", name: "ABC News Australia", kind: "news", adapter: "news", hosts: ["abc.net.au", "www.abc.net.au"] },
    { id: "smh", name: "The Sydney Morning Herald", kind: "news", adapter: "news", hosts: ["smh.com.au", "www.smh.com.au"] },
    { id: "theage", name: "The Age", kind: "news", adapter: "news", hosts: ["theage.com.au", "www.theage.com.au"] },
    { id: "newsau", name: "news.com.au", kind: "news", adapter: "news", hosts: ["news.com.au", "www.news.com.au"] },
    { id: "afr", name: "Australian Financial Review", kind: "news", adapter: "news", hosts: ["afr.com", "www.afr.com"] },
    { id: "nzherald", name: "NZ Herald", kind: "news", adapter: "news", hosts: ["nzherald.co.nz", "www.nzherald.co.nz"] },

    // News — International
    { id: "aljazeera", name: "Al Jazeera", kind: "news", adapter: "news", hosts: ["aljazeera.com", "www.aljazeera.com"] },
    { id: "dw", name: "DW", kind: "news", adapter: "news", hosts: ["dw.com", "www.dw.com"] },
    { id: "france24", name: "France 24", kind: "news", adapter: "news", hosts: ["france24.com", "www.france24.com"] },
    { id: "lemonde", name: "Le Monde", kind: "news", adapter: "news", hosts: ["lemonde.fr", "www.lemonde.fr"] },
    { id: "elpais", name: "El País", kind: "news", adapter: "news", hosts: ["elpais.com", "www.elpais.com"] },
    { id: "spiegel", name: "Der Spiegel", kind: "news", adapter: "news", hosts: ["spiegel.de", "www.spiegel.de"] },
    { id: "zeit", name: "Die Zeit", kind: "news", adapter: "news", hosts: ["zeit.de", "www.zeit.de"] },
    { id: "scmp", name: "South China Morning Post", kind: "news", adapter: "news", hosts: ["scmp.com", "www.scmp.com"] },
    { id: "japantimes", name: "The Japan Times", kind: "news", adapter: "news", hosts: ["japantimes.co.jp", "www.japantimes.co.jp"] },
    { id: "nhk", name: "NHK World", kind: "news", adapter: "news", hosts: ["www3.nhk.or.jp"] },
    { id: "straitstimes", name: "The Straits Times", kind: "news", adapter: "news", hosts: ["straitstimes.com", "www.straitstimes.com"] },
    { id: "timesofindia", name: "The Times of India", kind: "news", adapter: "news", hosts: ["timesofindia.indiatimes.com"] },
    { id: "hindustantimes", name: "Hindustan Times", kind: "news", adapter: "news", hosts: ["hindustantimes.com", "www.hindustantimes.com"] },
    { id: "indianexpress", name: "The Indian Express", kind: "news", adapter: "news", hosts: ["indianexpress.com", "www.indianexpress.com"] },
    { id: "thehindu", name: "The Hindu", kind: "news", adapter: "news", hosts: ["thehindu.com", "www.thehindu.com"] },
    { id: "ndtv", name: "NDTV", kind: "news", adapter: "news", hosts: ["ndtv.com", "www.ndtv.com"] },
    { id: "haaretz", name: "Haaretz", kind: "news", adapter: "news", hosts: ["haaretz.com", "www.haaretz.com"] },
    { id: "timesofisrael", name: "The Times of Israel", kind: "news", adapter: "news", hosts: ["timesofisrael.com", "www.timesofisrael.com"] },
    { id: "jpost", name: "The Jerusalem Post", kind: "news", adapter: "news", hosts: ["jpost.com", "www.jpost.com"] },
    { id: "semafor", name: "Semafor", kind: "news", adapter: "news", hosts: ["semafor.com", "www.semafor.com"] },
    { id: "thedispatch", name: "The Dispatch", kind: "news", adapter: "news", hosts: ["thedispatch.com"] },
    { id: "foreignpolicy", name: "Foreign Policy", kind: "news", adapter: "news", hosts: ["foreignpolicy.com"] },
    { id: "foreignaffairs", name: "Foreign Affairs", kind: "news", adapter: "news", hosts: ["foreignaffairs.com", "www.foreignaffairs.com"] },
    { id: "statnews", name: "STAT", kind: "news", adapter: "news", hosts: ["statnews.com", "www.statnews.com"] },
    { id: "kffhealth", name: "KFF Health News", kind: "news", adapter: "news", hosts: ["kffhealthnews.org"] },
    { id: "scientificamerican", name: "Scientific American", kind: "news", adapter: "news", hosts: ["scientificamerican.com", "www.scientificamerican.com"] },
    { id: "nationalgeographic", name: "National Geographic", kind: "news", adapter: "news", hosts: ["nationalgeographic.com", "www.nationalgeographic.com"] },
    { id: "politifact", name: "PolitiFact", kind: "news", adapter: "news", hosts: ["politifact.com", "www.politifact.com"] },
    { id: "factcheck", name: "FactCheck.org", kind: "news", adapter: "news", hosts: ["factcheck.org", "www.factcheck.org"] },
    { id: "variety", name: "Variety", kind: "news", adapter: "news", hosts: ["variety.com"] },
    { id: "deadline", name: "Deadline", kind: "news", adapter: "news", hosts: ["deadline.com"] },
    { id: "hollywoodreporter", name: "The Hollywood Reporter", kind: "news", adapter: "news", hosts: ["hollywoodreporter.com", "www.hollywoodreporter.com"] },
    { id: "theconversation", name: "The Conversation", kind: "news", adapter: "news", hosts: ["theconversation.com"] },
    { id: "newstatesman", name: "New Statesman", kind: "news", adapter: "news", hosts: ["newstatesman.com", "www.newstatesman.com"] },
    { id: "spectator", name: "The Spectator", kind: "news", adapter: "news", hosts: ["spectator.co.uk", "www.spectator.co.uk"] },
    { id: "thesun", name: "The Sun", kind: "news", adapter: "news", hosts: ["thesun.co.uk", "www.thesun.co.uk"] },
    { id: "metrouk", name: "Metro", kind: "news", adapter: "news", hosts: ["metro.co.uk"] },
    { id: "express", name: "Daily Express", kind: "news", adapter: "news", hosts: ["express.co.uk", "www.express.co.uk"] },
    { id: "channel4", name: "Channel 4 News", kind: "news", adapter: "news", hosts: ["channel4.com", "www.channel4.com"] },
    { id: "itv", name: "ITV News", kind: "news", adapter: "news", hosts: ["itv.com", "www.itv.com"] },
    { id: "channelnewsasia", name: "CNA", kind: "news", adapter: "news", hosts: ["channelnewsasia.com", "www.channelnewsasia.com"] },
    { id: "rferl", name: "Radio Free Europe", kind: "news", adapter: "news", hosts: ["rferl.org", "www.rferl.org"] },
    { id: "voanews", name: "Voice of America", kind: "news", adapter: "news", hosts: ["voanews.com", "www.voanews.com"] },
    { id: "kyivindependent", name: "The Kyiv Independent", kind: "news", adapter: "news", hosts: ["kyivindependent.com", "www.kyivindependent.com"] },
    { id: "meduza", name: "Meduza", kind: "news", adapter: "news", hosts: ["meduza.io"] },
    { id: "middleeasteye", name: "Middle East Eye", kind: "news", adapter: "news", hosts: ["middleeasteye.net", "www.middleeasteye.net"] },
    { id: "almonitor", name: "Al-Monitor", kind: "news", adapter: "news", hosts: ["al-monitor.com", "www.al-monitor.com"] },
    { id: "arabnews", name: "Arab News", kind: "news", adapter: "news", hosts: ["arabnews.com", "www.arabnews.com"] },
    { id: "dawn", name: "Dawn", kind: "news", adapter: "news", hosts: ["dawn.com", "www.dawn.com"] },
    { id: "bangkokpost", name: "Bangkok Post", kind: "news", adapter: "news", hosts: ["bangkokpost.com", "www.bangkokpost.com"] },
    { id: "jakartapost", name: "The Jakarta Post", kind: "news", adapter: "news", hosts: ["thejakartapost.com", "www.thejakartapost.com"] },
    { id: "koreaherald", name: "The Korea Herald", kind: "news", adapter: "news", hosts: ["koreaherald.com", "www.koreaherald.com"] },
    { id: "koreatimes", name: "The Korea Times", kind: "news", adapter: "news", hosts: ["koreatimes.co.kr", "www.koreatimes.co.kr"] },
    { id: "stuffnz", name: "Stuff", kind: "news", adapter: "news", hosts: ["stuff.co.nz", "www.stuff.co.nz"] },
    { id: "rnz", name: "RNZ", kind: "news", adapter: "news", hosts: ["rnz.co.nz", "www.rnz.co.nz"] },
    { id: "theaustralian", name: "The Australian", kind: "news", adapter: "news", hosts: ["theaustralian.com.au", "www.theaustralian.com.au"] },
    { id: "macleans", name: "Maclean's", kind: "news", adapter: "news", hosts: ["macleans.ca", "www.macleans.ca"] },
    { id: "unherd", name: "UnHerd", kind: "news", adapter: "news", hosts: ["unherd.com"] },
  ];

  function bareHost(host) {
    return String(host || "")
      .toLowerCase()
      .replace(/^www\./, "");
  }

  function forHost(hostname) {
    const host = bareHost(hostname);
    if (/^(mail|docs|drive|calendar|meet|photos|translate)\.google\.com$/.test(host)) return null;
    let best = null;
    let bestLen = 0;
    for (const site of SITES) {
      for (const candidate of site.hosts) {
        const bare = bareHost(candidate);
        if (host === bare || host.endsWith(`.${bare}`)) {
          if (bare.length >= bestLen) {
            best = site;
            bestLen = bare.length;
          }
        }
      }
    }
    return best;
  }

  function matchPatterns() {
    const patterns = [];
    const seen = new Set();
    for (const site of SITES) {
      for (const host of site.hosts) {
        const pattern = `*://${host}/*`;
        if (seen.has(pattern)) continue;
        seen.add(pattern);
        patterns.push(pattern);
      }
      if (site.patterns) {
        for (const pattern of site.patterns) {
          if (seen.has(pattern)) continue;
          seen.add(pattern);
          patterns.push(pattern);
        }
      }
    }
    return patterns;
  }

  function byKind(kind) {
    return SITES.filter((site) => site.kind === kind);
  }

  function publicHost(site) {
    return site.hosts.find((host) => host.startsWith("www.")) || site.hosts[0];
  }

  const KIND_ORDER = ["social", "video", "news", "search", "newsletter", "forum", "markets", "commerce", "work"];
  const KIND_HEADING = {
    social: "Social",
    news: "News",
    search: "Search",
    newsletter: "Newsletters",
    forum: "Forums",
    video: "Video",
    markets: "Sports & finance",
    commerce: "Shopping",
    work: "Work",
  };
  const KIND_NOUN = {
    social: ["social network", "social networks"],
    news: ["newsroom", "newsrooms"],
    search: ["search and aggregator", "search and aggregators"],
    newsletter: ["newsletter", "newsletters"],
    forum: ["forum", "forums"],
    video: ["video site", "video sites"],
    markets: ["sports and finance site", "sports and finance sites"],
    commerce: ["marketplace", "marketplaces"],
    work: ["work feed", "work feeds"],
  };

  function toReadmeMarkdown() {
    const line = (site) => `- **${site.name}** (\`${publicHost(site)}\`)`;
    const chunks = [];
    const counts = [];
    for (const kind of KIND_ORDER) {
      const sites = byKind(kind);
      if (!sites.length) continue;
      counts.push(`${sites.length} ${KIND_NOUN[kind][sites.length === 1 ? 0 : 1]}`);
      chunks.push(`### ${KIND_HEADING[kind]}\n\n${sites.map(line).join("\n")}`);
    }
    return {
      socialCount: byKind("social").length,
      newsCount: byKind("news").length,
      totalCount: SITES.length,
      summary: `Content Cover works on **${SITES.length} sites**: ${counts.join(", ")}.`,
      body: chunks.join("\n\n"),
    };
  }

  return { SITES, forHost, matchPatterns, byKind, publicHost, KIND_ORDER, KIND_HEADING, toReadmeMarkdown };
})();
