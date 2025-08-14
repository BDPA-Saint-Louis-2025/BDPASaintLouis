// src/api/users.js
import { api } from "./client";
import { deriveLoginKeyFromPassword, makeRandomSaltHex } from "../utils/crypto";

// Get a user to read their salt (for login flow)
export async function getUser(username) {
  const res = await api(`/users/${encodeURIComponent(username)}`);
  const data = await res.json();
  if (!res.ok || !data?.success) throw new Error("User not found");
  return data.user;
}

// Register a new user
export async function registerUser({ username, email, password }) {
  const salt = makeRandomSaltHex();
  const key = await deriveLoginKeyFromPassword(password, salt);

  const res = await api(`/users`, {
    method: "POST",
    body: JSON.stringify({ username, email, salt, key }),
  });
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || "Registration failed");
  }
  return data.user;
}

// Login: derive key w/ existing salt and verify
export async function loginUser({ username, password, remember = true }) {
  const user = await getUser(username); // need the salt
  const key = await deriveLoginKeyFromPassword(password, user.salt);

  const res = await api(`/users/${encodeURIComponent(username)}/auth`, {
    method: "POST",
    body: JSON.stringify({ key }),
  });
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || "Invalid credentials");
  }

  if (remember) {
    localStorage.setItem("QO_USERNAME", username);
  } else {
    sessionStorage.setItem("QO_USERNAME", username);
  }
  return true;
}

export function logoutUser() {
  localStorage.removeItem("QO_USERNAME");
  sessionStorage.removeItem("QO_USERNAME");
}

export async function changeEmail(username, newEmail) {
  const res = await api(`/users/${encodeURIComponent(username)}`, {
    method: "PATCH",
    body: JSON.stringify({ email: newEmail }),
  });
  const data = await res.json();
  if (!res.ok || !data?.success) throw new Error(data?.error || "Failed to update email");
}

export async function changePassword(username, newPassword) {
  const salt = makeRandomSaltHex();
  const key = await deriveLoginKeyFromPassword(newPassword, salt);
  const res = await api(`/users/${encodeURIComponent(username)}`, {
    method: "PATCH",
    body: JSON.stringify({ salt, key }),
  });
  const data = await res.json();
  if (!res.ok || !data?.success) throw new Error(data?.error || "Failed to update password");
}

export async function deleteUser(username) {
  const res = await api(`/users/${encodeURIComponent(username)}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok || !data?.success) throw new Error(data?.error || "Failed to delete user");
}