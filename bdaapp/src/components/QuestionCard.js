import React from "react";
import { timeAgo } from "../utils/time";

export default function QuestionCard({ q, onClick }) {
  const netVotes = (q.upvotes ?? 0) - (q.downvotes ?? 0);
  return (
    <button
      className="w-full text-left border rounded-lg p-4 hover:bg-gray-50 transition"
      onClick={() => onClick?.(q)}
    >
      <div className="flex gap-6">
        <div className="flex items-center gap-4 text-sm whitespace-nowrap">
          <div className="text-center">
            <div className="font-semibold">{netVotes}</div>
            <div className="text-gray-500">votes</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{q.answers ?? 0}</div>
            <div className="text-gray-500">answers</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{q.views ?? 0}</div>
            <div className="text-gray-500">views</div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="font-medium text-lg truncate">{q.title}</div>
          <div className="text-gray-600 line-clamp-2">{q.text}</div>
          <div className="text-xs text-gray-500 mt-2">
            asked by <span className="font-medium">{q.creator}</span> · {timeAgo(q.createdAt)}
            {q.hasAcceptedAnswer ? " · accepted" : ""}
            {q.status && q.status !== "open" ?  `· ${q.status}` : ""}
          </div>
        </div>
      </div>
    </button>
  );
} 
