const defaults = ContentCoverFilter.DEFAULTS;

const dontShowEnabled = document.getElementById("dontShowEnabled");
const dontShowInput = document.getElementById("dontShowInput");
const dontShowAdd = document.getElementById("dontShowAdd");
const dontShowList = document.getElementById("dontShowList");
const dontShowThreshold = document.getElementById("dontShowThreshold");
const focusEnabled = document.getElementById("focusEnabled");
const focusText = document.getElementById("focusText");
const focusApply = document.getElementById("focusApply");
const focusThreshold = document.getElementById("focusThreshold");
const modelStatus = document.getElementById("modelStatus");
const setup = document.getElementById("setup");
const setupBar = document.getElementById("setupBar");
const setupFill = document.getElementById("setupFill");
const setupMeta = document.getElementById("setupMeta");
const coveredList = document.getElementById("coveredList");
const clearCovered = document.getElementById("clearCovered");
const tabFilters = document.getElementById("tabFilters");
const tabCovered = document.getElementById("tabCovered");
const panelFilters = document.getElementById("panelFilters");
const panelCovered = document.getElementById("panelCovered");

let settings = ContentCoverFilter.normalizeSettings(defaults);
let coveredCount = 0;

chrome.storage.sync.get(defaults, (stored) => {
  settings = ContentCoverFilter.normalizeSettings(stored);
  render();
});

chrome.storage.local.get({ coveredItems: [] }, (stored) => {
  renderCovered(stored.coveredItems || []);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.coveredItems) {
    renderCovered(changes.coveredItems.newValue || []);
  }
  if ((area === "session" || area === "local") && changes.modelProgress) {
    applyProgress(changes.modelProgress.newValue);
  }
});

coveredList.addEventListener("scroll", hideReasonTip);

clearCovered.addEventListener("click", () => {
  chrome.storage.local.set({ coveredItems: [] });
});

tabFilters.addEventListener("click", () => showTab("filters"));
tabCovered.addEventListener("click", () => showTab("covered"));

dontShowEnabled.addEventListener("change", () => save({ dontShowEnabled: dontShowEnabled.checked }));
dontShowAdd.addEventListener("click", addPhrase);
dontShowInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addPhrase();
  }
});
dontShowThreshold.addEventListener("input", () => {
  save({ dontShowThreshold: Number(dontShowThreshold.value) / 100 });
});
focusEnabled.addEventListener("change", () => save({ focusEnabled: focusEnabled.checked }));
focusApply.addEventListener("click", applyFocus);
focusText.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    applyFocus();
  }
});
focusThreshold.addEventListener("input", () => {
  save({ focusThreshold: Number(focusThreshold.value) / 100 });
});

function showTab(name) {
  const filters = name === "filters";
  tabFilters.setAttribute("aria-selected", String(filters));
  tabCovered.setAttribute("aria-selected", String(!filters));
  panelFilters.hidden = !filters;
  panelCovered.hidden = filters;
  if (filters) hideReasonTip();
}

function addPhrase() {
  const phrase = dontShowInput.value.trim();
  if (!phrase) return;
  const dontShow = ContentCoverFilter.normalizeSettings({
    ...settings,
    dontShow: [...settings.dontShow, phrase],
  }).dontShow;
  dontShowInput.value = "";
  save({ dontShowEnabled: true, dontShow });
}

function removePhrase(phrase) {
  save({ dontShow: settings.dontShow.filter((item) => item !== phrase) });
}

function applyFocus() {
  const text = focusText.value.trim();
  save({
    focusText: text,
    focusEnabled: Boolean(text),
  });
}

function save(patch) {
  settings = ContentCoverFilter.normalizeSettings({ ...settings, ...patch });
  chrome.storage.sync.set({
    randomEnabled: false,
    coveragePercent: 0,
    dontShowEnabled: settings.dontShowEnabled,
    dontShow: settings.dontShow,
    focusEnabled: settings.focusEnabled,
    focusText: settings.focusText,
    dontShowThreshold: settings.dontShowThreshold,
    focusThreshold: settings.focusThreshold,
  });
  render();
}

function render() {
  dontShowEnabled.checked = settings.dontShowEnabled;
  dontShowThreshold.value = String(Math.round(settings.dontShowThreshold * 100));
  focusEnabled.checked = settings.focusEnabled;
  focusText.value = settings.focusText;
  focusThreshold.value = String(Math.round(settings.focusThreshold * 100));
  dontShowList.replaceChildren();
  for (const phrase of settings.dontShow) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.append(phrase + " ");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${phrase}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => removePhrase(phrase));
    chip.appendChild(remove);
    dontShowList.appendChild(chip);
  }
}

