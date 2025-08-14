// src/api/auth.js
// qOverflow auth helpers: register + login using PBKDF2 (100k iters)

import { api } from "./client";

// ----- tiny utils -----
function toHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (let b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

function fromUtf8(str) {
  return new TextEncoder().encode(str);
}

function randomSaltHex(bytes = 16) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Derive a 64-byte (128 hex chars) key using PBKDF2-HMAC-SHA-256
 * with 100,000 iterations (per the spec).
 */
export async function deriveKeyHex(password, saltHex) {
  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g).map((h) => parseInt(h, 16))
  );
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    fromUtf8(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: 100000,
      salt,
    },
    keyMaterial,
    512 // 64 bytes => 512 bits
  );
  return toHex(bits);
}

// ----- API wrappers -----

export async function getUser(username) {
  const res = await api(`/users/${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error(`User fetch failed (${res.status})`);
  const data = await res.json();
  return data.user;
}

/**
 * Create new user (open registration)
 * body: { username, email, salt, key }
 */
export async function registerUser({ username, email, password }) {
  const salt = randomSaltHex(16); // 16 bytes => 32 hex chars
  const key = await deriveKeyHex(password, salt);

  const res = await api(`/users`, {
    method: "POST",
    body: JSON.stringify({ username, email, salt, key }),
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Bad response (${res.status}): ${text?.slice(0, 200)}`);
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Registration failed (${res.status})`);
  }

  // first point is handled by platform rules later; we just return user
  return data.user;
}

/**
 * Login flow:
 * 1) fetch user -> get salt
 * 2) derive key with given password
 * 3) POST /users/:username/auth with { key }
 */
export async function authenticate({ username, password, remember = false }) {
  const user = await getUser(username); // has .salt
  const key = await deriveKeyHex(password, user.salt);

  const res = await api(`/users/${encodeURIComponent(username)}/auth`, {
    method: "POST",
    body: JSON.stringify({ key }),
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // ignore parse errors; API returns only { success: true/false }
  }

  if (!res.ok || data.success !== true) {
    throw new Error("Invalid credentials");
  }

  // Persist the session locally (the API is key-based; you track “me” client-side)
  const store = remember ? localStorage : sessionStorage;
  store.setItem("me_username", username);
  return { username };
}

export function signOut() {
  localStorage.removeItem("me_username");
  sessionStorage.removeItem("me_username");
}

export function getCurrentUsername() {
  return (
    localStorage.getItem("me_username") || sessionStorage.getItem("me_username")
  );
}