// src/api/questions.js
import { api } from "./client";

/** Search questions. sort: "", "u", "uvc", "uvac" */
export async function searchQuestions({ after, match, regexMatch, sort } = {}) {
  const qs = new URLSearchParams();
  if (after) qs.set("after", after);
  if (sort) qs.set("sort", sort);
  if (match) qs.set("match", encodeURIComponent(JSON.stringify(match)));
  if (regexMatch) qs.set("regexMatch", encodeURIComponent(JSON.stringify(regexMatch)));

  const res = await api(`/questions/search${qs.toString() ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(`searchQuestions failed: ${res.status}`);
  const data = await res.json();
  return data.questions || [];
}

export async function getQuestion(question_id) {
  const res = await api(`/questions/${question_id}`);
  if (!res.ok) throw new Error(`getQuestion failed: ${res.status}`);
  const data = await res.json();
  return data.question;
}

export async function createQuestion({ creator, title, text }) {
  const res = await api(`/questions`, {
    method: "POST",
    body: JSON.stringify({ creator, title, text }),
  });
  if (!res.ok) throw new Error(`createQuestion failed: ${res.status}`);
  return (await res.json()).question;
}

export async function incrementViews(question_id) {
  const res = await api(`/questions/${question_id}`, {
    method: "PATCH",
    body: JSON.stringify({ views: "increment" }),
  });
  if (!res.ok) throw new Error(`incrementViews failed: ${res.status}`);
  return true;
}