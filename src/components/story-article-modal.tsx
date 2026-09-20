"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { StoryArticle, StoryChapter } from "@/types";
import { EVIDENCE_GRADE } from "@/lib/constants";
import { splitParagraphs } from "@/lib/paragraphs";

export interface ModalTarget {
  article: StoryArticle;
  chapter: StoryChapter;
  /** 사안 전체 기사 중 몇 번째인가 (0-based) */
  index: number;
  total: number;
  /** 이 장 안에서 몇 번째인가 (1-based) */
  posInChapter: number;
}

interface Props {
  target: ModalTarget | null;
  onClose: () => void;
  onStep: (delta: -1 | 1) => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * 기사 상세 모달.
 *
 * 접었다 펴는 대신 모달을 쓰는 이유: 펼침은 기사를 "장에 딸린 목록"으로 만들지만,
 * 읽는 사람이 실제로 하고 싶은 건 한 건을 끝까지 보는 것이다. 다만 모달이 흐름을
 * 끊으면 안 되므로 (1) 어느 장의 몇 번째인지 항상 띄우고 (2) 모달 안에서 앞뒤
 * 기사로 바로 넘어갈 수 있게 한다. 사안 전체를 모달만으로 완주할 수 있다.
 */
export function StoryArticleModal({ target, onClose, onStep }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const open = target !== null;
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  // 열릴 때 포커스를 가져오고, 닫을 때 원래 자리로 돌려준다
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    // 패널이 그려진 다음 프레임에 포커스 — 애니메이션 중 스크롤 점프 방지
    const id = requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      restoreRef.current?.focus?.();
    };
  }, [open]);

  // 배경 스크롤 잠금 — 스크롤바 폭만큼 보정해 레이아웃이 튀지 않게
  useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [open]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        onStep(-1);
        return;
      }
      if (e.key === "ArrowRight") {
        onStep(1);
        return;
      }
      if (e.key !== "Tab") return;

      // 포커스 가두기
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose, onStep],
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {target && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
          {/* 배경 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
          />

          {/* 패널 — 모바일은 아래에서 올라오는 시트, 데스크톱은 가운데 다이얼로그 */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={target.article.title}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.99 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.99 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="relative flex max-h-[92vh] w-full max-w-[600px] flex-col overflow-hidden rounded-t-2xl border border-[#242428] bg-[#0e0e10] outline-none sm:max-h-[86vh] sm:rounded-2xl"
          >
            <ModalBody target={target} onClose={onClose} onStep={onStep} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ModalBody({ target, onClose, onStep }: { target: ModalTarget } & Omit<Props, "target">) {
  const { article, chapter, index, total, posInChapter } = target;
  const grade = EVIDENCE_GRADE[article.grade];
  const scrollRef = useRef<HTMLDivElement>(null);

  // 앞뒤로 넘길 때 본문을 맨 위로 — 긴 기사를 읽다 넘기면 중간에서 시작한다
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [article.id]);

  const date = new Date(article.published_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const paragraphs = splitParagraphs(article.body);

  return (
    <>
      {/* 손잡이 (모바일) */}
      <div aria-hidden className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-[#2c2c31] sm:hidden" />

      {/* 흐름 위치 — 모달이 맥락을 끊지 않게 늘 띄운다 */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-[#1c1c1f] px-5 py-3.5 sm:px-6">
        <span className="text-[13px] font-bold" style={{ color: grade.ink }}>
          {chapter.ordinal}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-[#8a8a8a]">
          {chapter.title}
          <span className="text-[#5f5f5f]"> · {posInChapter}/{chapter.articles.length}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8a8a8a] transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
            <path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* 본문 */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-5 sm:px-6">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-[10px] py-[4px] text-[11px] font-semibold"
          style={{ color: grade.ink, backgroundColor: grade.bg, border: `1px solid ${grade.border}` }}
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: grade.ink }} />
          {grade.label}
        </span>

        <h2 className="mt-3.5 text-[22px] font-bold leading-[1.4] tracking-[-0.015em] text-white [text-wrap:pretty]">
          {article.title}
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[13px] text-[#7d7d7d]">
          <span className="tabular-nums">{date}</span>
          <span className="font-medium text-[#b9b9b9]">{article.source_name}</span>
          <span className="text-[#5f5f5f]">{article.source_kind}</span>
        </div>

        {/* 등급이 무슨 뜻인지 — 이걸 빼면 색만 남고 의미가 안 전달된다 */}
        <p
          className="mt-4 rounded-lg px-3.5 py-2.5 text-[12.5px] leading-[1.7]"
          style={{ backgroundColor: grade.bg, color: "#9a9a9a" }}
        >
          {grade.note}
        </p>

        {paragraphs.length > 0 && (
          <div className="mt-5 flex flex-col gap-3.5">
            {paragraphs.map((p, i) => (
              <p key={i} className="m-0 text-[16px] leading-[1.85] text-[#c8c8c8] [text-wrap:pretty]">
                {p}
              </p>
            ))}
          </div>
        )}

        {article.cross_verified && article.cross_verified.length > 0 && (
          <div className="mt-6 border-t border-[#1c1c1f] pt-4">
            <p className="m-0 text-[11px] font-bold tracking-[0.14em] text-[#6f6f6f]">교차검증</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {article.cross_verified.map((n) => (
                <span key={n} className="rounded-md bg-[#17171a] px-2.5 py-1 text-[12px] text-[#a8a8a8]">
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2.5">
          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[#242428] px-3.5 py-2 text-[13px] text-[#7aa7ff] transition-colors hover:border-[#31313a] hover:bg-white/[0.03]"
            >
              원문 보기 ↗
            </a>
          )}
          {article.issue_id && (
            <Link
              href={`/issues/${article.issue_id}`}
              className="rounded-lg border border-[#242428] px-3.5 py-2 text-[13px] text-[#b9b9b9] transition-colors hover:border-[#31313a] hover:bg-white/[0.03]"
            >
              수집된 기록 보기
            </Link>
          )}
        </div>
      </div>

      {/* 앞뒤 이동 — 모달 안에서 사안 전체를 완주할 수 있게 */}
      <div className="flex shrink-0 items-center gap-2 border-t border-[#1c1c1f] bg-[#0b0b0d] px-3 py-2.5 sm:px-4">
        <StepButton dir={-1} disabled={index === 0} onStep={onStep} />
        <span className="flex-1 text-center text-[12px] tabular-nums text-[#6f6f6f]">
          {index + 1} / {total}
        </span>
        <StepButton dir={1} disabled={index === total - 1} onStep={onStep} />
      </div>
    </>
  );
}

function StepButton({
  dir,
  disabled,
  onStep,
}: {
  dir: -1 | 1;
  disabled: boolean;
  onStep: (d: -1 | 1) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onStep(dir)}
      aria-label={dir === -1 ? "이전 기사" : "다음 기사"}
      className="rounded-lg px-3.5 py-2 text-[13px] text-[#b9b9b9] transition-colors enabled:hover:bg-white/[0.06] enabled:hover:text-white disabled:cursor-not-allowed disabled:text-[#3a3a3a]"
    >
      {dir === -1 ? "← 이전" : "다음 →"}
    </button>
  );
}
