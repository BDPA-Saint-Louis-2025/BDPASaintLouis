const BASE = "https://qoverflow.api.hscc.bdpa.org/v1";
const AUTH_URL = "http://localhost:5000/api-ke"; // backend route

let cachedKey = null;

async function getAuth() {
  if (cachedKey) return cachedKey;
  const res = await fetch(AUTH_URL);
  const data = await res.json();
  cachedKey = String(data.key || "").trim(); // e.g. "bearer de88..."
  return cachedKey || undefined;
}

export async function api(path, opts = {}) {
  const auth = await getAuth();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      ...(auth ? { Authorization: auth } : {}),
      "content-type": "application/json",
      ...(opts.headers || {}),
    },
  });

  if (res.status === 429) {
    const { retryAfter = 15000 } = await res.json().catch(() => ({}));
    await new Promise((r) => setTimeout(r, Number(retryAfter)));
    return api(path, opts);
  }

  return res;
}