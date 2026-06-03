"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { buildSeolgiIndex, type SeolgiIndex, type SeolgiRow } from "@/lib/saju/seolgi-loader";
import { computeFourPillars, fromKST, type FourPillars, type Pillar } from "@/lib/saju/engine";
import { STEM_DATA, BRANCH_DATA, ELEMENT_COLOR, SIPSHIN_DESC, getCompat } from "@/lib/saju";
import { getSipshin, getBranchSipshin } from "@/lib/saju/sipshin";
import { DAY_MASTER_PROFILE, ELEMENT_COMMENT } from "@/lib/saju/interpret";
import type { Element, Stem } from "@/lib/saju/constants";
import type { ReadingSection, ReadingResponse } from "@/app/api/saju/reading/route";
import { lunarToSolar } from "@/lib/saju/lunar";

// ── 월운 계산용 상수 ──
const TIGER_MONTH_STEM = [2, 4, 6, 8, 0] as const; // 오호둔

// ── 출생지 데이터 ──
const DOMESTIC_CITIES: { label: string; lon: number }[] = [
  { label: '서울',     lon: 127.0 }, { label: '부산',   lon: 129.1 },
  { label: '인천',     lon: 126.7 }, { label: '대구',   lon: 128.6 },
  { label: '대전',     lon: 127.4 }, { label: '광주',   lon: 126.9 },
  { label: '울산',     lon: 129.3 }, { label: '수원',   lon: 127.0 },
  { label: '창원',     lon: 128.7 }, { label: '고양',   lon: 126.8 },
  { label: '성남',     lon: 127.1 }, { label: '청주',   lon: 127.5 },
  { label: '전주',     lon: 127.1 }, { label: '안산',   lon: 126.8 },
  { label: '안양',     lon: 126.9 }, { label: '천안',   lon: 127.2 },
  { label: '포항',     lon: 129.4 }, { label: '원주',   lon: 127.9 },
  { label: '춘천',     lon: 127.7 }, { label: '강릉',   lon: 128.9 },
  { label: '목포',     lon: 126.4 }, { label: '여수',   lon: 127.7 },
  { label: '순천',     lon: 127.5 }, { label: '경주',   lon: 129.2 },
  { label: '제주',     lon: 126.5 }, { label: '서귀포', lon: 126.6 },
  { label: '구미',     lon: 128.3 }, { label: '진주',   lon: 128.1 },
  { label: '거제',     lon: 128.6 }, { label: '통영',   lon: 128.4 },
  { label: '속초',     lon: 128.6 }, { label: '의정부', lon: 127.0 },
];

const OVERSEAS_CITIES: { label: string; lon: number }[] = [
  { label: '도쿄',       lon: 139.7 }, { label: '오사카',   lon: 135.5 },
  { label: '베이징',     lon: 116.4 }, { label: '상하이',   lon: 121.5 },
  { label: '홍콩',       lon: 114.2 }, { label: '싱가포르', lon: 103.8 },
  { label: '방콕',       lon: 100.5 }, { label: '하노이',   lon: 105.8 },
  { label: '시드니',     lon: 151.2 }, { label: '멜버른',   lon: 144.9 },
  { label: 'LA',         lon: -118.2 }, { label: 'NY',      lon: -74.0 },
  { label: '시카고',     lon: -87.6 }, { label: '시애틀',  lon: -122.3 },
  { label: '밴쿠버',     lon: -123.1 }, { label: '토론토',  lon: -79.4 },
  { label: '런던',       lon: -0.1  }, { label: '파리',    lon: 2.3   },
  { label: '프랑크푸르트', lon: 8.7  }, { label: '두바이',  lon: 55.3  },
];

// ── seolgi.json 로더 (클라이언트 캐시) ──
let seolgiCache: SeolgiIndex | null = null;

async function loadSeolgi(): Promise<SeolgiIndex> {
  if (seolgiCache) return seolgiCache;
  const res = await fetch("/seolgi.json");
  const rows: SeolgiRow[] = await res.json();
  seolgiCache = buildSeolgiIndex(rows);
  return seolgiCache;
}

// ── 계산 결과 → UI용 데이터 변환 ──
interface BirthParams {
  year: number; month: number; day: number;
  hour: number | null; sex: 'male' | 'female';
  longitudeE: number;
  name?: string;
  concern?: string;
}

interface SajuUIResult {
  pillars:   FourPillars;
  dayMaster: {
    stem: Stem; hanja: string; element: Element; image: string;
    profile: typeof DAY_MASTER_PROFILE[keyof typeof DAY_MASTER_PROFILE];
  };
  elements: { el: Element; count: number; color: string; comment: string | null }[];
  sipshinMap: Record<string, string | null>;
  birth: BirthParams;
}

