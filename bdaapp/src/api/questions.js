// src/api/questions.js
import { api } from "./client";

/**
 * Search questions via /questions/search
 * @param {Object} opts
 * @param {string} [opts.sort] sort key: "" | "u" | "uvc" | "uvac"
 * @param {string} [opts.text] optional search text
 * @param {string} [opts.field] "title" | "creator" | "body"
 * @param {string} [opts.after] for pagination
 */
export async function searchQuestions(opts = {}) {
  const { sort = "", text = "", field = "", after = "" } = opts;

  const qs = new URLSearchParams();

  if (sort) qs.set("sort", sort);

  if (text && field) {
    if (field === "creator") {
      const match = { creator: text.trim() };
      qs.set("match", encodeURIComponent(JSON.stringify(match)));
    } else if (field === "title") {
      const match = { title: text.trim() };
      qs.set("match", encodeURIComponent(JSON.stringify(match)));
    } else if (field === "body") {
      const regexMatch = { text: text.trim() };
      qs.set("regexMatch", encodeURIComponent(JSON.stringify(regexMatch)));
    }
  }

  if (after) qs.set("after", after);

  const res = await api(
    `/questions/search${qs.toString() ? `?${qs.toString()}` : ""}`
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${msg || res.statusText}`);
  }

  const data = await res.json();
  return data.questions || [];
}

/* =======================
   Q&A detail helpers
   ======================= */

export async function getQuestion(questionId) {
  const res = await api(`/questions/${questionId}`);
  if (!res.ok) throw new Error(`Failed to load question ${questionId}`);
  const data = await res.json();
  return data.question;
}

export async function incrementView(questionId) {
  const res = await api(`/questions/${questionId}`, {
    method: "PATCH",
    body: JSON.stringify({ views: "increment" }),
  });
  // Ignore errors silently; this is non-critical
  return res.ok;
}

export async function getQuestionAnswers(questionId, after = "") {
  const qs = new URLSearchParams();
  if (after) qs.set("after", after);
  const res = await api(
    `/questions/${questionId}/answers${qs.toString() ? `?${qs}` : ""}`
  );
  if (!res.ok) throw new Error("Failed to load answers");
  const data = await res.json();
  return data.answers || [];
}

export async function getQuestionComments(questionId, after = "") {
  const qs = new URLSearchParams();
  if (after) qs.set("after", after);
  const res = await api(
    `/questions/${questionId}/comments${qs.toString() ? `?${qs}` : ""}`
  );
  if (!res.ok) throw new Error("Failed to load comments");
  const data = await res.json();
  return data.comments || [];
}

export async function addAnswer(questionId, creator, text) {
  const res = await api(`/questions/${questionId}/answers`, {
    method: "POST",
    body: JSON.stringify({ creator, text }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Failed to add answer: ${t || res.statusText}`);
  }
  const data = await res.json();
  return data.answer;
}

export async function addQuestionComment(questionId, creator, text) {
  const res = await api(`/questions/${questionId}/comments`, {
    method: "POST",
    body: JSON.stringify({ creator, text }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Failed to add comment: ${t || res.statusText}`);
  }
  const data = await res.json();
  return data.comment;
}

export async function voteQuestion(questionId, username, target, op) {
  // target: "upvotes" | "downvotes"
  // op: "increment" | "decrement"
  const res = await api(`/questions/${questionId}/vote/${encodeURIComponent(username)}`, {
    method: "PATCH",
    body: JSON.stringify({ operation: op, target }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Vote failed: ${t || res.statusText}`);
  }
  return true;
}

export async function voteAnswer(questionId, answerId, username, target, op) {
  const res = await api(
    `/questions/${questionId}/answers/${answerId}/vote/${encodeURIComponent(username)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ operation: op, target }),
    }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Vote failed: ${t || res.statusText}`);
  }
  return true;
}