// src/views/Buffet.jsx
import React, { useEffect, useMemo, useState } from "react";
import { searchQuestions } from "../api/questions";
import { timeAgo } from "../utils/time";

const SORTS = [
  { key: "", label: "Recent" },
  { key: "u", label: "Best (↑)" },
  { key: "uvc", label: "Interesting (↑+views+comments)" },
  { key: "uvac", label: "Hottest (↑+views+answers+comments)" },
];

export default function Buffet() {
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    searchQuestions({ sort })
      .then((q) => {
        if (!alive) return;
        setItems(q);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e.message || "Failed to load");
      })
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [sort]);

  const rows = useMemo(() => items || [], [items]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Buffet</h1>
        <div className="flex gap-2">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`px-3 py-1 rounded border ${sort === s.key ? "bg-black text-white" : ""}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </header>

      {loading && <div>Loading…</div>}
      {err && <div className="text-red-600">Error: {err}</div>}

      {!loading && !err && rows.length === 0 && (
        <div className="text-gray-600">No questions yet.</div>
      )}

      <ul className="space-y-3">
        {rows.map((q) => (
          <li key={q.question_id}>
            <a
              href={`/q/${q.question_id}`}
              className="block rounded border p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span title="votes">⬆ {q.upvotes - q.downvotes}</span>
                <span title="answers">💬 {q.answers}</span>
                <span title="views">👁 {q.views}</span>
                <span className="ml-auto">{timeAgo(q.createdAt)}</span>
              </div>

              <h2 className="text-lg font-medium mt-1">{q.title}</h2>

              <div className="mt-1 text-sm text-gray-700 flex items-center gap-3">
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
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}