"use client";

/**
 * 기사 상세의 참여 요소 — 이슈 라인 팔로우 · 댓글.
 *
 * 둘 다 021 마이그레이션에 의존한다. 아직 적용되지 않은 환경에서는 API 가
 * `available: false` 를 주고, 여기서는 섹션을 통째로 숨긴다 (에러 화면을 띄우지 않는다).
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COMMENT_MAX, type CommentsResponse, type IssueCommentDto, type CommentSort } from "@/lib/engagement";

// 상세 페이지와 같은 토큰
const CAMP_BADGE: Record<IssueCommentDto["camp"], { label: string; color: string; bg: string }> = {
  blue: { label: "진보", color: "#7aa7ff", bg: "rgba(59,130,246,.14)" },
  red:  { label: "보수", color: "#ff8a8a", bg: "rgba(239,68,68,.14)" },
  free: { label: "중도", color: "#a8a8a8", bg: "#1a1a1a" },
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

// ── 이슈 라인 팔로우 ──────────────────────────────────────────────────────

export function FollowButton({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [state, setState] = useState<{ available: boolean; loggedIn: boolean; following: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/issues/${issueId}/follow`)
      .then(r => r.json())
      .then(j => { if (alive) setState(j); })
      .catch(() => { if (alive) setState({ available: false, loggedIn: false, following: false }); });
    return () => { alive = false; };
  }, [issueId]);

  if (!state?.available) return null;

  const onClick = async () => {
    if (!state.loggedIn) { router.push("/auth/login"); return; }
    if (busy) return;
    const next = !state.following;
    setState({ ...state, following: next });   // 낙관적
    setBusy(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following: next }),
      });
      if (!res.ok) setState(s => (s ? { ...s, following: !next } : s));   // 롤백
    } catch {
      setState(s => (s ? { ...s, following: !next } : s));
    } finally { setBusy(false); }
  };

  const on = state.following;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={
        "rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors " +
        (on
          ? "border border-[#e8e8e8] bg-[#e8e8e8] text-[#0a0a0a]"
          : "border border-[#242424] bg-transparent text-[#a8a8a8] hover:border-[#3a3a3a]")
      }
    >
      {on ? "팔로우 중 ✓" : "이슈 라인 팔로우"}
    </button>
  );
}

// ── 댓글 ──────────────────────────────────────────────────────────────────

export function CommentsSection({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [data, setData] = useState<CommentsResponse | null>(null);
  const [sort, setSort] = useState<CommentSort>("top");
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((s: CommentSort) => {
    fetch(`/api/issues/${issueId}/comments?sort=${s}`)
      .then(r => r.json())
      .then((j: CommentsResponse) => setData(j))
      .catch(() => setData({ available: false, total: 0, items: [], loggedIn: false }));
  }, [issueId]);

  useEffect(() => { load(sort); }, [load, sort]);

  if (!data?.available) return null;

  const submit = async () => {
    const body = draft.trim();
    if (body.length < 2 || submitting) return;
    if (!data.loggedIn) { router.push("/auth/login"); return; }

    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const j = await res.json() as { item?: IssueCommentDto; error?: string };
      if (!res.ok || !j.item) { setError(j.error ?? "등록하지 못했습니다"); return; }
      setDraft("");
      setSort("new");
      setData(d => (d ? { ...d, total: d.total + 1, items: [j.item!, ...d.items] } : d));
    } catch {
      setError("네트워크 오류. 입력한 내용은 그대로 있습니다");
    } finally { setSubmitting(false); }
  };

  const toggleLike = async (c: IssueCommentDto) => {
    if (!data.loggedIn) { router.push("/auth/login"); return; }
    const next = !c.likedByMe;
    setData(d => d ? {
      ...d,
      items: d.items.map(i => i.id === c.id
        ? { ...i, likedByMe: next, likeCount: Math.max(0, i.likeCount + (next ? 1 : -1)) }
        : i),
    } : d);
    try {
      const res = await fetch(`/api/issues/comments/${c.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setData(d => d ? {
        ...d,
        items: d.items.map(i => i.id === c.id
          ? { ...i, likedByMe: !next, likeCount: Math.max(0, i.likeCount + (next ? -1 : 1)) }
          : i),
      } : d);
    }
  };

  const canSubmit = draft.trim().length >= 2 && !submitting;

  return (
    <section className="mt-14 border-t border-[#1e1e1e] pt-16">
      <div className="mb-6 flex items-baseline gap-3">
        <h2 className="m-0 text-[22px] font-bold tracking-[-0.01em] text-white">댓글</h2>
        <span className="text-[15px] font-semibold tabular-nums text-[#6f6f6f]">{data.total}</span>
        <div className="ml-auto flex gap-1.5" role="tablist" aria-label="댓글 정렬">
          {(["top", "new"] as const).map(s => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={sort === s}
              onClick={() => setSort(s)}
              className={
                "rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-colors hover:text-[#e8e8e8] " +
                (sort === s ? "text-[#e8e8e8]" : "text-[#6f6f6f]")
              }
            >
              {s === "top" ? "공감순" : "최신순"}
            </button>
          ))}
        </div>
      </div>

      {/* 작성 박스 */}
      <div className="rounded-[14px] border border-[#1c1c1f] bg-[#0e0e10] px-5 py-[18px]">
        <textarea
          rows={3}
          value={draft}
          onChange={e => setDraft(e.target.value.slice(0, COMMENT_MAX))}
          placeholder="이 사건에 대한 생각을 남겨주세요. 근거 없는 비방은 삭제됩니다."
          className="block w-full resize-y border-0 bg-transparent p-0 text-[15px] leading-[1.65] text-[#e8e8e8] outline-none placeholder:text-[#4f4f4f]"
        />
        <div className="mt-4 flex items-center gap-3 border-t border-[#1a1a1a] pt-3.5">
          <span className="text-xs text-[#5f5f5f]">
            {data.loggedIn ? "이름은 일부만 공개됩니다" : "로그인 후 작성할 수 있습니다"}
          </span>
          <span className="ml-auto text-xs tabular-nums text-[#5f5f5f]">{draft.length} / {COMMENT_MAX}</span>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={
              "rounded-full border-0 px-[18px] py-2 text-sm font-bold transition-colors " +
              (canSubmit ? "cursor-pointer bg-[#e8e8e8] text-[#0a0a0a]" : "cursor-default bg-[#1c1c1f] text-[#6f6f6f]")
            }
          >
            {submitting ? "등록 중…" : "등록"}
          </button>
        </div>
        {error && <p className="mt-2.5 text-xs text-[#ff8a8a]">{error}</p>}
      </div>

      {/* 목록 */}
      <div className="mt-3">
        {data.items.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-[#5f5f5f]">첫 댓글을 남겨보세요.</p>
        ) : (
          data.items.map(c => {
            const badge = CAMP_BADGE[c.camp];
            return (
              <article key={c.id} className="border-b border-[#18181b] py-6">
                <div className="mb-2.5 flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {c.initial}
                  </span>
                  <span className="text-sm font-bold text-[#dcdcdc]">{c.maskedName}</span>
                  <span
                    className="rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  <span className="ml-auto text-xs text-[#5f5f5f]">{relTime(c.createdAt)}</span>
                </div>
                <p className="m-0 max-w-[70ch] whitespace-pre-wrap text-[15px] leading-[1.75] text-[#c4c4c4]">
                  {c.body}
                </p>
                <div className="mt-3 flex gap-[18px]">
                  <button
                    type="button"
                    onClick={() => toggleLike(c)}
                    className={
                      "border-0 bg-transparent p-0 text-[13px] font-semibold transition-colors hover:text-[#e8e8e8] " +
                      (c.likedByMe ? "text-[#e8e8e8]" : "text-[#6f6f6f]")
                    }
                  >
                    공감 <span className="tabular-nums">{c.likeCount}</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <p className="mt-6 text-xs leading-[1.7] text-[#5f5f5f]">
        댓글의 진영 표시는 본인이 설정에서 고른 값입니다. 서비스가 추정하지 않습니다.
      </p>
    </section>
  );
}
