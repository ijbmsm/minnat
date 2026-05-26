"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase/client";
import { CAMP_COLORS } from "@/lib/constants";
import type { DisplayCamp } from "@/types";

const CAMP_OPTIONS: { value: DisplayCamp; label: string; description: string; color: string }[] = [
  { value: "red", label: "국민의힘", description: "보수", color: CAMP_COLORS.red.primary },
  { value: "blue", label: "더불어민주당", description: "진보", color: CAMP_COLORS.blue.primary },
  { value: "free", label: "무관", description: "중립 / 기타", color: "#666" },
];

function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [selected, setSelected] = useState<DisplayCamp | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!selected) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    await supabase
      .from("user_profiles")
      .update({ display_camp: selected })
      .eq("id", user.id);

    router.push(next);
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="mb-2 text-center text-2xl font-bold">정치 성향을 알려주세요</h1>
      <p className="mb-8 text-center text-sm text-white/75">
        지지하는 정당을 선택해주세요. 언제든 변경할 수 있습니다.
      </p>

      <div className="mb-8 grid grid-cols-3 gap-3">
        {CAMP_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`rounded-2xl p-5 text-center transition-colors duration-200 outline-none ${
              selected === opt.value
                ? "bg-white/[0.08] border border-white/20"
                : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]"
            }`}
          >
            <p className="text-sm font-semibold" style={{ color: opt.color === "#666" ? "rgba(255,255,255,0.9)" : opt.color }}>{opt.label}</p>
            <p className="mt-0.5 text-[11px] text-white/75">{opt.description}</p>
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected || loading}
        className="w-full rounded-xl bg-white/10 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15 disabled:opacity-30"
      >
        {loading ? "저장 중..." : "선택 완료"}
      </button>

      <button
        onClick={() => router.push(next)}
        className="mt-3 w-full py-2 text-xs text-white/75 transition-colors hover:text-white"
      >
        나중에 선택하기
      </button>
    </div>
  );
}

export default function SetupPage() {
  return (
    <>
      <Nav />
      <main className="flex min-h-[80dvh] flex-col items-center justify-center px-4 pt-14">
        <Suspense fallback={<div className="text-sm text-white/75">로딩...</div>}>
          <SetupForm />
        </Suspense>
      </main>
    </>
  );
}
