"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { buildSajuResult, STEM_DATA, BRANCH_DATA, ELEMENT_COLOR, SIPSHIN_DESC, getCompat, type SajuResult } from "@/lib/saju";

// ── 입력 폼 ──
interface FormState {
  year: string; month: string; day: string; hour: string;
  unknownHour: boolean;
  sex: 'male' | 'female';
}

const INIT: FormState = { year: '', month: '', day: '', hour: '', unknownHour: false, sex: 'male' };

function PillarCell({ label, stem, branch, sipshinStem, sipshinBranch, isDay }: {
  label: string;
  stem: string;
  branch: string;
  sipshinStem?: string;
  sipshinBranch?: string;
  isDay?: boolean;
}) {
  const stemEl  = STEM_DATA[stem as keyof typeof STEM_DATA];
  const branchEl = BRANCH_DATA[branch as keyof typeof BRANCH_DATA];
  return (
    <div className={`flex flex-col items-center gap-1 rounded-2xl border px-5 py-4 ${isDay ? 'border-white/20 bg-white/[0.07]' : 'border-white/8 bg-white/[0.03]'}`}>
      <span className="text-[10px] text-white/40 tracking-widest uppercase">{label}</span>
      {/* 십신 (천간) */}
      <span className="text-[10px] text-white/50 h-3">{sipshinStem ?? ''}</span>
      {/* 천간 */}
      <span className="text-3xl font-bold" style={{ color: ELEMENT_COLOR[stemEl.element] }}>
        {stem}
      </span>
      <span className="text-[10px] text-white/30">{stemEl.hanja} {stemEl.element}</span>
      <div className="my-1 h-px w-full bg-white/8" />
      {/* 지지 */}
      <span className="text-3xl font-bold" style={{ color: ELEMENT_COLOR[branchEl.element] }}>
        {branch}
      </span>
      <span className="text-[10px] text-white/30">{branchEl.hanja} {branchEl.animal}</span>
      {/* 십신 (지지) */}
      <span className="text-[10px] text-white/50 h-3">{sipshinBranch ?? ''}</span>
    </div>
  );
}

