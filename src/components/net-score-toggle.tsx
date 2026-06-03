"use client";

interface NetScoreToggleProps {
  mode: "gross" | "net";
  onChange: (mode: "gross" | "net") => void;
}

export function NetScoreToggle({ mode, onChange }: NetScoreToggleProps) {
  return (
    <div className="inline-flex rounded-full bg-white/[0.04] p-0.5" role="tablist">
      {(["gross", "net"] as const).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-300 ${
              active
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {m === "gross" ? "원점수" : "감경 반영"}
          </button>
        );
      })}
    </div>
  );
}
