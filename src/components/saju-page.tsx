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

// ── PillarCell ──
function PillarCell({ label, pillar, sipshinStem, sipshinBranch, isDay }: {
  label: string; pillar: Pillar;
  sipshinStem?: string | null; sipshinBranch?: string | null; isDay?: boolean;
}) {
  const stemEl   = STEM_DATA[pillar.stem];
  const branchEl = BRANCH_DATA[pillar.branch];
  return (
    <div className={`flex flex-col items-center gap-1 rounded-2xl border px-4 py-4 ${isDay ? 'border-white/20 bg-white/[0.07]' : 'border-white/8 bg-white/[0.03]'}`}>
      <span className="text-[10px] text-white/40 tracking-widest uppercase">{label}</span>
      <span className="text-[10px] text-white/50 h-3">{sipshinStem || ''}</span>
      <span className="text-3xl font-bold" style={{ color: ELEMENT_COLOR[stemEl.element] }}>{pillar.stem}</span>
      <span className="text-[10px] text-white/30">{stemEl.hanja}</span>
      <div className="my-1 h-px w-full bg-white/8" />
      <span className="text-3xl font-bold" style={{ color: ELEMENT_COLOR[branchEl.element] }}>{pillar.branch}</span>
      <span className="text-[10px] text-white/30">{branchEl.hanja} {branchEl.animal}</span>
      <span className="text-[10px] text-white/50 h-3">{sipshinBranch || ''}</span>
    </div>
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
        body: JSON.stringify({ ...birth, tier: 'free', type }),
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

// ── 결과 뷰 ──
function ResultView({ result }: { result: SajuUIResult }) {
  const { pillars: fp, dayMaster, elements, sipshinMap } = result;
  const [tab, setTab] = useState<'profile' | 'elements' | 'daeun' | 'compat' | 'reading'>('profile');
  const total = elements.reduce((s,e)=>s+e.count,0);

  return (
    <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="mt-10 space-y-6">

      {/* 4주 표: 시|일|월|년 */}
      <div className="grid grid-cols-4 gap-2">
        {fp.hour ? (
          <PillarCell label="시" pillar={fp.hour} sipshinStem={sipshinMap.hourStem} sipshinBranch={sipshinMap.hourBranch} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/5 py-4 text-white/20 text-xs">시간<br/>미상</div>
        )}
        <PillarCell label="일" pillar={fp.day}   sipshinBranch={sipshinMap.dayBranch} isDay />
        <PillarCell label="월" pillar={fp.month} sipshinStem={sipshinMap.monthStem}  sipshinBranch={sipshinMap.monthBranch} />
        <PillarCell label="년" pillar={fp.year}  sipshinStem={sipshinMap.yearStem}   sipshinBranch={sipshinMap.yearBranch} />
      </div>

      {/* 세운 */}
      <SeyunRow dm={fp.day.stem} />

      {/* 경계 주의 */}
      {fp.trace.boundaryCaution && (
        <p className="text-[11px] text-yellow-400/70 rounded-lg border border-yellow-400/20 px-3 py-2">
          ⚠ 절기 경계 ±3분 이내 출생 — 월주가 달라질 수 있습니다. KASI 발표 절기와 교차 확인을 권장합니다.
        </p>
      )}

      {/* 일간 강조 */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-bold" style={{ color: ELEMENT_COLOR[dayMaster.element] }}>
            {dayMaster.stem}{dayMaster.hanja}
          </span>
          <span className="text-sm text-white/50">{dayMaster.image}</span>
        </div>
        <p className="text-sm text-white/80 leading-relaxed">{dayMaster.profile.core}</p>
        <p className="mt-2 text-xs text-white/40 italic">{dayMaster.profile.vibe}</p>
      </div>

      {/* 탭 */}
      <div className="flex rounded-xl border border-white/8 p-0.5">
        {([['profile','성격'],['elements','오행'],['daeun','대운'],['compat','궁합'],['reading','✦ AI']] as const).map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key as typeof tab)}
            className={`flex-1 rounded-lg py-2 text-xs transition-all ${tab===key?'bg-white/10 text-white':'text-white/50 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>

          {tab==='profile' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
                <div><span className="text-[10px] text-white/40 uppercase tracking-widest">강점</span>
                  <p className="mt-1 text-sm text-white/80">{dayMaster.profile.strength}</p></div>
                <div><span className="text-[10px] text-white/40 uppercase tracking-widest">주의</span>
                  <p className="mt-1 text-sm text-white/80">{dayMaster.profile.weakness}</p></div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {dayMaster.profile.keyword.map(k=>(
                    <span key={k} className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-white/60">{k}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">십신 구성</p>
                <div className="space-y-2">
                  {([
                    ['년간', sipshinMap.yearStem], ['년지', sipshinMap.yearBranch],
                    ['월간', sipshinMap.monthStem], ['월지', sipshinMap.monthBranch],
                    ['일지', sipshinMap.dayBranch],
                    ...(sipshinMap.hourStem   ? [['시간', sipshinMap.hourStem]]   : []),
                    ...(sipshinMap.hourBranch ? [['시지', sipshinMap.hourBranch]] : []),
                  ] as [string,string|null][]).map(([lbl,name])=> name && (
                    <div key={lbl} className="flex items-start gap-3">
                      <span className="w-8 shrink-0 text-[10px] text-white/30">{lbl}</span>
                      <span className="text-xs font-medium text-white/70 w-12 shrink-0">{name}</span>
                      <span className="text-xs text-white/40">{SIPSHIN_DESC[name as keyof typeof SIPSHIN_DESC]?.short}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* 계산 트레이스 */}
              <details className="rounded-xl border border-white/5 px-4 py-3">
                <summary className="cursor-pointer text-[10px] text-white/30 uppercase tracking-widest">계산 트레이스</summary>
                <div className="mt-2 space-y-1 text-[11px] text-white/40 font-mono">
                  <p>사주년: {fp.trace.sajuYear} (입춘 {fp.trace.ipchunUTC.slice(0,16)} UTC)</p>
                  <p>월 절기: {fp.trace.monthTermName} ({fp.trace.jieUTC.slice(0,16)} UTC)</p>
                  <p>일주 경계: {fp.trace.dayBoundaryRule}{fp.trace.dayRolled?' (익일 적용)':''}</p>
                  <p>일주 offset: {fp.trace.dayPillarOffset}</p>
                  <p>시각: {fp.trace.timeKnown?'입력됨':'미상'}</p>
                </div>
              </details>
            </div>
          )}

          {tab==='elements' && (
            <div className="space-y-3">
              {elements.map(({el,count,color,comment})=>(
                <div key={el}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium" style={{color}}>{el}</span>
                    <span className="text-xs text-white/40">{count}개 · {Math.round(count/total*100)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <motion.div initial={{width:0}} animate={{width:`${count/total*100}%`}} transition={{duration:0.8,ease:'easeOut'}}
                      className="h-full rounded-full" style={{backgroundColor:color}} />
                  </div>
                  {comment && <p className="mt-1.5 text-xs text-white/50">{comment}</p>}
                </div>
              ))}
            </div>
          )}

          {tab==='daeun' && (
            <div>
              <p className="mb-3 text-xs text-white/40">10년 단위 대운</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {fp.daeun.map(d=>{
                  const se = STEM_DATA[d.pillar.stem];
                  const be = BRANCH_DATA[d.pillar.branch];
                  return (
                    <div key={d.startAge} className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 min-w-[64px]">
                      <span className="text-[10px] text-white/40">{d.startAge}세~</span>
                      <span className="text-lg font-bold" style={{color:ELEMENT_COLOR[se.element]}}>{d.pillar.stem}</span>
                      <span className="text-lg font-bold" style={{color:ELEMENT_COLOR[be.element]}}>{d.pillar.branch}</span>
                      <span className="text-[10px] text-white/30">{d.startYear}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab==='compat' && <CompatTab myElement={dayMaster.element} />}
          {tab==='reading' && <ReadingTab birth={result.birth} />}

        </motion.div>
      </AnimatePresence>
    </motion.div>
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

// ── 메인 페이지 ──
export function SajuPage() {
  const [form, setForm] = useState({ year:'', month:'', day:'', hour:'', unknownHour:false, sex:'male' as 'male'|'female' });
  const [result, setResult] = useState<SajuUIResult | null>(null);
  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    const y=parseInt(form.year), m=parseInt(form.month), d=parseInt(form.day);
    const h = form.unknownHour ? null : parseInt(form.hour);
    if (!y||!m||!d||y<1880||y>2100||m<1||m>12||d<1||d>31) {
      setError('날짜를 올바르게 입력해주세요. (1880~2100)'); setLoading(false); return;
    }
    if (!form.unknownHour && (isNaN(h!)||h!<0||h!>23)) {
      setError('시간은 0~23시로 입력하거나 "시간 모름"을 체크하세요.'); setLoading(false); return;
    }
    try {
      const index = await loadSeolgi();
      const fp = computeFourPillars(index, fromKST(y,m,d,h), form.sex);
      setResult(buildUIResult(fp, { year:y, month:m, day:d, hour:h, sex:form.sex }));
    } catch(err) {
      setError(`계산 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally { setLoading(false); }
  }

  const set = (k: string, v: string|boolean) => setForm(f=>({...f,[k]:v}));

  return (
    <main className="mx-auto max-w-lg px-4 pt-24 pb-20">
      <div className="mb-8">
        <span className="mb-3 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/60 uppercase">사주팔자</span>
        <h1 className="text-3xl font-bold tracking-tight">내 사주 보기</h1>
        <p className="mt-1 text-sm text-white/50">DE440 천문 데이터 · 절기 초 단위 정밀도</p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
        <div>
          <label className="text-xs text-white/50 mb-2 block">성별</label>
          <div className="flex gap-2">
            {(['male','female'] as const).map(s=>(
              <button key={s} type="button" onClick={()=>set('sex',s)}
                className={`flex-1 rounded-lg py-2 text-sm transition-all ${form.sex===s?'bg-white/15 text-white':'bg-white/5 text-white/50 hover:text-white'}`}>
                {s==='male'?'남자':'여자'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 mb-2 block">생년월일</label>
          <div className="flex gap-2">
            <input type="number" placeholder="년도 (예: 1995)" value={form.year} onChange={e=>set('year',e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30" />
            <input type="number" placeholder="월" value={form.month} onChange={e=>set('month',e.target.value)}
              className="w-16 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30" />
            <input type="number" placeholder="일" value={form.day} onChange={e=>set('day',e.target.value)}
              className="w-16 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30" />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 mb-2 block">출생 시간 (0~23시)</label>
          <div className="flex items-center gap-3">
            <input type="number" placeholder="시 (예: 14)" value={form.hour} disabled={form.unknownHour}
              onChange={e=>set('hour',e.target.value)}
              className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 disabled:opacity-30" />
            <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
              <input type="checkbox" checked={form.unknownHour} onChange={e=>set('unknownHour',e.target.checked)} className="rounded" />
              시간 모름
            </label>
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-white/10 py-3 text-sm font-medium text-white hover:bg-white/15 transition-colors disabled:opacity-50">
          {loading ? '계산 중...' : '사주 보기'}
        </button>
      </form>

      {result && <ResultView result={result} />}
    </main>
  );
}
