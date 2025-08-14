// src/views/QandA.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getQuestion,
  incrementView,
  getQuestionAnswers,
  getQuestionComments,
  addAnswer,
  addQuestionComment,
  voteQuestion,
  voteAnswer,
} from "../api/questions";
import { getCurrentUsername } from "../api/me";
import { timeAgo } from "../utils/time";

export default function QandA() {
  const { id } = useParams();
  const me = getCurrentUsername();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [q, setQ] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [comments, setComments] = useState([]);

  const [answerText, setAnswerText] = useState("");
  const [commentText, setCommentText] = useState("");

  // sort answers: net votes desc, then createdAt asc
  function sortAnswers(list) {
    return (list || []).slice().sort((a, b) => {
      const an = (a.upvotes || 0) - (a.downvotes || 0);
      const bn = (b.upvotes || 0) - (b.downvotes || 0);
      if (bn !== an) return bn - an;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  }

  // initial load + polling for live updates
  useEffect(() => {
    let alive = true;

    async function loadAll() {
      try {
        setLoading(true);
        setErr(null);
        const [question, ans, coms] = await Promise.all([
          getQuestion(id),
          getQuestionAnswers(id),
          getQuestionComments(id),
        ]);
        if (!alive) return;
        setQ(question);
        setAnswers(sortAnswers(ans));
        setComments(coms);
        // increment view (non-blocking)
        incrementView(id).catch(() => {});
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAll();
    const t = setInterval(loadAll, 12000); // gentle poll

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id]);

  const netVotesQ = useMemo(() => {
    if (!q) return 0;
    return (q.upvotes || 0) - (q.downvotes || 0);
  }, [q]);

  async function handleAddAnswer(e) {
    e.preventDefault();
    if (!me) return alert("Please log in to answer.");
    const text = answerText.trim();
    if (!text) return;

    try {
      await addAnswer(id, me, text);
      setAnswerText("");
      const list = await getQuestionAnswers(id);
      setAnswers(sortAnswers(list));
    } catch (e2) {
      alert(e2.message || "Could not add answer");
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!me) return alert("Please log in to comment.");
    const text = commentText.trim();
    if (!text) return;

    try {
      const newCom = await addQuestionComment(id, me, text);
      setCommentText("");
      // comments are oldest-first
      setComments((prev) => [...prev, newCom]);
    } catch (e2) {
      alert(e2.message || "Could not add comment");
    }
  }

  async function onVoteQuestion(dir) {
    if (!me) return alert("Please log in to vote.");
    try {
      await voteQuestion(id, me, dir === "up" ? "upvotes" : "downvotes", "increment");
      const question = await getQuestion(id);
      setQ(question);
    } catch (e) {
      alert(e.message || "Vote failed");
    }
  }

  async function onVoteAnswer(answerId, dir) {
    if (!me) return alert("Please log in to vote.");
    try {
      await voteAnswer(id, answerId, me, dir === "up" ? "upvotes" : "downvotes", "increment");
      const list = await getQuestionAnswers(id);
      setAnswers(sortAnswers(list));
    } catch (e) {
      alert(e.message || "Vote failed");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="mb-4 flex items-center gap-3">
        <Link to="/" className="underline text-sm">&larr; Back to Buffet</Link>
        <h1 className="text-2xl font-semibold ml-auto">Q&amp;A</h1>
      </header>

      {loading && <div>Loading…</div>}
      {err && <div className="text-red-600">Error: {err}</div>}

      {!loading && !err && q && (
        <>
          {/* Question card */}
          <article className="border rounded p-4">
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <span title="votes">⬆ {netVotesQ}</span>
              <span title="answers">💬 {q.answers}</span>
              <span title="views">👁 {q.views}</span>
              <span className="ml-auto">{timeAgo(q.createdAt)}</span>
            </div>
            <h2 className="text-xl font-medium">{q.title}</h2>

            {/* Question body (markdown could be rendered later) */}
            <div className="mt-2 whitespace-pre-wrap text-gray-800">
              {q.text}
            </div>

            <div className="mt-3 text-sm text-gray-700 flex items-center gap-3">
              <span>by @{q.creator}</span>
              {q.status !== "open" && (
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  {q.status}
                </span>
              )}
              {q.hasAcceptedAnswer && (
                <span className="px-2 py-0.5 rounded bg-green-100 text-green-800">
                  accepted
                </span>
              )}
            </div>

            {/* Vote controls for question */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onVoteQuestion("up")}
                className="px-3 py-1 rounded border hover:bg-gray-50"
              >
                ⬆ Upvote
              </button>
              <button
                onClick={() => onVoteQuestion("down")}
                className="px-3 py-1 rounded border hover:bg-gray-50"
              >
                ⬇ Downvote
              </button>
            </div>
          </article>

          {/* Comments */}
          <section className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Comments</h3>
            {comments.length === 0 && (
              <div className="text-gray-600 text-sm">No comments yet.</div>
            )}
            <ul className="space-y-2">
              {comments.map((c) => (
                <li key={c.comment_id} className="border rounded p-3">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{c.text}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    by @{c.creator} • {timeAgo(c.createdAt)} • ⬆ {(c.upvotes||0) - (c.downvotes||0)}
                  </div>
                </li>
              ))}
            </ul>

            {/* New comment */}
            <form onSubmit={handleAddComment} className="mt-3 space-y-2">
              <textarea
                className="w-full border rounded p-2"
                rows={3}
                maxLength={150}
                placeholder="Add a comment (max 150 chars)"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 ml-auto">
                  {commentText.length}/150
                </span>
                <button className="px-3 py-1 rounded bg-black text-white" type="submit">
                  Comment
                </button>
              </div>
            </form>
          </section>

          {/* Answers */}
          <section className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Answers</h3>
            {answers.length === 0 && (
              <div className="text-gray-600 text-sm">No answers yet. Be the first!</div>
            )}
            <ul className="space-y-3">
              {answers.map((a) => {
                const net = (a.upvotes || 0) - (a.downvotes || 0);
                return (
                  <li key={a.answer_id} className="border rounded p-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span title="votes">⬆ {net}</span>
                      <span className="ml-auto">{timeAgo(a.createdAt)}</span>
                    </div>
                    {/* Answer body (markdown could be rendered later) */}
                    <div className="whitespace-pre-wrap text-gray-800">
                      {a.text}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      by @{a.creator} {a.accepted && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-800">
                          accepted
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => onVoteAnswer(a.answer_id, "up")}
                        className="px-3 py-1 rounded border hover:bg-gray-50"
                      >
                        ⬆ Upvote
                      </button>
                      <button
                        onClick={() => onVoteAnswer(a.answer_id, "down")}
                        className="px-3 py-1 rounded border hover:bg-gray-50"
                      >
                        ⬇ Downvote
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* New answer */}
            <form onSubmit={handleAddAnswer} className="mt-4 space-y-2">
              <textarea
                className="w-full border rounded p-2"
                rows={6}
                maxLength={3000}
                placeholder="Write your answer in Markdown (max 3000 chars)"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 ml-auto">
                  {answerText.length}/3000
                </span>
                <button className="px-4 py-2 rounded bg-black text-white" type="submit">
                  Post Answer
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}