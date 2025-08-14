// src/api/questions.js
import { api } from "./client";

// Helper to encode objects for match/regexMatch
const enc = (obj) => encodeURIComponent(JSON.stringify(obj));

/* =========================
 * Questions
 * ========================= */
export async function searchQuestions({ after, sort, match, regexMatch } = {}) {
  const params = new URLSearchParams();
  if (after) params.set("after", after);
  if (sort) params.set("sort", sort); // "", "u", "uvc", "uvac"
  if (match) params.set("match", enc(match));
  if (regexMatch) params.set("regexMatch", enc(regexMatch));
  const qs = params.toString();
  return api(`/questions/search${qs ? `?${qs}` : ""}`);
}

export async function createQuestion({ creator, title, text }) {
  return api(`/questions`, {
    method: "POST",
    body: JSON.stringify({ creator, title, text }),
  });
}

export async function getQuestion(question_id) {
  return api(`/questions/${question_id}`);
}

export async function patchQuestion(question_id, patch = {}) {
  // patch can include: { status, title, text, views, upvotes, downvotes }
  return api(`/questions/${question_id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function incrementQuestionViews(question_id) {
  return patchQuestion(question_id, { views: "increment" });
}

/** Votes on a question */
export async function getQuestionVote(question_id, username) {
  // 200 with {vote}, or 404 if no vote yet (both with {success:true})
  return api(`/questions/${question_id}/vote/${username}`);
}

export async function setQuestionVote(question_id, username, { operation, target }) {
  // operation: "increment" | "decrement"
  // target: "upvotes" | "downvotes"
  return api(`/questions/${question_id}/vote/${username}`, {
    method: "PATCH",
    body: JSON.stringify({ operation, target }),
  });
}

/* =========================
 * Question Comments
 * ========================= */
export async function getQuestionComments(question_id, { after } = {}) {
  const params = new URLSearchParams();
  if (after) params.set("after", after);
  const qs = params.toString();
  return api(`/questions/${question_id}/comments${qs ? `?${qs}` : ""}`);
}

export async function createQuestionComment(question_id, { creator, text }) {
  return api(`/questions/${question_id}/comments`, {
    method: "POST",
    body: JSON.stringify({ creator, text }),
  });
}

export async function deleteQuestionComment(question_id, comment_id) {
  return api(`/questions/${question_id}/comments/${comment_id}`, { method: "DELETE" });
}

export async function getQuestionCommentVote(question_id, comment_id, username) {
  return api(`/questions/${question_id}/comments/${comment_id}/vote/${username}`);
}

export async function setQuestionCommentVote(question_id, comment_id, username, { operation, target }) {
  return api(`/questions/${question_id}/comments/${comment_id}/vote/${username}`, {
    method: "PATCH",
    body: JSON.stringify({ operation, target }),
  });
}

/* =========================
 * Answers
 * ========================= */
export async function getAnswers(question_id, { after } = {}) {
  const params = new URLSearchParams();
  if (after) params.set("after", after);
  const qs = params.toString();
  return api(`/questions/${question_id}/answers${qs ? `?${qs}` : ""}`);
}

export async function createAnswer(question_id, { creator, text }) {
  return api(`/questions/${question_id}/answers`, {
    method: "POST",
    body: JSON.stringify({ creator, text }),
  });
}

export async function patchAnswer(question_id, answer_id, patch = {}) {
  // patch can include: { text, upvotes, downvotes, accepted }
  return api(`/questions/${question_id}/answers/${answer_id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/** Votes on an answer */
export async function getAnswerVote(question_id, answer_id, username) {
  return api(`/questions/${question_id}/answers/${answer_id}/vote/${username}`);
}

export async function setAnswerVote(question_id, answer_id, username, { operation, target }) {
  return api(`/questions/${question_id}/answers/${answer_id}/vote/${username}`, {
    method: "PATCH",
    body: JSON.stringify({ operation, target }),
  });
}

/* =========================
 * Answer Comments
 * ========================= */
export async function getAnswerComments(question_id, answer_id, { after } = {}) {
  const params = new URLSearchParams();
  if (after) params.set("after", after);
  const qs = params.toString();
  return api(`/questions/${question_id}/answers/${answer_id}/comments${qs ? `?${qs}` : ""}`);
}

export async function createAnswerComment(question_id, answer_id, { creator, text }) {
  return api(`/questions/${question_id}/answers/${answer_id}/comments`, {
    method: "POST",
    body: JSON.stringify({ creator, text }),
  });
}

export async function deleteAnswerComment(question_id, answer_id, comment_id) {
  return api(`/questions/${question_id}/answers/${answer_id}/comments/${comment_id}`, {
    method: "DELETE",
  });
}

export async function getAnswerCommentVote(question_id, answer_id, comment_id, username) {
  return api(`/questions/${question_id}/answers/${answer_id}/comments/${comment_id}/vote/${username}`);
}

export async function setAnswerCommentVote(question_id, answer_id, comment_id, username, { operation, target }) {
  return api(`/questions/${question_id}/answers/${answer_id}/comments/${comment_id}/vote/${username}`, {
    method: "PATCH",
    body: JSON.stringify({ operation, target }),
  });
}