function buildUIResult(fp: FourPillars, birth: BirthParams): SajuUIResult {
  const dm = fp.day.stem;
  const dmData = STEM_DATA[dm];

  // 오행 카운트 (8자 기준)
  const active = [fp.year, fp.month, fp.day, ...(fp.hour ? [fp.hour] : [])];
  const elemCount: Record<Element, number> = { 목:0, 화:0, 토:0, 금:0, 수:0 };
  for (const p of active) {
    elemCount[STEM_DATA[p.stem].element]++;
    elemCount[BRANCH_DATA[p.branch].element]++;
  }
  const total = Object.values(elemCount).reduce((s,v)=>s+v,0);

  const elements = (['목','화','토','금','수'] as Element[]).map(el => {
    const count = elemCount[el];
    const ratio = count / total;
    let comment: string | null = null;
    if (ratio >= 0.5)  comment = ELEMENT_COMMENT[el].excess;
    else if (count===0) comment = ELEMENT_COMMENT[el].lack;
    return { el, count, color: ELEMENT_COLOR[el], comment };
  });

  const sipshinMap: Record<string, string | null> = {
    yearStem:          getSipshin(dm, fp.year.stem),
    yearBranch:        getBranchSipshin(dm, fp.year.branch),
    monthStem:         getSipshin(dm, fp.month.stem),
    monthBranch:       getBranchSipshin(dm, fp.month.branch),
    dayStem:           '본인',
    dayBranch:         getBranchSipshin(dm, fp.day.branch),
    hourStem:          fp.hour ? getSipshin(dm, fp.hour.stem) : null,
    hourBranch:        fp.hour ? getBranchSipshin(dm, fp.hour.branch) : null,
  };

  return {
    pillars: fp,
    dayMaster: { stem: dm, hanja: dmData.hanja, element: dmData.element, image: dmData.image, profile: DAY_MASTER_PROFILE[dm] },
    elements,
    sipshinMap,
    birth,
  };
}

// ── 세운 행 ──
const STEMS_ARR = ['갑','을','병','정','무','기','경','신','임','계'] as const;
const BRANCHES_ARR = ['자','축','인','묘','진','사','오','미','신','유','술','해'] as const;
const mod = (n: number, m: number) => ((n % m) + m) % m;

function calcSeyunPillar(year: number) {
  const gz = mod(year - 4, 60);
  const stem = STEMS_ARR[gz % 10];
  const branch = BRANCHES_ARR[gz % 12];
  return { stem, branch, gz };
}

