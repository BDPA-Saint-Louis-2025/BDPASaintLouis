// src/utils/crypto.js
// PBKDF2 helpers for deriving login keys per API spec (100,000 iterations)

const ITERATIONS = 100_000;
const SALT_BYTES = 16; // 16 bytes -> 32 hex chars
const KEY_BYTES = 64;  // 64 bytes -> 128 hex chars

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function hexToBuf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes.buffer;
}

export async function deriveLoginKeyFromPassword(password, saltHex) {
  const enc = new TextEncoder();
  const pwKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const keyBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: hexToBuf(saltHex),
      iterations: ITERATIONS,
    },
    pwKey,
    KEY_BYTES * 8
  );

  return bufToHex(keyBuffer); // 128 hex chars
}

export function makeRandomSaltHex() {
  const raw = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(raw);
  return bufToHex(raw.buffer); // 32 hex chars
}