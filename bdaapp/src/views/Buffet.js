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
    
    <div className="max-w-5xl mx-auto p-4">
      <header className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
             <div className="bar">
            <img src={myImage} alt="Top Right Icon" className="imgStyle" />
            <ul>
            <Link to='/signup' style={{color: '#fff'}}><li> Sign Up </li></Link>
            <Link to='/login' style={{color: '#fff'}}><li>Login</li></Link>
            <Link to='/' style={{color: '#fff'}}><li> Question Viewer</li></Link>
            </ul>
            </div>
             <h1 className="heading">Buffet</h1>
        <div className="searchFilters">
    
          <input
            className="searchInput"
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="filters">
          <select
            className="subInput"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            title="Search mode"
          >
            <option value="title">Title (insensitive)</option>
            <option value="text">Text (exact)</option>
            <option value="creator">Creator</option>
            <option value="regex">Regex in text</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            title="Sort"
            className="selecter"
            
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          </div>
          </div>
          <button
            className="border rounded px-3 py-2"
            onClick={() => fetchPage({ append: false, cursor: null })}
            disabled={loading}
            title="Refresh"
          >
            Refresh
          </button>
      
      </header>
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 mb-3">
          {error}
        </div>
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