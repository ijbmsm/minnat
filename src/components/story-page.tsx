"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Nav } from "./nav";
import { StoryArticleModal, type ModalTarget } from "./story-article-modal";
import { CampChip } from "./camp-chip";
import { EVIDENCE_GRADE, EVIDENCE_GRADE_ORDER } from "@/lib/constants";
import { storyDuration } from "@/lib/story-format";
import type { Storyline, StoryArticle, StoryChapter } from "@/types";

const EASE = [0.32, 0.72, 0, 1] as const;
/** 고정 헤더(56) + 서브내비(40) + 사안 레일(≈60) */
const STICK_OFFSET = 156;

interface Props {
  story: Storyline;
}

/** 모달 URL 파라미터 — 뒤로가기로 닫히고, 링크로 그 기사를 바로 열 수 있다 */
const PARAM = "a";

export function StoryPage({ story }: Props) {
  const [active, setActive] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  /** 우리가 pushState 로 연 것인지. 직접 ?a= 로 들어온 경우 back 하면 사이트를 떠난다 */
  const pushedRef = useRef(false);

  // 사안 전체 기사를 한 줄로 편다 — 모달 앞뒤 이동의 기준
  const flat = useMemo(() => {
    const out: { article: StoryArticle; chapter: StoryChapter; posInChapter: number }[] = [];
    for (const chapter of story.chapters) {
      chapter.articles.forEach((article, i) => {
        out.push({ article, chapter, posInChapter: i + 1 });
      });
    }
    return out;
  }, [story]);

  const target: ModalTarget | null = useMemo(() => {
    if (!openId) return null;
    const i = flat.findIndex((f) => f.article.id === openId);
    if (i < 0) return null;
    return { ...flat[i], index: i, total: flat.length };
  }, [openId, flat]);

  // 최초 진입 시 ?a= 반영 + 뒤로가기 대응
  useEffect(() => {
    const read = () => new URLSearchParams(window.location.search).get(PARAM);
    setOpenId(read());
    const onPop = () => {
      pushedRef.current = false;
      setOpenId(read());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const openArticle = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(PARAM, id);
    window.history.pushState(null, "", url);
    pushedRef.current = true;
    setOpenId(id);
  }, []);

  const closeArticle = useCallback(() => {
    if (pushedRef.current) {
      // 우리가 쌓은 기록이므로 뒤로가기가 곧 닫기다 — popstate 가 상태를 정리한다
      window.history.back();
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete(PARAM);
    window.history.replaceState(null, "", url);
    setOpenId(null);
  }, []);

  /**
   * 앞뒤 기사 이동은 replaceState — 뒤로가기 한 번에 모달 전체가 닫히게.
   *
   * history 조작을 setState 업데이터 안에서 하면 안 된다. 업데이터는 렌더 중에
   * 실행되는데 Next 가 history.replaceState 를 감싸 Router 를 갱신하므로
   * "Cannot update a component (Router) while rendering a different component" 가 난다.
   */
  const stepArticle = useCallback(
    (delta: -1 | 1) => {
      const i = flat.findIndex((f) => f.article.id === openId);
      const next = flat[i + delta];
      if (i < 0 || !next) return;
      const url = new URL(window.location.href);
      url.searchParams.set(PARAM, next.article.id);
      window.history.replaceState(null, "", url);
      setOpenId(next.article.id);
    },
    [flat, openId],
  );

  // 스크롤 위치 → 현재 장
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      let next = 0;
      for (let i = 0; i < story.chapters.length; i++) {
        const el = document.getElementById(chapterDomId(story.chapters[i].id));
        if (el && el.getBoundingClientRect().top <= STICK_OFFSET) next = i;
      }
      setActive((prev) => (prev === next ? prev : next));
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    measure();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [story.chapters]);

  const jump = useCallback((chapterId: string) => {
    const el = document.getElementById(chapterDomId(chapterId));
    if (!el) return;
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - STICK_OFFSET + 16,
      behavior: "smooth",
    });
  }, []);

  const duration = storyDuration(story);
  const current = story.chapters[active];

  return (
    <>
      <Nav />

      {/* 진행 레일 — 긴 문서에서 길을 잃지 않게. 연도가 아니라 국면 이름을 띄운다 */}
      <div className="fixed top-24 z-30 w-full border-b border-white/[0.05] bg-[#0a0a0c]/85 backdrop-blur-xl">
        <div className="mx-auto max-w-[680px] px-5 py-2.5">
          <div className="flex items-center gap-2.5 text-[12.5px]">
            <span className="shrink-0 font-semibold text-white/85">{story.title}</span>
            <span className="min-w-0 flex-1 truncate text-white/45">
              {current?.ordinal} {current?.title}
            </span>
            <span className="shrink-0 tabular-nums text-white/40">
              {active + 1} / {story.chapters.length}
            </span>
          </div>
          <div className="mt-2 flex gap-1">
            {story.chapters.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => jump(c.id)}
                aria-label={`${c.ordinal} ${c.title}`}
                aria-current={i === active}
                className="h-1 flex-1 rounded-full transition-colors"
                style={{ backgroundColor: i <= active ? "#d3a24a" : "#26262a" }}
              />
            ))}
          </div>
        </div>
      </div>

      <main className="min-h-screen bg-[#0a0a0a] px-5 pb-28 text-[#e8e8e8]">
        <div className="mx-auto w-full max-w-[680px]">
          {/* 레일(≈60px)만큼 더 띄운다 */}
          <div className="pt-[152px]">
            <Link href="/stories" className="text-[13px] text-[#8a8a8a] transition-colors hover:text-white">
              ← 사건 추적
            </Link>
          </div>

          {/* 헤더 */}
          <header className="pt-8">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#242428] bg-[#141416] px-3 py-1.5 text-[12.5px] text-[#c8c8c8]">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: story.status === "ongoing" ? "#d3a24a" : "#6f6f6f" }}
                />
                {story.status === "ongoing" ? "진행중" : "종결"} · {duration.label} · {story.status_label}
              </span>
              <CampChip camp={story.camp} />
            </div>

            <h1
              className="m-0 mt-4 font-extrabold leading-[1.2] tracking-[-0.025em] text-white [text-wrap:balance]"
              style={{ fontSize: "clamp(30px, 6vw, 42px)" }}
            >
              {story.title}
            </h1>

            <p className="mt-3 text-[13px] text-[#6f6f6f]">
              기사 {flat.length}건 · {story.chapters.length}개 국면
            </p>
          </header>

          {/* 30초 요약 */}
          <section className="mt-7 rounded-2xl border border-[#1c1c1f] bg-[#0e0e10] px-6 py-6">
            <p className="m-0 text-[11px] font-bold tracking-[0.14em] text-[#d3a24a]">30초 요약</p>
            <div className="mt-4 flex flex-col gap-4">
              {story.lead.map((p, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? "m-0 text-[20px] font-bold leading-[1.6] tracking-[-0.015em] text-white [text-wrap:pretty]"
                      : "m-0 text-[16px] leading-[1.85] text-[#a8a8a8] [text-wrap:pretty]"
                  }
                >
                  {p}
                </p>
              ))}
            </div>

            {story.figures.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-5 border-t border-[#1c1c1f] pt-5 sm:grid-cols-4">
              {story.figures.map((f) => (
                <div key={f.label}>
                  <div className="text-[24px] font-bold leading-none tracking-[-0.03em] tabular-nums text-white">
                    {f.value}
                  </div>
                  <div className="mt-2 text-[12.5px] text-[#6f6f6f]">{f.label}</div>
                </div>
              ))}
            </div>
            )}
          </section>

          {/* 등장인물 */}
          <section className="mt-10">
            <h2 className="m-0 text-[14px] font-semibold tracking-[-0.01em] text-white">등장인물</h2>
            <p className="mt-1 text-[13px] text-[#6f6f6f]">누르면 그 사람이 처음 나오는 장으로 갑니다</p>
            <div className="mt-4 flex flex-col gap-2">
              {story.people.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => p.chapter_ids[0] && jump(p.chapter_ids[0])}
                  className="rounded-xl border border-[#1c1c1f] bg-[#0e0e10] px-4 py-3.5 text-left transition-colors hover:border-[#2c2c31] hover:bg-[#131316]"
                >
                  <span className="flex items-baseline gap-2.5">
                    <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#eaeaea]">{p.name}</span>
                    <span className="ml-auto shrink-0 text-[12px] tabular-nums text-[#6f6f6f]">
                      {p.chapter_ids.map((id) => ordinalOf(story, id)).join("")}장
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[14.5px] leading-[1.7] text-[#8f8f8f] [text-wrap:pretty]">
                    {p.role}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* 범례 */}
          <section className="mt-12">
            <h2 className="m-0 text-[14px] font-semibold tracking-[-0.01em] text-white">어떻게 여기까지 왔나</h2>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12.5px] text-[#6f6f6f]">
              {EVIDENCE_GRADE_ORDER.map((g) => (
                <span key={g} className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-1 w-4 rounded-full"
                    style={{ backgroundColor: EVIDENCE_GRADE[g].ink }}
                  />
                  {EVIDENCE_GRADE[g].label}
                </span>
              ))}
            </div>
          </section>

          {/* 국면 */}
          <div className="mt-2">
            {story.chapters.map((chapter, i) => (
              <ChapterBlock
                key={chapter.id}
                chapter={chapter}
                isLast={i === story.chapters.length - 1}
                onOpen={openArticle}
              />
            ))}
          </div>

          {/* 쟁점 */}
          {story.disputes.length > 0 && (
            <section className="mt-14">
              <h2 className="m-0 text-[14px] font-semibold tracking-[-0.01em] text-white">
                {story.status === "closed" ? "판결 뒤에도 남은 쟁점" : "아직 안 끝난 쟁점"}
              </h2>
              <p className="mt-1 text-[13px] text-[#6f6f6f]">
                우리는 판단하지 않습니다. 양쪽 주장을 그대로 둡니다.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {story.disputes.map((d) => (
                  <div key={d.question} className="rounded-2xl border border-[#1c1c1f] bg-[#0e0e10] px-5 py-5">
                    <p className="m-0 text-[17px] font-bold leading-[1.5] tracking-[-0.015em] text-white [text-wrap:pretty]">
                      {d.question}
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {[
                        { label: "이렇게 주장", side: d.claim, bar: "#e8e8e8" },
                        { label: "이렇게 반박", side: d.counter, bar: "#4a4a4f" },
                      ].map(({ label, side, bar }) => (
                        <div key={label} className="border-l-[3px] pl-3.5" style={{ borderColor: bar }}>
                          <p className="m-0 text-[12.5px] text-[#6f6f6f]">{label}</p>
                          <p className="mt-2 text-[15px] leading-[1.8] text-[#b9b9b9] [text-wrap:pretty]">
                            {side.text}
                          </p>
                          <p className="mt-2.5 text-[12px] text-[#5f5f5f]">{side.source}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 결말 — 종결 사안. 유죄만 크게 보이고 무죄·사면·시효만료가 작으면 그게 편향이다 */}
          {story.outcome && (
            <section className="mt-8 rounded-2xl border border-[#242428] bg-[#0e0e10] px-5 py-5">
              <p className="m-0 text-[11px] font-bold tracking-[0.14em] text-[#6f6f6f]">결말</p>
              <p className="m-0 mt-2.5 text-[22px] font-bold leading-[1.35] tracking-[-0.02em] text-white [text-wrap:pretty]">
                {story.outcome.label}
              </p>
              <p className="m-0 mt-3 text-[15px] leading-[1.85] text-[#a8a8a8] [text-wrap:pretty]">
                {story.outcome.description}
              </p>
            </section>
          )}

          {/* 다음 분기점 */}
          {story.next_branch && (
            <section className="mt-8 rounded-2xl border border-dashed border-[#2c2c31] px-5 py-5">
              <p className="m-0 text-[12.5px] text-[#d3a24a]">다음 분기점</p>
              <p className="m-0 mt-2 text-[20px] font-bold tracking-[-0.02em] text-white">
                {story.next_branch.date.replace(/-/g, ".")} {story.next_branch.title}
              </p>
              {story.next_branch.description && (
                <p className="m-0 mt-3 text-[14.5px] leading-[1.8] text-[#8a8a8a] [text-wrap:pretty]">
                  {story.next_branch.description}
                </p>
              )}
            </section>
          )}

          {/* 이어지는 사건 */}
          {story.related.length > 0 && (
            <section className="mt-12">
              <h2 className="m-0 text-[14px] font-semibold tracking-[-0.01em] text-white">이어지는 사건</h2>
              <div className="mt-4 flex flex-col gap-2">
                {story.related.map((r) => {
                  const inner = (
                    <>
                      <span className="flex flex-wrap items-baseline gap-2.5">
                        <span className="rounded-md bg-[#17171a] px-2 py-1 text-[11.5px] text-[#d3a24a]">
                          {r.kind}
                        </span>
                        <span className="text-[16px] font-medium tracking-[-0.01em] text-[#eaeaea]">{r.name}</span>
                      </span>
                      <span className="mt-2 block text-[14.5px] leading-[1.7] text-[#8f8f8f] [text-wrap:pretty]">
                        {r.why}
                      </span>
                    </>
                  );
                  const cls =
                    "block rounded-xl border border-[#1c1c1f] bg-[#0e0e10] px-4 py-4 text-left";
                  return r.slug ? (
                    <Link
                      key={r.name}
                      href={`/stories/${r.slug}`}
                      className={`${cls} transition-colors hover:border-[#2c2c31] hover:bg-[#131316]`}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div key={r.name} className={cls}>
                      {inner}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <p className="mt-10 text-[13px] leading-[1.8] text-[#5f5f5f]">
            국면 구분과 등급은 판결·처분 기록에서 규칙으로 계산하고, 설명 문장은 수집된 기사
            요약을 바탕으로 자동 생성합니다. 등급은 사실 여부가 아니라 &lsquo;무엇으로
            확인됐는지&rsquo;를 표시합니다. 오류가 있으면{" "}
            <Link href="/report" className="text-[#7aa7ff] hover:underline">
              정정 요청
            </Link>
            을 남겨 주세요.
          </p>
        </div>
      </main>

      <StoryArticleModal target={target} onClose={closeArticle} onStep={stepArticle} />
    </>
  );
}

function ChapterBlock({
  chapter,
  isLast,
  onOpen,
}: {
  chapter: StoryChapter;
  isLast: boolean;
  onOpen: (id: string) => void;
}) {
  const grade = EVIDENCE_GRADE[chapter.grade];

  return (
    <div id={chapterDomId(chapter.id)} className="pt-6" style={{ scrollMarginTop: STICK_OFFSET }}>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45, ease: EASE }}
        className="overflow-hidden rounded-2xl border border-[#1c1c1f] bg-[#0e0e10]"
      >
        {/* 등급 띠 — 이 장 전체가 어떤 성격인지 */}
        <div aria-hidden className="h-[3px]" style={{ backgroundColor: grade.ink }} />

        <div className="px-5 py-5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="text-[17px] font-bold" style={{ color: grade.ink }}>
              {chapter.ordinal}
            </span>
            <span className="text-[13px] tabular-nums text-[#6f6f6f]">{chapter.when}</span>
            <span
              className="ml-auto rounded-md px-2.5 py-1 text-[11.5px] font-semibold"
              style={{ color: grade.ink, backgroundColor: grade.bg }}
            >
              {grade.label}
            </span>
          </div>

          <h3 className="m-0 mt-3 text-[23px] font-bold leading-[1.4] tracking-[-0.025em] text-white [text-wrap:pretty]">
            {chapter.title}
          </h3>
          <p className="m-0 mt-3.5 text-[16px] leading-[1.9] text-[#a8a8a8] [text-wrap:pretty]">{chapter.body}</p>

          {/* 근거 기사 — 접지 않는다. 한 건을 누르면 모달에서 끝까지 읽는다 */}
          <div className="mt-6 border-t border-[#1c1c1f] pt-4">
            <p className="m-0 text-[11px] font-bold tracking-[0.14em] text-[#6f6f6f]">
              근거 기사 {chapter.articles.length}건
            </p>
            <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0">
              {chapter.articles.map((a) => (
                <li key={a.id}>
                  <ArticleRow article={a} onOpen={onOpen} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.section>

      {/* 인과 한 줄 — 시간순 나열을 이야기로 만드는 지점 */}
      {chapter.link && !isLast && (
        <div className="flex flex-col items-center gap-2.5 pt-5">
          <span aria-hidden className="h-4 w-px bg-[#2c2c31]" />
          <p className="m-0 max-w-[380px] text-center text-[14.5px] font-medium leading-[1.6] text-[#d3a24a] [text-wrap:pretty]">
            {chapter.link}
          </p>
          <span aria-hidden className="h-4 w-px bg-[#2c2c31]" />
        </div>
      )}
    </div>
  );
}

function ArticleRow({ article, onOpen }: { article: StoryArticle; onOpen: (id: string) => void }) {
  const grade = EVIDENCE_GRADE[article.grade];
  return (
    <button
      type="button"
      onClick={() => onOpen(article.id)}
      className="group flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.035]"
    >
      <span
        aria-hidden
        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: grade.ink }}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] leading-[1.6] text-[#c8c8c8] transition-colors group-hover:text-white [text-wrap:pretty]">
          {article.title}
        </span>
        <span className="mt-1 block text-[12.5px] text-[#6f6f6f]">
          {article.published_at.replace(/-/g, ".")} · {article.source_name} · {grade.label}
        </span>
      </span>
      <span
        aria-hidden
        className="mt-[3px] shrink-0 text-[14px] text-[#3a3a3a] transition-colors group-hover:text-[#8a8a8a]"
      >
        ↗
      </span>
    </button>
  );
}

function chapterDomId(id: string) {
  return `ch-${id}`;
}

function ordinalOf(story: Storyline, chapterId: string) {
  return story.chapters.find((c) => c.id === chapterId)?.ordinal ?? "";
}