function SeyunRow({ dm }: { dm: Stem }) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] text-white/35 tracking-widest mb-3">세운 (년운)</p>
      <div className="flex gap-3">
        {years.map((y, i) => {
          const { stem, branch } = calcSeyunPillar(y);
          const se = STEM_DATA[stem];
          const be = BRANCH_DATA[branch];
          const ss = getSipshin(dm, stem);
          const sb = getBranchSipshin(dm, branch);
          return (
            <div key={y} className={`flex-1 flex items-center gap-3 rounded-xl px-3 py-2.5 border ${i === 0 ? 'border-white/15 bg-white/[0.05]' : 'border-white/5'}`}>
              <div>
                <p className="text-[10px] text-white/35 mb-1">{y}년{i === 0 ? ' ·올해' : ''}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold" style={{ color: ELEMENT_COLOR[se.element] }}>{stem}</span>
                  <span className="text-xl font-bold" style={{ color: ELEMENT_COLOR[be.element] }}>{branch}</span>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] text-white/40">{ss}</p>
                <p className="text-[10px] text-white/30">{sb}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 궁 설명 ──
const PALACE_DESC: Record<string, { sub: string; meaning: string }> = {
  년: { sub: '뿌리',  meaning: '타고난 바탕 · 조상 · 어린 시절' },
  월: { sub: '환경',  meaning: '성장 환경 · 부모 · 사회적 모습' },
  일: { sub: '나',    meaning: '나 자신 · 배우자 · 핵심 자아' },
  시: { sub: '활동',  meaning: '활동 방식 · 자녀 · 노년 · 꿈' },
};

// ── 십신 배지 (클릭하면 설명 펼침) ──
function SipshinBadge({ name }: { name: string | null | undefined }) {
  const [open, setOpen] = useState(false);
  if (!name) return <span className="h-4" />;
  const desc = SIPSHIN_DESC[name as keyof typeof SIPSHIN_DESC];
  return (
    <button onClick={() => setOpen(o => !o)} className="group text-center">
      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] transition-all
        ${open ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'}`}>
        {name}
      </span>
      <AnimatePresence>
        {open && desc && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <p className="mt-1 text-[9px] text-white/40 leading-tight w-16 text-center mx-auto">{desc.short}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// ── PillarCell ──
function PillarCell({ label, pillar, sipshinStem, sipshinBranch, isDay }: {
  label: string; pillar: Pillar;
  sipshinStem?: string | null; sipshinBranch?: string | null; isDay?: boolean;
}) {
  const stemEl   = STEM_DATA[pillar.stem];
  const branchEl = BRANCH_DATA[pillar.branch];
  const palace   = PALACE_DESC[label];
  return (
    <div className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 ${isDay ? 'border-white/20 bg-white/[0.07]' : 'border-white/8 bg-white/[0.03]'}`}>
      <div className="text-center">
        <span className={`text-xs font-semibold ${isDay ? 'text-white' : 'text-white/50'}`}>{label}주</span>
        {palace && <p className="text-[9px] text-white/25 leading-tight">{palace.sub}</p>}
      </div>
      <SipshinBadge name={sipshinStem} />
      <span className="text-3xl font-bold leading-none" style={{ color: ELEMENT_COLOR[stemEl.element] }}>{pillar.stem}</span>
      <span className="text-[9px] text-white/30">{stemEl.image}</span>
      <div className="my-0.5 h-px w-full bg-white/8" />
      <span className="text-3xl font-bold leading-none" style={{ color: ELEMENT_COLOR[branchEl.element] }}>{pillar.branch}</span>
      <span className="text-[9px] text-white/30">{branchEl.animal}</span>
      <SipshinBadge name={sipshinBranch} />
    </div>
  );
}

// ── 공유 카드 모달 ──
interface ShareParams {
  stem: string; hanja: string; element: string;
  image: string; name: string; keywords: string; core: string;
}

function ShareModal({ params, onClose }: { params: ShareParams; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const ogUrl = `/api/saju/og?${new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString()}`;

  async function download() {
    setDownloading(true);
    try {
      const blob = await fetch(ogUrl).then(r => r.blob());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = '사주카드.png';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally { setDownloading(false); }
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: '내 사주', text: `${params.name ? params.name + '님의 ' : ''}사주 카드`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* user cancelled */ }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="rounded-2xl border border-white/10 bg-zinc-950 p-4 w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white">사주 카드 공유</p>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none">×</button>
        </div>

        {/* 카드 미리보기 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ogUrl}
          alt="사주 카드"
          className="w-full rounded-xl mb-3 border border-white/8"
          style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
        />

        <div className="flex gap-2">
          <button
            onClick={download} disabled={downloading}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {downloading ? '저장 중...' : '이미지 저장'}
          </button>
          <button
            onClick={share}
            className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm text-white hover:bg-white/15 transition-colors"
          >
            {copied ? '복사됨!' : (typeof navigator !== 'undefined' && 'share' in navigator ? '공유' : 'URL 복사')}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-white/25 text-center">카드를 저장해서 카카오톡·인스타에 공유해봐</p>
      </motion.div>
    </motion.div>
  );
}

type ReadingType = 'full' | 'love' | 'career';
const READING_TYPES: { key: ReadingType; label: string; desc: string }[] = [
  { key: 'full',   label: '종합',   desc: '성격·연애·직업·세운 전체' },
  { key: 'love',   label: '연애',   desc: '연애 스타일과 궁합 유형' },
  { key: 'career', label: '직업',   desc: '직업 적성과 재물 성향' },
];

// ── AI 해석 탭 ──
function ReadingTab({ birth }: { birth: BirthParams }) {
  const [readingType, setReadingType] = useState<ReadingType>('full');
  const [readings, setReadings] = useState<Partial<Record<ReadingType, ReadingResponse>>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const current = readings[readingType];

  async function load(type: ReadingType) {
    if (readings[type]) return; // 이미 있으면 스킵
    setLoading(true); setErr(null);
    try {
      const res = await fetch('/api/saju/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: birth.year, month: birth.month, day: birth.day,
          hour: birth.hour, sex: birth.sex,
          longitudeE: birth.longitudeE,
          name: birth.name, concern: birth.concern,
          tier: 'free', type,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as ReadingResponse;
      setReadings(prev => ({ ...prev, [type]: data }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      {/* 타입 선택 */}
      <div className="flex gap-2">
        {READING_TYPES.map(({ key, label, desc }) => (
          <button key={key} onClick={() => setReadingType(key)}
            className={`flex-1 rounded-xl border py-2.5 px-1 text-center transition-all ${
              readingType === key
                ? 'border-white/20 bg-white/10 text-white'
                : 'border-white/8 bg-transparent text-white/40 hover:text-white/70'
            }`}>
            <p className="text-xs font-medium">{label}</p>
            <p className="text-[9px] mt-0.5 opacity-60">{desc}</p>
          </button>
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      <AnimatePresence mode="wait">
        <motion.div key={readingType} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {!current && !loading && (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-xs text-white/40 text-center">
                {READING_TYPES.find(t => t.key === readingType)?.desc}
              </p>
              <button onClick={() => load(readingType)}
                className="rounded-xl bg-white/10 px-6 py-2.5 text-sm text-white hover:bg-white/15 transition-colors">
                AI 해석 보기
              </button>
              {err && <p className="text-xs text-red-400">{err}</p>}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/70" />
              <p className="text-xs text-white/40">해석 생성 중...</p>
            </div>
          )}

          {current && (
            <div className="space-y-3">
              {current.cautions.length > 0 && (
                <p className="text-[11px] text-yellow-400/70 rounded-lg border border-yellow-400/20 px-3 py-2">
                  ⚠ {current.cautions.join(' · ')}
                </p>
              )}
              {current.sections.map((s, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-2">
                  <p className="text-[10px] text-white/40 tracking-widest">{s.title}</p>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{s.body}</p>
                </div>
              ))}
              {current.cached && <p className="text-[10px] text-white/20 text-center">캐시됨</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── 사주 아이덴티티 카드 ──
function SajuIdentityCard({ dayMaster }: { dayMaster: SajuUIResult['dayMaster'] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-5">
      <p className="text-[10px] text-white/30 tracking-widest mb-3">일간 — 나의 핵심 에너지</p>
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-6xl font-bold leading-none" style={{ color: ELEMENT_COLOR[dayMaster.element] }}>
            {dayMaster.stem}
          </span>
          <div>
            <p className="text-lg font-semibold text-white/80">{dayMaster.hanja}</p>
            <p className="text-xs text-white/40">{dayMaster.image}</p>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {dayMaster.profile.keyword.map(k => (
              <span key={k} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/70">{k}</span>
            ))}
          </div>
          <p className="text-xs text-white/50 leading-relaxed">{dayMaster.profile.core}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-white/30 italic border-t border-white/5 pt-3">{dayMaster.profile.vibe}</p>
    </div>
  );
}

// ── 오행 설명 데이터 ──
const ELEMENT_DESC: Record<string, { meaning: string; represents: string }> = {
  목: { meaning: '성장·방향·추진', represents: '의지, 리더십, 계획력' },
  화: { meaning: '열정·표현·빛',   represents: '감정, 활기, 표현력' },
  토: { meaning: '안정·중심·포용', represents: '신뢰, 인내, 현실감각' },
  금: { meaning: '결단·원칙·완성', represents: '결단력, 완벽주의, 자존심' },
  수: { meaning: '지혜·유연·흐름', represents: '직관, 생각, 적응력' },
};

// ── 결과 뷰 ──
function ResultView({ result }: { result: SajuUIResult }) {
  const { pillars: fp, dayMaster, elements, sipshinMap } = result;
  const [tab, setTab] = useState<'pillars' | 'elements' | 'daeun' | 'monthly' | 'compat' | 'reading'>('pillars');
  const total = elements.reduce((s,e)=>s+e.count,0);

  return (
    <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="mt-6 space-y-4">

      {/* 아이덴티티 카드 */}
      <SajuIdentityCard dayMaster={dayMaster} />

      {/* 4주 표: 시|일|월|년 */}
      <div>
        <p className="text-[10px] text-white/30 mb-2 px-1">사주 8자 — 각 글자를 눌러 십신 설명 보기</p>
        <div className="grid grid-cols-4 gap-1.5">
          {fp.hour ? (
            <PillarCell label="시" pillar={fp.hour} sipshinStem={sipshinMap.hourStem} sipshinBranch={sipshinMap.hourBranch} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/5 py-6 text-white/20 text-xs text-center">시간<br/>미상</div>
          )}
          <PillarCell label="일" pillar={fp.day}   sipshinBranch={sipshinMap.dayBranch} isDay />
          <PillarCell label="월" pillar={fp.month} sipshinStem={sipshinMap.monthStem}  sipshinBranch={sipshinMap.monthBranch} />
          <PillarCell label="년" pillar={fp.year}  sipshinStem={sipshinMap.yearStem}   sipshinBranch={sipshinMap.yearBranch} />
        </div>
      </div>

      {/* 세운 */}
      <SeyunRow dm={fp.day.stem} />

      {/* 경계 주의 */}
      {fp.trace.boundaryCaution && (
        <p className="text-[11px] text-yellow-400/70 rounded-lg border border-yellow-400/20 px-3 py-2">
          ⚠ 절기 경계 ±3분 이내 출생 — 월주가 달라질 수 있습니다.
        </p>
      )}

      {/* 탭 */}
      <div className="flex overflow-x-auto rounded-xl border border-white/8 p-0.5 gap-0.5 scrollbar-none">
        {([['pillars','사주풀이'],['elements','오행'],['daeun','대운'],['monthly','올해'],['compat','궁합'],['reading','✦ AI']] as const).map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key as typeof tab)}
            className={`shrink-0 flex-1 min-w-[52px] rounded-lg py-2 text-[11px] transition-all ${tab===key?'bg-white/10 text-white':'text-white/50 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>

          {tab==='pillars' && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              {/* 강점 */}
              <div className="px-5 py-5">
                <p className="text-sm font-semibold text-white/50 mb-2">강점</p>
                <p className="text-base text-white/85 leading-relaxed">{dayMaster.profile.strength}</p>
              </div>
              <div className="border-t border-white/6" />
              {/* 주의점 */}
              <div className="px-5 py-5">
                <p className="text-sm font-semibold text-white/50 mb-2">주의점</p>
                <p className="text-base text-white/85 leading-relaxed">{dayMaster.profile.weakness}</p>
              </div>
              <div className="border-t border-white/6" />
              {/* 십신 구성 */}
              <div className="px-5 py-5">
                <p className="text-sm font-semibold text-white/50 mb-1">십신 구성</p>
                <p className="text-xs text-white/30 mb-4">십신 = 나(일간)와 다른 글자들의 관계. 내 삶에서 어떤 에너지가 어디에 있는지 보여줘.</p>
                <div className="space-y-4">
                  {([
                    ['년간', sipshinMap.yearStem], ['년지', sipshinMap.yearBranch],
                    ['월간', sipshinMap.monthStem], ['월지', sipshinMap.monthBranch],
                    ['일지', sipshinMap.dayBranch],
                    ...(sipshinMap.hourStem   ? [['시간', sipshinMap.hourStem]]   : []),
                    ...(sipshinMap.hourBranch ? [['시지', sipshinMap.hourBranch]] : []),
                  ] as [string,string|null][]).map(([lbl,name])=> name && (
                    <div key={lbl} className="flex items-start gap-3">
                      <span className="w-9 shrink-0 text-xs text-white/30 pt-0.5">{lbl}</span>
                      <div>
                        <span className="text-sm font-semibold text-white/85">{name}</span>
                        <span className="ml-2 text-sm text-white/40">{SIPSHIN_DESC[name as keyof typeof SIPSHIN_DESC]?.short}</span>
                        <p className="text-xs text-white/40 mt-1 leading-relaxed">{SIPSHIN_DESC[name as keyof typeof SIPSHIN_DESC]?.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/6" />
              {/* 계산 상세 */}
              <details className="px-5 py-4">
                <summary className="cursor-pointer text-xs text-white/25">계산 상세 보기</summary>
                <div className="mt-3 space-y-1 text-xs text-white/35 font-mono">
                  <p>사주년: {fp.trace.sajuYear} (입춘 {fp.trace.ipchunUTC.slice(0,16)} UTC)</p>
                  <p>월 절기: {fp.trace.monthTermName} ({fp.trace.jieUTC.slice(0,16)} UTC)</p>
                  <p>일주 경계: {fp.trace.dayBoundaryRule}{fp.trace.dayRolled?' (익일 적용)':''}</p>
                </div>
              </details>
            </div>
          )}

          {tab==='elements' && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/6">
                <p className="text-sm font-semibold text-white/80">오행 분포</p>
                <p className="text-xs text-white/40 mt-1">목·화·토·금·수 다섯 에너지가 내 사주 8글자에 어떻게 퍼져있는지. 많은 오행 = 그 성향이 강함, 없는 오행 = 약점 또는 보완 포인트.</p>
              </div>
              <div className="divide-y divide-white/5">
                {elements.map(({el,count,color,comment})=>(
                  <div key={el} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold" style={{color}}>{el}</span>
                        <span className="text-sm text-white/50">{ELEMENT_DESC[el]?.meaning}</span>
                      </div>
                      <span className="text-sm text-white/40">{count}개 · {Math.round(count/total*100)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5 mb-2">
                      <motion.div initial={{width:0}} animate={{width:`${count/total*100}%`}} transition={{duration:0.8,ease:'easeOut'}}
                        className="h-full rounded-full" style={{backgroundColor:color}} />
                    </div>
                    <p className="text-xs text-white/40">{ELEMENT_DESC[el]?.represents}</p>
                    {comment && <p className="mt-2 text-sm text-white/60">{comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='daeun' && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/6">
                <p className="text-sm font-semibold text-white/80">대운 흐름</p>
                <p className="text-xs text-white/40 mt-1">10년 단위로 바뀌는 큰 운의 흐름. 어떤 에너지가 언제 들어오는지 보여줘.</p>
              </div>
              <div className="flex gap-2 overflow-x-auto px-5 py-4">
                {fp.daeun.map(d=>{
                  const se = STEM_DATA[d.pillar.stem];
                  const be = BRANCH_DATA[d.pillar.branch];
                  return (
                    <div key={d.startAge} className="flex shrink-0 flex-col items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 min-w-[72px]">
                      <span className="text-xs text-white/40">{d.startAge}세~</span>
                      <span className="text-xl font-bold" style={{color:ELEMENT_COLOR[se.element]}}>{d.pillar.stem}</span>
                      <span className="text-xl font-bold" style={{color:ELEMENT_COLOR[be.element]}}>{d.pillar.branch}</span>
                      <span className="text-xs text-white/30">{d.startYear}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab==='monthly'  && <MonthlyTab dm={fp.day.stem} />}
          {tab==='compat'   && <CompatTab myElement={dayMaster.element} />}
          {tab==='reading'  && <ReadingTab birth={result.birth} />}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ── 월운 한 줄 설명 ──
const MONTH_SIPSHIN_FLAVOR: Record<string, string> = {
  비견: '독립심이 올라오는 달. 내 페이스대로 밀고 나가기 좋아.',
  겁재: '경쟁·긴장감 있는 달. 협상이나 계약은 꼼꼼히.',
  식신: '아이디어·표현력 살아나는 달. 창의적 시도하기 딱 좋아.',
  상관: '뭔가 튀어나오고 싶은 달. 표현은 자유롭게, 마찰은 조심.',
  편재: '돈·기회 움직이는 달. 적극적으로 나서면 성과 있어.',
  정재: '착실하게 쌓이는 달. 저축·정리 정돈에 집중해.',
  편관: '압박감 있는 달. 버티면 인정받고, 도망치면 반복돼.',
  정관: '사회적으로 인정받기 좋은 달. 공식적인 자리·평가 긍정적.',
  편인: '내면으로 들어가는 달. 배움·혼자만의 시간이 에너지 줘.',
  정인: '지지받고 안정되는 달. 배우거나 준비하는 것들이 쌓여.',
};

// ── 올해 월운 탭 ──
function MonthlyTab({ dm }: { dm: Stem }) {
  const today    = new Date();
  const curYear  = today.getFullYear();
  const curMonth = today.getMonth() + 1;

  // 올해 연간 천간 인덱스
  const yearGz      = mod(curYear - 4, 60);
  const yearStemIdx = yearGz % 10;
  const tigerStem   = TIGER_MONTH_STEM[yearStemIdx % 5];

  const months = Array.from({ length: 13 - curMonth }, (_, i) => {
    const m          = curMonth + i;
    const branchIdx  = m % 12;
    const monthOrder = mod(branchIdx - 2, 12);
    const stemIdx    = mod(tigerStem + monthOrder, 10);
    const stem       = STEMS_ARR[stemIdx];
    const branch     = BRANCHES_ARR[branchIdx];
    const ss         = getSipshin(dm, stem);
    const sb         = getBranchSipshin(dm, branch);
    // 대표 십신: 천간 우선
    const key        = ss;
    return { m, stem, branch, ss, sb, flavor: MONTH_SIPSHIN_FLAVOR[key] ?? '' };
  });

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/6">
        <p className="text-sm font-semibold text-white/80">{curYear}년 남은 월운</p>
        <p className="text-xs text-white/40 mt-0.5">일간과 각 달의 월령 관계로 보는 흐름. 절기 기준이라 양력 월 초와 1~7일 차이 있을 수 있어.</p>
      </div>
      <div className="divide-y divide-white/5">
        {months.map(({ m, stem, branch, ss, sb, flavor }) => {
          const se = STEM_DATA[stem];
          const be = BRANCH_DATA[branch];
          const isCurrent = m === curMonth;
          return (
            <div key={m} className={`px-5 py-4 ${isCurrent ? 'bg-white/[0.04]' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 shrink-0 text-center">
                  <p className={`text-sm font-semibold ${isCurrent ? 'text-white' : 'text-white/50'}`}>{m}월</p>
                  {isCurrent && <p className="text-[9px] text-white/30">이번달</p>}
                </div>
                <div className="flex items-center gap-2 w-20 shrink-0">
                  <span className="text-xl font-bold" style={{ color: ELEMENT_COLOR[se.element] }}>{stem}</span>
                  <span className="text-xl font-bold" style={{ color: ELEMENT_COLOR[be.element] }}>{branch}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white/70">{ss}</span>
                    <span className="text-[10px] text-white/30">·</span>
                    <span className="text-xs text-white/40">{sb}</span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">{flavor}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 궁합 탭 ──
function CompatTab({ myElement }: { myElement: Element }) {
  const [form, setForm] = useState({ year:'', month:'', day:'' });
  const [res, setRes] = useState<{ compat: ReturnType<typeof getCompat>; dm: string } | null>(null);

  async function check() {
    const y=parseInt(form.year), m=parseInt(form.month), d=parseInt(form.day);
    if (!y||!m||!d) return;
    const index = await loadSeolgi();
    const fp = computeFourPillars(index, fromKST(y,m,d,null), 'male');
    const otherEl = STEM_DATA[fp.day.stem].element;
    setRes({ compat: getCompat(myElement, otherEl), dm: `${fp.day.stem}(${STEM_DATA[fp.day.stem].hanja}) · ${otherEl}` });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/40">상대방 생년월일로 일간 오행 기준 궁합을 봅니다.</p>
      <div className="flex gap-2">
        {[['년도','year','w-20'],['월','month','w-14'],['일','day','w-14']].map(([ph,k,w])=>(
          <input key={k} type="number" placeholder={ph} value={form[k as keyof typeof form]}
            onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
            className={`${w} rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30`} />
        ))}
        <button onClick={check} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors">보기</button>
      </div>
      {res && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{res.compat.emoji}</span>
            <div><span className="text-sm font-bold text-white">{res.compat.level}</span>
              <span className="ml-2 text-xs text-white/40">{res.dm}</span></div>
          </div>
          <p className="text-sm text-white/70">{res.compat.comment}</p>
        </motion.div>
      )}
    </div>
  );
}

// ── 입력 요약 바 (결과 화면 상단) ──
function BirthSummary({ birth, dayMaster, onReset }: {
  birth: BirthParams;
  dayMaster: SajuUIResult['dayMaster'];
  onReset: () => void;
}) {
  const [showShare, setShowShare] = useState(false);
  const hourLabel = birth.hour === null ? '모름' : `${birth.hour}시`;
  const sexLabel  = birth.sex === 'male' ? '남' : '여';

  const shareParams: ShareParams = {
    stem:     dayMaster.stem,
    hanja:    dayMaster.hanja,
    element:  dayMaster.element,
    image:    dayMaster.image,
    name:     birth.name ?? '',
    keywords: dayMaster.profile.keyword.join(','),
    core:     dayMaster.profile.core,
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
      >
        <div className="flex items-center gap-3 flex-wrap">
          {birth.name && (
            <>
              <div>
                <p className="text-[9px] text-white/30 mb-0.5">이름</p>
                <p className="text-sm font-medium text-white">{birth.name}</p>
              </div>
              <div className="h-6 w-px bg-white/8" />
            </>
          )}
          <div>
            <p className="text-[9px] text-white/30 mb-0.5">성별</p>
            <p className="text-sm font-medium text-white">{sexLabel}</p>
          </div>
          <div className="h-6 w-px bg-white/8" />
          <div>
            <p className="text-[9px] text-white/30 mb-0.5">생년월일</p>
            <p className="text-sm font-medium text-white">{birth.year}.{String(birth.month).padStart(2,'0')}.{String(birth.day).padStart(2,'0')}</p>
          </div>
          <div className="h-6 w-px bg-white/8" />
          <div>
            <p className="text-[9px] text-white/30 mb-0.5">출생시</p>
            <p className="text-sm font-medium text-white">{hourLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowShare(true)}
            className="rounded-lg bg-white/8 border border-white/10 px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/12 transition-all">
            카드 공유
          </button>
          <button onClick={onReset}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/50 hover:text-white hover:border-white/20 transition-all">
            다시입력
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showShare && <ShareModal params={shareParams} onClose={() => setShowShare(false)} />}
      </AnimatePresence>
    </>
  );
}

// ── 메인 페이지 ──
export function SajuPage() {
  const [form, setForm] = useState({
    name: '', concern: '',
    year: '', month: '', day: '', hour: '',
    unknownHour: false,
    sex: 'male' as 'male' | 'female',
    calType: 'solar' as 'solar' | 'lunar',
    isLeapMonth: false,
    city: '서울',
    customLon: '',
  });
  const [result, setResult] = useState<SajuUIResult | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  function getLongitude(): number {
    if (form.city === '__custom__') {
      const custom = parseFloat(form.customLon);
      return isNaN(custom) ? 127.0 : custom;
    }
    const all = [...DOMESTIC_CITIES, ...OVERSEAS_CITIES];
    return all.find(c => c.label === form.city)?.lon ?? 127.0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);

    let y = parseInt(form.year), m = parseInt(form.month), d = parseInt(form.day);
    const h = form.unknownHour ? null : parseInt(form.hour);

    if (!y || !m || !d || y < 1880 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
      setError('날짜를 올바르게 입력해주세요. (1880~2100)'); setLoading(false); return;
    }
    if (!form.unknownHour && (isNaN(h!) || h! < 0 || h! > 23)) {
      setError('시간은 0~23시로 입력하거나 "시간 모름"을 체크하세요.'); setLoading(false); return;
    }

    // 음력 → 양력 변환
    if (form.calType === 'lunar') {
      try {
        const solar = lunarToSolar(y, m, d, form.isLeapMonth);
        y = solar.year; m = solar.month; d = solar.day;
      } catch {
        setError('음력 날짜 변환에 실패했습니다. 날짜를 확인해주세요.'); setLoading(false); return;
      }
    }

    const longitudeE = getLongitude();

    try {
      const index = await loadSeolgi();
      const fp = computeFourPillars(index, fromKST(y, m, d, h, 0, longitudeE), form.sex);
      setResult(buildUIResult(fp, {
        year: y, month: m, day: d, hour: h, sex: form.sex,
        longitudeE,
        name:    form.name.trim()    || undefined,
        concern: form.concern.trim() || undefined,
      }));
    } catch (err) {
      setError(`계산 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally { setLoading(false); }
  }

  if (result) {
    return (
      <main className="mx-auto max-w-2xl px-4 pt-24 pb-20 space-y-4">
        <BirthSummary birth={result.birth} dayMaster={result.dayMaster} onReset={() => setResult(null)} />
        <ResultView result={result} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pt-24 pb-20">
      <div className="mb-8">
        <span className="mb-3 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/60 uppercase">사주팔자</span>
        <h1 className="text-3xl font-bold tracking-tight">내 사주 보기</h1>
        <p className="mt-1 text-sm text-white/50">DE440 천문 데이터 · 절기 초 단위 정밀도</p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-5">

        {/* 이름 */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">이름 <span className="text-white/25">(선택)</span></label>
          <input type="text" placeholder="홍길동" maxLength={20} value={form.name}
            onChange={e => set('name', e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30" />
        </div>

        {/* 성별 */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">성별</label>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map(s => (
              <button key={s} type="button" onClick={() => set('sex', s)}
                className={`flex-1 rounded-lg py-2 text-sm transition-all ${form.sex === s ? 'bg-white/15 text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
                {s === 'male' ? '남자' : '여자'}
              </button>
            ))}
          </div>
        </div>

        {/* 양력/음력 + 생년월일 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-white/50">생년월일</label>
            <div className="flex rounded-lg border border-white/10 p-0.5 gap-0.5">
              {(['solar', 'lunar'] as const).map(t => (
                <button key={t} type="button" onClick={() => set('calType', t)}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${form.calType === t ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}>
                  {t === 'solar' ? '양력' : '음력'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input type="number" placeholder="년도 (예: 1995)" value={form.year} onChange={e => set('year', e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30" />
            <input type="number" placeholder="월" value={form.month} onChange={e => set('month', e.target.value)}
              className="w-16 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30" />
            <input type="number" placeholder="일" value={form.day} onChange={e => set('day', e.target.value)}
              className="w-16 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30" />
          </div>
          {form.calType === 'lunar' && (
            <label className="mt-2 flex items-center gap-1.5 text-xs text-white/40 cursor-pointer">
              <input type="checkbox" checked={form.isLeapMonth} onChange={e => set('isLeapMonth', e.target.checked)} className="rounded" />
              윤달
            </label>
          )}
        </div>

        {/* 출생 시간 */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">출생 시간 (0~23시)</label>
          <div className="flex items-center gap-3">
            <input type="number" placeholder="시 (예: 14)" value={form.hour} disabled={form.unknownHour}
              onChange={e => set('hour', e.target.value)}
              className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 disabled:opacity-30" />
            <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
              <input type="checkbox" checked={form.unknownHour} onChange={e => set('unknownHour', e.target.checked)} className="rounded" />
              시간 모름
            </label>
          </div>
        </div>

        {/* 출생지 */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">출생지</label>
          {/* 국내 select */}
          <select value={form.city} onChange={e => set('city', e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 mb-2">
            <option value="" className="bg-zinc-900">국내 도시 선택</option>
            {DOMESTIC_CITIES.map(c => (
              <option key={c.label} value={c.label} className="bg-zinc-900">{c.label}</option>
            ))}
            <option value="__overseas__" disabled className="bg-zinc-900">── 해외 ──</option>
            {OVERSEAS_CITIES.map(c => (
              <option key={c.label} value={c.label} className="bg-zinc-900">{c.label}</option>
            ))}
            <option value="__custom__" className="bg-zinc-900">직접 입력 (경도)</option>
          </select>
          {form.city === '__custom__' && (
            <input type="number" placeholder="경도 입력 (예: 127.0 = 서울, -118.2 = LA)"
              value={form.customLon} onChange={e => set('customLon', e.target.value)}
              step="0.1" min="-180" max="180"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30" />
          )}
        </div>

        {/* 현재 고민 */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">지금 가장 궁금한 것 <span className="text-white/25">(선택 · AI 맥락 반영)</span></label>
          <textarea placeholder="예: 올해 이직해도 될까요? / 지금 만나는 사람이랑 잘 맞는지 궁금해요" value={form.concern}
            onChange={e => set('concern', e.target.value)} maxLength={200} rows={2}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 resize-none" />
          <p className="mt-1 text-[10px] text-white/25 text-right">{form.concern.length}/200</p>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-white/10 py-3 text-sm font-medium text-white hover:bg-white/15 transition-colors disabled:opacity-50">
          {loading ? '계산 중...' : '사주 보기'}
        </button>
      </form>
    </main>
  );
}
