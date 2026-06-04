"use client";

import { useState } from "react";
import { Nav } from "@/components/nav";
import { CATEGORIES } from "@/lib/constants";
import Link from "next/link";

const SCORED_OPTIONS = CATEGORIES.filter((c) => c.isScored);

export default function ReportPage() {
  const [form, setForm] = useState({
    reporter_name: "",
    actor_name: "",
    category: "",
    description: "",
    source_url: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "제보 등록에 실패했습니다");
        setStatus("error");
        return;
      }

      setStatus("success");
      setForm({ reporter_name: "", actor_name: "", category: "", description: "", source_url: "" });
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다");
      setStatus("error");
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 pt-24 pb-20 md:px-8">
        <Link
          href="/politics"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-white"
        >
          <span>&larr;</span>
          <span>스코어보드</span>
        </Link>

        <div className="mb-10">
          <span className="mb-3 block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/75 uppercase w-fit">
            누락 기록 제보
          </span>
          <h1 className="text-3xl font-bold tracking-tight">공식 처분 제보</h1>
          <p className="mt-2 text-sm text-white/75">
            누락된 공식 처분(법원 판결, 검찰 기소, 선관위 처분 등)을 제보해주세요.
            <br />
            반드시 공식 출처 URL이 필요합니다. 검증 후 반영됩니다.
          </p>
        </div>

        {status === "success" ? (
          <div className="rounded-2xl bg-green-500/5 p-8 text-center ring-1 ring-green-500/10">
            <p className="text-lg font-semibold text-green-400/70">제보가 등록되었습니다</p>
            <p className="mt-2 text-sm text-white/75">
              검토 후 반영됩니다. 감사합니다.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 rounded-full bg-white/5 px-6 py-2 text-sm text-white/75 transition-colors hover:bg-white/10"
            >
              추가 제보하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 닉네임 */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/75">닉네임 (선택)</label>
              <input
                type="text"
                placeholder="익명"
                value={form.reporter_name}
                onChange={(e) => setForm({ ...form, reporter_name: e.target.value })}
                className="w-full rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white ring-1 ring-white/5 placeholder:text-white/75 focus:outline-none focus:ring-white/15"
              />
            </div>

            {/* 대상 정치인 */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/75">
                대상 정치인 <span className="text-red-400/50">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 이재명, 윤석열"
                value={form.actor_name}
                onChange={(e) => setForm({ ...form, actor_name: e.target.value })}
                className="w-full rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white ring-1 ring-white/5 placeholder:text-white/75 focus:outline-none focus:ring-white/15"
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/75">
                처분 유형 <span className="text-red-400/50">*</span>
              </label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white ring-1 ring-white/5 focus:outline-none focus:ring-white/15"
              >
                <option value="" className="bg-[#0c0c10]">선택하세요</option>
                {SCORED_OPTIONS.map((c) => (
                  <option key={c.key} value={c.key} className="bg-[#0c0c10]">
                    {c.label} — {c.description}
                  </option>
                ))}
              </select>
            </div>

            {/* 설명 */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/75">
                내용 <span className="text-red-400/50">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="어떤 공식 처분이 누락되었는지 설명해주세요"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full resize-none rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white ring-1 ring-white/5 placeholder:text-white/75 focus:outline-none focus:ring-white/15"
              />
            </div>

            {/* 출처 URL */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/75">
                출처 URL <span className="text-red-400/50">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://www.law.go.kr/..."
                value={form.source_url}
                onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                className="w-full rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white ring-1 ring-white/5 placeholder:text-white/75 focus:outline-none focus:ring-white/15"
              />
              <p className="mt-1 text-[11px] text-white/75">
                법원, 검찰, 선관위, 감사원, 언론사 등 공식 출처만 인정됩니다
              </p>
            </div>

            {/* 에러 */}
            {status === "error" && (
              <p className="text-sm text-red-400/70">{errorMsg}</p>
            )}

            {/* 제출 */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-white/10 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15 disabled:opacity-50"
            >
              {status === "loading" ? "제출 중..." : "제보하기"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