function refreshModelStatus() {
  chrome.runtime.sendMessage({ target: "background", type: "modelStatus" }, (result) => {
    if (chrome.runtime.lastError) {
      applyProgress({ status: "starting" });
      modelStatus.hidden = false;
      setup.hidden = true;
      modelStatus.textContent = "Model: not running yet. Open a supported site.";
      return;
    }
    applyProgress(result);
  });
}

function applyProgress(info) {
  const state = (info && info.status) || "starting";
  if (state === "ready") {
    setup.hidden = true;
    modelStatus.hidden = false;
    modelStatus.textContent = "Model: ready";
    return;
  }
  if (state === "error") {
    setup.hidden = true;
    modelStatus.hidden = false;
    modelStatus.textContent = "Model: failed. Word matching still works.";
    return;
  }

  setup.hidden = false;
  modelStatus.hidden = true;
  const percent = Math.max(0, Math.min(100, Number(info && info.percent) || 0));
  const hasBytes = Boolean(info && info.total > 0);
  setupFill.classList.toggle("indeterminate", !hasBytes && percent < 2);
  setupFill.style.width = hasBytes || percent ? `${Math.max(percent, 6)}%` : "";
  setupBar.setAttribute("aria-valuenow", String(percent));

  const bits = [];
  if (hasBytes) bits.push(`${formatMb(info.loaded)} of ${formatMb(info.total)}`);
  else if (percent) bits.push(`${percent}%`);
  if (info && info.file) bits.push(info.file);
  const focusNote = settings.focusEnabled && settings.focusText
    ? " Word matching is already covering off-topic items."
    : "";
  setupMeta.textContent = bits.length
    ? `Loading model · ${bits.join(" · ")}.${focusNote}`
    : `Loading the local model.${focusNote}`;
}

function formatMb(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "0 MB";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

let reasonTip = null;

function renderCovered(items) {
  hideReasonTip();
  coveredCount = (items || []).length;
  tabCovered.textContent = coveredCount ? `History (${coveredCount})` : "History";
  coveredList.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "fine";
    empty.textContent = "Nothing in history yet.";
    coveredList.appendChild(empty);
    return;
  }
  for (const item of items.slice(0, 80)) {
    const row = document.createElement(item.url ? "a" : "div");
    row.className = "covered-item";
    if (item.url) {
      row.href = item.url;
      row.target = "_blank";
      row.rel = "noreferrer";
    }
    const top = document.createElement("div");
    top.className = "covered-top";
    const why = item.why || ContentCoverFilter.whyFromReason(item.reason);
    if (why && why.chip) {
      top.appendChild(reasonChip(why));
    }
    const title = document.createElement("strong");
    title.textContent = item.title || "Untitled";
    top.appendChild(title);
    row.appendChild(top);
    const meta = document.createElement("span");
    meta.textContent = [item.site, item.url].filter(Boolean).join(" · ");
    row.appendChild(meta);
    coveredList.appendChild(row);
  }
}

function reasonChip(why) {
  const chip = document.createElement("span");
  chip.className = `reason-chip reason-${why.chip}`;
  chip.textContent = why.chip;
  const tip = ContentCoverFilter.explainCover(why);
  chip.setAttribute("aria-label", tip || why.chip);
  chip.addEventListener("mouseenter", () => showReasonTip(chip, tip));
  chip.addEventListener("mouseleave", hideReasonTip);
  chip.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  return chip;
}

function showReasonTip(anchor, text) {
  hideReasonTip();
  if (!text) return;
  reasonTip = document.createElement("div");
  reasonTip.className = "reason-tip";
  reasonTip.textContent = text;
  document.body.appendChild(reasonTip);
  const box = anchor.getBoundingClientRect();
  const width = reasonTip.offsetWidth;
  const left = Math.max(8, Math.min(box.left, window.innerWidth - width - 8));
  reasonTip.style.left = `${left}px`;
  reasonTip.style.top = `${box.bottom + 4}px`;
}

function hideReasonTip() {
  if (!reasonTip) return;
  reasonTip.remove();
  reasonTip = null;
}

refreshModelStatus();
setInterval(refreshModelStatus, 800);
