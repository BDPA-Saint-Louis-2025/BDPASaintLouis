import React from "react";
import QuestionCard from "../components/QuestionCard";
import { searchQuestions } from "../api/questions";
import myImage from '../LoginScreen/bdpaLogo.png';
import './buffet.css';
import { useNavigate, Link } from 'react-router-dom';



// simple polling hook for Req.10 light revalidation
function useInterval(callback, delay) {
  React.useEffect(() => {
    if (delay == null) return;
    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [callback, delay]);
}

const SORTS = [
  { key: "", label: "Most recent" },
  { key: "u", label: "Best (most upvotes)" },
  { key: "uvc", label: "Interesting (upvotes+views+comments, unanswered)" },
  { key: "uvac", label: "Hottest (upvotes+views+answers+comments, no accepted)" },
];

export default function Buffet() {
  const [items, setItems] = React.useState([]);
  const [after, setAfter] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [sort, setSort] = React.useState("");
  const [q, setQ] = React.useState("");        // search text
  const [mode, setMode] = React.useState("title"); // title | creator | text | regex

  const buildMatch = React.useCallback(() => {
    if (!q.trim()) return undefined;
    if (mode === "regex") return undefined; // handled via regexMatch
    // Basic match object depending on mode
    if (mode === "title") return { title: q.trim() };         // title search is case-insensitive server-side
    if (mode === "creator") return { creator: q.trim() };
    if (mode === "text") return { text: q.trim() };
  }, [q, mode]);

  const buildRegex = React.useCallback(() => {
    if (mode !== "regex" || !q.trim()) return undefined;
    // simple OR by spaces: "graph tree dp" -> /(graph|tree|dp)/i
    const pattern = q.trim().split(/\s+/).join("|");
    return { text: `(${pattern})` };
  }, [q, mode]);

  async function fetchPage({ append = false, cursor = null } = {}) {
    setLoading(true);
    setError("");
    try {
      const res = await searchQuestions({
        after: cursor ?? (append ? after : null),
        sort: sort || undefined,
        match: buildMatch(),
        regexMatch: buildRegex(),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`API ${res.status}: ${msg || "failed"}`);
      }
      const data = await res.json();
      const list = data?.questions || [];
      setItems((old) => (append ? [...old, ...list] : list));
      setAfter(list.length ? list[list.length - 1].question_id : null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // initial + re-run when sort/search changes
  React.useEffect(() => {
    fetchPage({ append: false, cursor: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, q, mode]);

  // light polling every 10s to keep counts fresh (Req.10)
  useInterval(() => fetchPage({ append: false, cursor: null }), 10_000);

  function onOpenQuestion(q) {
    // navigate to Q&A route when you build it
    // e.g. using react-router: navigate(`/q/${q.question_id}`)
    console.log("open question", q.question_id);
  }

  return (
    
    <div className="max-w-5xl mx-auto p-4">
      <header className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
             <div className="bar">
            <img src={myImage} alt="Top Right Icon" className="imgStyle" />
            <ul>
            <Link to='/signup' style={{color: '#fff'}}><li> Sign Up </li></Link>
            <Link to='/login' style={{color: '#fff'}}><li>Login</li></Link>
            <Link to='/BuffetView' style={{color: '#fff'}}><li> Question Viewer</li></Link>
            </ul>
            </div>
             <h1 className="heading">Buffet</h1>
        <div className="flex flex-wrap gap-2">
    
          <input
            className="border rounded px-3 py-2 w-64"
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
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
            className="border rounded px-3 py-2"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            title="Sort"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          <button
            className="border rounded px-3 py-2"
            onClick={() => fetchPage({ append: false, cursor: null })}
            disabled={loading}
            title="Refresh"
          >
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 mb-3">
          {error}
        </div>
      )}

      <div className="grid gap-3">
        {items.map((q) => (
          <QuestionCard key={q.question_id} q={q} onClick={onOpenQuestion} />
        ))}
      </div>

      <div className="flex justify-center my-6">
        <button
          className="border rounded px-4 py-2 disabled:opacity-50"
          disabled={!after || loading}
          onClick={() => fetchPage({ append: true, cursor: after })}
        >
          {loading ? "Loading…" : after ? "Load more" : "No more"}
        </button>
      </div>
    </div>
  );
}