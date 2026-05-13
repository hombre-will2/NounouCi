import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { api } from "../lib/api";

function getOrCreateVisitorId() {
  try {
    let id = localStorage.getItem("nc_visitor_id");
    if (!id) {
      id = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("nc_visitor_id", id);
    }
    return id;
  } catch (e) {
    return null;
  }
}

function formatCount(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + " M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + " K";
  return n.toString();
}

export default function VisitorCounter() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    api
      .post("/visitors/track", null, {
        headers: visitorId ? { "X-Visitor-Id": visitorId } : {},
      })
      .then(({ data }) => setCount(data.count))
      .catch(() => {
        api.get("/visitors/count")
          .then(({ data }) => setCount(data.count))
          .catch(() => {});
      });
  }, []);

  if (count == null || count < 1) return null;

  return (
    <div
      data-testid="visitor-counter"
      className="inline-flex flex-col items-center px-8 sm:px-12 py-5 rounded-3xl bg-orange-50/80 border border-orange-100 shadow-sm"
    >
      <Users className="w-7 h-7 text-terracotta mb-1" />
      <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Plus de</span>
      <span data-testid="visitor-count" className="font-display text-5xl sm:text-6xl text-terracotta leading-none my-1">
        {formatCount(count)}
      </span>
      <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">visiteurs</span>
    </div>
  );
}
