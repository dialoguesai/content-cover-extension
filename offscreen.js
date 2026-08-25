import { env, pipeline } from "./vendor/transformers.js";

const localRoot = chrome.runtime.getURL("models/");
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.useBrowserCache = true;
env.localModelPath = localRoot.endsWith("/") ? localRoot : `${localRoot}/`;
env.backends.onnx.wasm.proxy = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL("vendor/");

let extractor = null;
let extractorPromise = null;
let status = "downloading";
const phraseCache = new Map();
let progress = { status: "downloading", percent: 0, loaded: 0, total: 0, file: "" };

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.target !== "offscreen") return undefined;

  if (message.type === "status") {
    sendResponse(statusPayload());
    return undefined;
  }

  if (message.type === "score") {
    score(message)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: String(error && error.message) }));
    return true;
  }

  return undefined;
});

function getExtractor() {
  if (extractor) return Promise.resolve(extractor);
  if (extractorPromise) return extractorPromise;

  status = "downloading";
  publishProgress();
  extractorPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    quantized: true,
    local_files_only: true,
  })
    .then((model) => {
      extractor = model;
      status = "ready";
      progress = {
        status: "ready",
        percent: 100,
        loaded: progress.total || 1,
        total: progress.total || 1,
        file: "",
      };
      publishProgress();
      return extractor;
    })
    .catch((error) => {
      extractorPromise = null;
      status = "error";
      progress = {
        status: "error",
        percent: progress.percent,
        loaded: progress.loaded,
        total: progress.total,
        file: "",
      };
      publishProgress();
      throw error;
    });

  return extractorPromise;
}

function statusPayload() {
  return {
    ready: status === "ready",
    status,
    percent: progress.percent,
    loaded: progress.loaded,
    total: progress.total,
    file: progress.file,
  };
}

function publishProgress() {
  try {
    chrome.runtime.sendMessage({ target: "background", type: "modelProgress", payload: statusPayload() });
  } catch (_error) {
    // Offscreen pages do not always expose chrome.storage.
  }
}

async function embed(text) {
  const key = String(text || "").replace(/\s+/g, " ").trim().slice(0, 500);
  if (!key) return null;
  if (phraseCache.has(key)) return phraseCache.get(key);
  const model = await getExtractor();
  const output = await model(key, { pooling: "mean", normalize: true });
  const vector = Array.from(output.data);
  phraseCache.set(key, vector);
  return vector;
}

async function score(message) {
  const text = String(message.text || "").trim();
  if (!text) return { ok: true, dontShowMax: 0, dontShowPhrase: "", focusScore: 0 };

  await getExtractor();
  const cardVec = await embed(text);
  const phrases = Array.isArray(message.dontShow) ? message.dontShow : [];
  let dontShowMax = 0;
  let dontShowPhrase = "";
  for (const phrase of phrases) {
    const vec = await embed(phrase);
    if (!vec) continue;
    const score = globalThis.ContentCoverFilter.cosine(cardVec, vec);
    if (score > dontShowMax) {
      dontShowMax = score;
      dontShowPhrase = String(phrase || "");
    }
  }
  const focusVec = message.focusText ? await embed(message.focusText) : null;

  return {
    ok: true,
    dontShowMax,
    dontShowPhrase,
    focusScore: focusVec ? globalThis.ContentCoverFilter.cosine(cardVec, focusVec) : 0,
  };
}

getExtractor().catch(() => {});
