export function timeAgo(ts) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - Number(ts)) / 1000);
  const units = [
    ["yr", 365246060],
    ["mo", 30246060],
    ["d", 246060],
    ["h", 60*60],
    ["m", 60],
    ["s", 1],
  ];
  for (const [label, size] of units) {
    const v = Math.floor(s / size);
    if (v >= 1) return `${v} ${label}${v>1?"s":""} ago`;
  }
  return "just now";
} 
