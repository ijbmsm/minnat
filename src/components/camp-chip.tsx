import { CAMP_COLORS } from "@/lib/constants";
import type { Camp } from "@/types";

/**
 * 사안의 진영 표시. 주 대상 기준이며, 양측이 모두 처분 대상이면 "양측".
 * 서버 컴포넌트에서도 쓰이므로 클라이언트 경계를 두지 않는다.
 */
export function CampChip({ camp }: { camp: Camp | "both" }) {
  if (camp === "both") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[#242428] bg-[#141416] px-3 py-1.5 text-[12.5px] text-[#c8c8c8]">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
        <span aria-hidden className="-ml-1 h-1.5 w-1.5 rounded-full bg-[#dc2626]" />
        양측
      </span>
    );
  }
  const c = CAMP_COLORS[camp];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px]"
      style={{ color: c.glow, backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.primary }} />
      {c.label}
    </span>
  );
}
