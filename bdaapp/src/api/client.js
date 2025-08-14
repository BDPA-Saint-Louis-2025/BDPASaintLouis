// src/api/client.js
const BASE = "https://qoverflow.api.hscc.bdpa.org/v1";
const KEY_ENDPOINT = "http://localhost:5000/api-ke";
const LS_KEY = "QO_API_KEY_CACHE";
const LS_TTL_MS = 24 * 60 * 60 * 1000; // 24h

let memKey = null;

function loadKeyFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const { key, ts } = JSON.parse(raw);
    if (!key || !ts) return null;
    if (Date.now() - ts > LS_TTL_MS) return null; // expired
    return key;
  } catch {
    return null;
  }
}

function saveKeyToLocalStorage(key) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ key, ts: Date.now() }));
  } catch {}
}

async function fetchKeyFromServer() {
  const res = await fetch(KEY_ENDPOINT, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`/api-ke failed: ${res.status} ${text}`);
  }
  const { key } = await res.json();
  if (!key || typeof key !== "string") {
    throw new Error("Invalid key payload from /api-ke");
  }
  return key;
}

async function getAuth() {
  if (memKey) return memKey;
  const fromLS = loadKeyFromLocalStorage();
  if (fromLS) {
    memKey = fromLS;
    return memKey;
  }
  const key = await fetchKeyFromServer();
  memKey = key;
  saveKeyToLocalStorage(key);
  return memKey;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * api(path, opts?)
 * opts.retry555: number of extra retries for 5xx/555 (default 1)
 */
export async function api(path, opts = {}) {
  const auth = await getAuth();
  const retry555 = opts.retry555 ?? 1;

  const doFetch = async () =>
    fetch(`${BASE}${path}`, {
      ...opts,
      headers: {
        Authorization: auth, // e.g. "Bearer de88..."
        "content-type": "application/json",
        ...(opts.headers || {}),
      },
    });

  let res = await doFetch();

  // 429 handling: respect retryAfter (ms) if provided, else default 15s
  if (res.status === 429) {
    let retryAfter = 15000;
    try {
      const j = await res.json();
      if (j && j.retryAfter) retryAfter = Number(j.retryAfter);
    } catch {}
    await sleep(retryAfter);
    res = await doFetch();
  }

  // One retry for transient 555/5xx if enabled
  if (!res.ok && retry555 > 0 && (res.status === 555 || (res.status >= 500 && res.status <= 599))) {
    await sleep(800);
    res = await api(path, { ...opts, retry555: retry555 - 1 });
    return res;
  }

  return res;
}
