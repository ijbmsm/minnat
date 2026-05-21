"use client";

import type { ScoreView } from "@/lib/score";
import { SCORE_VIEW_LABELS } from "@/lib/score";

interface ViewTabsProps {
  current: ScoreView;
  onChange: (view: ScoreView) => void;
}

const VIEWS: ScoreView[] = ["hot", "recent", "midterm", "alltime"];

export function ViewTabs({ current, onChange }: ViewTabsProps) {
  return (
    <div className="flex rounded-lg border border-white/10 p-0.5">
      {VIEWS.map((view) => (
        <button
          key={view}
          onClick={() => onChange(view)}
          className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
            current === view
              ? "bg-white/10 text-white"
              : "text-white/35 hover:text-white/55"
          }`}
        >
          {SCORE_VIEW_LABELS[view]}
        </button>
      ))}
    </div>
  );
}
