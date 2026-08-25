importScripts("catalog.js");

let creatingOffscreen = null;

const SITE_PATTERNS = ContentCoverCatalog.matchPatterns();

chrome.runtime.onInstalled.addListener(() => {
  ensureContextMenu();
  ensureOffscreen().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  ensureContextMenu();
  ensureOffscreen().catch(() => {});
});

ensureContextMenu();

function ensureContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "cc-hide-this-kind",
      title: "Hide this kind of thing",
      contexts: ["all"],
      documentUrlPatterns: SITE_PATTERNS,
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "cc-hide-this-kind" || !tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "hideThisKind" });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.target !== "background") return undefined;

  if (message.type === "score") {
    ensureOffscreen()
      .then(() =>
        chrome.runtime.sendMessage({
          target: "offscreen",
          type: "score",
          text: message.text,
          dontShow: message.dontShow,
          focusText: message.focusText,
        })
      )
      .then((result) => sendResponse(result || { ok: false }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === "modelProgress") {
    const payload = message.payload || { status: "starting", percent: 0, loaded: 0, total: 0, file: "" };
    chrome.storage.local.set({ modelProgress: payload });
    sendResponse({ ok: true });
    return undefined;
  }

  if (message.type === "modelStatus") {
    ensureOffscreen()
      .then(() => chrome.runtime.sendMessage({ target: "offscreen", type: "status" }))
      .then((result) => sendResponse(result || { ready: false, status: "starting", percent: 0, loaded: 0, total: 0, file: "" }))
      .catch(() => sendResponse({ ready: false, status: "error", percent: 0, loaded: 0, total: 0, file: "" }));
    return true;
  }

  return undefined;
});

async function ensureOffscreen() {
  const existing = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL("offscreen.html")],
  });
  if (existing && existing.length) return;
  if (creatingOffscreen) return creatingOffscreen;
  creatingOffscreen = chrome.offscreen
    .createDocument({
      url: "offscreen.html",
      reasons: ["WORKERS"],
      justification: "Run a local text embedding model to score post titles.",
    })
    .catch((error) => {
      if (String(error && error.message).includes("single offscreen")) return;
      throw error;
    })
    .finally(() => {
      creatingOffscreen = null;
    });
  return creatingOffscreen;
}
