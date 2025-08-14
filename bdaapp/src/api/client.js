// src/api/client.js
const BASE = "https://qoverflow.api.hscc.bdpa.org/v1";

/**
 * Where we read/store the API key
 * 1) .env -> REACT_APP_QO_API_KEY
 * 2) localStorage -> "QO_API_KEY"
 * Always return "bearer <key>" format as the header value.
 */
function getAuth() {
  const raw =
    process.env.REACT_APP_QO_API_KEY ||
    (typeof localStorage !== "undefined" && localStorage.getItem("QO_API_KEY")) ||
    "";

  if (!raw) return undefined;
  return raw.toLowerCase().startsWith("bearer ") ? raw : `bearer ${raw}`;
}

/** Optional helper to change key during runtime (e.g., from a settings screen) */
export function setApiKey(key) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("QO_API_KEY", key);
  }
}

/** Sleep helper */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Low-level fetch wrapper. Keeps your previous signature:
 *   api(path, opts?)
 * where opts is a normal fetch options object; you may add { retry?: number }.
 */
export async function api(path, opts = {}) {
  const retry = opts.retry ?? 1;

  // Ensure headers exist and include auth + JSON content-type for write ops
  const method = (opts.method || "GET").toUpperCase();
  const isWrite = method === "POST" || method === "PATCH" || method === "PUT";
  const headers = {
    Authorization: getAuth(), // MUST include "bearer ..."
    ...(isWrite ? { "content-type": "application/json" } : {}),
    ...(opts.headers || {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });

  // Handle soft rate limit
  if (res.status === 429) {
    let retryAfter = 15000;
    try {
      const body = await res.json();
      if (body && typeof body.retryAfter !== "undefined") {
        retryAfter = Number(body.retryAfter) || retryAfter;
      }
    } catch {
      /* ignore parse errors */
    }
    await sleep(retryAfter);
    return api(path, { ...opts, retry }); // try again after wait
  }

  // Flaky server error that API intentionally throws sometimes — retry once
  if (res.status === 555 && retry > 0) {
    await sleep(500); // brief backoff
    return api(path, { ...opts, retry: retry - 1 });
  }

  return res;
}

/**
 * Convenience: call api() and parse JSON, throwing on non-200 with
 * the API's error message if available.
 */
export async function apiJSON(path, opts = {}) {
  const res = await api(path, opts);

  let data = null;
  try {
    data = await res.json();
  } catch {
    // not JSON; fall through
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      `Request failed (${res.status}) ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/** Tiny helpers if you want them */
export const getJSON = (path) => apiJSON(path, { method: "GET" });
export const postJSON = (path, body) =>
  apiJSON(path, { method: "POST", body: JSON.stringify(body || {}) });
export const patchJSON = (path, body) =>
  apiJSON(path, { method: "PATCH", body: JSON.stringify(body || {}) });
export const putJSON = (path, body) =>
  apiJSON(path, { method: "PUT", body: JSON.stringify(body || {}) });
export const del = (path) => api(path, { method: "DELETE" });