function ResultView({ result }: { result: SajuResult }) {
  const { pillars, dayMaster, elements, sipshinMap } = result;
  const [tab, setTab] = useState<'profile' | 'elements' | 'daeun' | 'compat'>('profile');

  const total = elements.reduce((s, e) => s + e.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-10 space-y-6"
    >
      {/* 사주 4주 표 */}
      <div className="grid grid-cols-4 gap-2">
        {pillars.hour ? (
          <PillarCell label="시" stem={pillars.hour.stem} branch={pillars.hour.branch}
            sipshinStem={sipshinMap.hourStemSipshin ?? undefined}
            sipshinBranch={sipshinMap.hourBranchSipshin ?? undefined} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/5 px-5 py-4 text-white/20 text-xs">
            시간<br />모름
          </div>
        )}
        <PillarCell label="일" stem={pillars.day.stem} branch={pillars.day.branch}
          sipshinBranch={sipshinMap.dayBranchSipshin} isDay />
        <PillarCell label="월" stem={pillars.month.stem} branch={pillars.month.branch}
          sipshinStem={sipshinMap.monthStemSipshin}
          sipshinBranch={sipshinMap.monthBranchSipshin} />
        <PillarCell label="년" stem={pillars.year.stem} branch={pillars.year.branch}
          sipshinStem={sipshinMap.yearStemSipshin}
          sipshinBranch={sipshinMap.yearBranchSipshin} />
      </div>

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
        {([
          { key: 'profile' as const, label: '성격 분석' },
          { key: 'elements' as const, label: '오행' },
          { key: 'daeun' as const, label: '대운' },
          { key: 'compat' as const, label: '궁합' },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-xs transition-all ${tab === key ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

          {/* 성격 분석 */}
          {tab === 'profile' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">강점</span>
                  <p className="mt-1 text-sm text-white/80">{dayMaster.profile.strength}</p>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">주의</span>
                  <p className="mt-1 text-sm text-white/80">{dayMaster.profile.weakness}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {dayMaster.profile.keyword.map(k => (
                    <span key={k} className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-white/60">{k}</span>
                  ))}
                </div>
              </div>

              {/* 십신 요약 */}
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">십신 구성</p>
                <div className="space-y-2">
                  {([
                    { name: sipshinMap.yearStemSipshin,    label: '년간' },
                    { name: sipshinMap.yearBranchSipshin,  label: '년지' },
                    { name: sipshinMap.monthStemSipshin,   label: '월간' },
                    { name: sipshinMap.monthBranchSipshin, label: '월지' },
                    { name: sipshinMap.dayBranchSipshin,   label: '일지' },
                    ...(sipshinMap.hourStemSipshin   ? [{ name: sipshinMap.hourStemSipshin,   label: '시간' }] : []),
                    ...(sipshinMap.hourBranchSipshin ? [{ name: sipshinMap.hourBranchSipshin, label: '시지' }] : []),
                  ] as Array<{ name: string; label: string }>).map(({ name, label }) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="w-8 shrink-0 text-[10px] text-white/30">{label}</span>
                      <span className="text-xs font-medium text-white/70 w-12 shrink-0">{name}</span>
                      <span className="text-xs text-white/40">{SIPSHIN_DESC[name as keyof typeof SIPSHIN_DESC]?.short}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 오행 */}
          {tab === 'elements' && (
            <div className="space-y-3">
              {elements.map(({ el, count, color, comment }) => (
                <div key={el}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color }}>{el}</span>
                    <span className="text-xs text-white/40">{count}개 / {Math.round(count / total * 100)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${count / total * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  {comment && <p className="mt-1.5 text-xs text-white/50">{comment}</p>}
                </div>
              ))}
            </div>
          )}

          {/* 대운 */}
          {tab === 'daeun' && (
            <div>
              <p className="mb-3 text-xs text-white/40">10년 단위 대운 흐름</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {pillars.daeun.map((d) => {
                  const stemEl   = STEM_DATA[d.pillar.stem];
                  const branchEl = BRANCH_DATA[d.pillar.branch];
                  return (
                    <div key={d.startAge}
                      className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 min-w-[60px]">
                      <span className="text-[10px] text-white/40">{d.startAge}세~</span>
                      <span className="text-lg font-bold" style={{ color: ELEMENT_COLOR[stemEl.element] }}>{d.pillar.stem}</span>
                      <span className="text-lg font-bold" style={{ color: ELEMENT_COLOR[branchEl.element] }}>{d.pillar.branch}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 궁합 */}
          {tab === 'compat' && <CompatTab myElement={dayMaster.element} />}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function CompatTab({ myElement }: { myElement: string }) {
  const [otherYear, setOtherYear] = useState('');
  const [otherMonth, setOtherMonth] = useState('');
  const [otherDay, setOtherDay] = useState('');
  const [compatResult, setCompatResult] = useState<ReturnType<typeof getCompat> | null>(null);
  const [otherDm, setOtherDm] = useState<string | null>(null);

  function check() {
    const y = parseInt(otherYear), m = parseInt(otherMonth), d = parseInt(otherDay);
    if (!y || !m || !d) return;
    try {
      const r = buildSajuResult(y, m, d, null, 'male');
      const compat = getCompat(
        myElement as Parameters<typeof getCompat>[0],
        r.dayMaster.element,
      );
      setCompatResult(compat);
      setOtherDm(`${r.dayMaster.stem}(${r.dayMaster.hanja}) · ${r.dayMaster.element}`)
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/40">상대방 생년월일을 입력하면 일간 오행 기준 궁합을 봅니다.</p>
      <div className="flex gap-2">
        <input type="number" placeholder="년도" value={otherYear} onChange={e => setOtherYear(e.target.value)}
          className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30" />
        <input type="number" placeholder="월" value={otherMonth} onChange={e => setOtherMonth(e.target.value)}
          className="w-14 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30" />
        <input type="number" placeholder="일" value={otherDay} onChange={e => setOtherDay(e.target.value)}
          className="w-14 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30" />
        <button onClick={check}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors">
          보기
        </button>
      </div>

      {compatResult && otherDm && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{compatResult.emoji}</span>
            <div>
              <span className="text-sm font-bold text-white">{compatResult.level}</span>
              <span className="ml-2 text-xs text-white/40">{otherDm}</span>
            </div>
          </div>
          <p className="text-sm text-white/70">{compatResult.comment}</p>
        </motion.div>
      )}
    </div>
  );
}

export function SajuPage() {
  const [form, setForm] = useState<FormState>(INIT);
  const [result, setResult] = useState<SajuResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof FormState, val: string | boolean) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const y = parseInt(form.year);
    const m = parseInt(form.month);
    const d = parseInt(form.day);
    const h = form.unknownHour ? null : parseInt(form.hour);
    if (!y || !m || !d || y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
      setError('날짜를 올바르게 입력해주세요.');
      return;
    }
    if (!form.unknownHour && (isNaN(h!) || h! < 0 || h! > 23)) {
      setError('시간을 0~23시로 입력하거나 "시간 모름"을 체크하세요.');
      return;
    }
    try {
      setResult(buildSajuResult(y, m, d, h, form.sex));
    } catch {
      setError('계산 중 오류가 발생했습니다.');
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 pt-24 pb-20">
      {/* 헤더 */}
      <div className="mb-8">
        <span className="mb-3 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/60 uppercase">
          사주팔자
        </span>
        <h1 className="text-3xl font-bold tracking-tight">내 사주 보기</h1>
        <p className="mt-1 text-sm text-white/50">생년월일시 기반 · 절기 정확도 적용</p>
      </div>

      {/* 입력 폼 */}
      <form onSubmit={submit} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
        {/* 성별 */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">성별</label>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map(s => (
              <button key={s} type="button"
                onClick={() => set('sex', s)}
                className={`flex-1 rounded-lg py-2 text-sm transition-all ${form.sex === s ? 'bg-white/15 text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
                {s === 'male' ? '남자' : '여자'}
              </button>
            ))}
          </div>
        </div>

        {/* 생년월일 */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">생년월일</label>
          <div className="flex gap-2">
            <input type="number" placeholder="년도 (예: 1995)" value={form.year}
              onChange={e => set('year', e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30" />
            <input type="number" placeholder="월" value={form.month}
              onChange={e => set('month', e.target.value)}
              className="w-16 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30" />
            <input type="number" placeholder="일" value={form.day}
              onChange={e => set('day', e.target.value)}
              className="w-16 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30" />
          </div>
        </div>

        {/* 출생 시간 */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">출생 시간 (0~23시)</label>
          <div className="flex items-center gap-3">
            <input type="number" placeholder="시 (예: 14)" value={form.hour}
              disabled={form.unknownHour}
              onChange={e => set('hour', e.target.value)}
              className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 disabled:opacity-30" />
            <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
              <input type="checkbox" checked={form.unknownHour}
                onChange={e => set('unknownHour', e.target.checked)}
                className="rounded" />
              시간 모름
            </label>
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button type="submit"
          className="w-full rounded-xl bg-white/10 py-3 text-sm font-medium text-white hover:bg-white/15 transition-colors">
          사주 보기
        </button>
      </form>

      {/* 결과 */}
      {result && <ResultView result={result} />}
    </main>
  );
}
