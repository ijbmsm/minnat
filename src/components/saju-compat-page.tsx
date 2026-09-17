"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { CompatResponse, CompatSection } from "@/app/api/saju/compat/route";
import type { InviteCreateResponse } from "@/app/api/saju/compat/invite/route";
import type { SavedReading } from "@/app/api/saju/readings/[id]/route";
import { compareCharts, RELATION_LABEL, type CompatAnalysis, type CompatRelation } from "@/lib/saju/compat";
import { buildSeolgiIndex, type SeolgiIndex, type SeolgiRow } from "@/lib/saju/seolgi-loader";
import { computeFourPillars, fromKST, type FourPillars } from "@/lib/saju/engine";
import { analyzeAdvanced } from "@/lib/saju/advanced";
import { COMPAT_SECTION_TITLES, COMPAT_SECTION_SUBTITLES } from "@/lib/saju/sections";
import { track } from "@/lib/analytics";

// ── 절기 인덱스 (클라이언트, 1회 로드) ──
let seolgiCache: SeolgiIndex | null = null;
async function loadSeolgi(): Promise<SeolgiIndex> {
  if (seolgiCache) return seolgiCache;
  const res = await fetch("/seolgi.json");
  const rows: SeolgiRow[] = await res.json();
  seolgiCache = buildSeolgiIndex(rows);
  return seolgiCache;
}

function calcLocal(index: SeolgiIndex, p: { year: number; month: number; day: number; hour: number | null; sex: 'male' | 'female' }): FourPillars {
  return computeFourPillars(index, fromKST(p.year, p.month, p.day, p.hour, 0, 127.0, 'midnight'), p.sex);
}

function daysFromJie(fp: FourPillars): number {
  return Math.max(0, Math.floor((new Date(fp.trace.birthUTC).getTime() - new Date(fp.trace.jieUTC).getTime()) / 86_400_000));
}

// ── 디자인 토큰 (saju-page와 동일 팔레트) ──
const INK = {
  bg:       '#0c0907',
  card:     'rgba(232,223,200,0.035)',
  cardLine: 'rgba(232,223,200,0.10)',
  hair:     'rgba(232,223,200,0.085)',
  ink:      'rgba(232,223,200,0.94)',
  ink70:    'rgba(232,223,200,0.66)',
  ink45:    'rgba(232,223,200,0.42)',
  ink28:    'rgba(232,223,200,0.26)',
  gold:     '#c2a35b',
};

const OH: Record<string, { color: string }> = {
  목: { color: '#7e9a6f' }, 화: { color: '#c4685a' },
  토: { color: '#c0974f' }, 금: { color: '#c9c2ad' }, 수: { color: '#6f88a6' },
};

const SERIF = 'var(--font-noto-serif-kr), "Apple SD Gothic Neo", serif';
const MONO  = 'var(--font-ibm-plex-mono), "Courier New", monospace';

// ── 폼 기본값 ──
const PERSON_DEFAULTS = {
  name: '', year: '', month: '', day: '', hour: '', sex: 'female' as 'male' | 'female', unknownHour: false,
};

type PersonForm = typeof PERSON_DEFAULTS;

// ── 서브컴포넌트: 한 명 입력 폼 ──
function PersonInput({
  label, form, onChange,
}: {
  label: string;
  form: PersonForm;
  onChange: (f: PersonForm) => void;
}) {
  const inputStyle: React.CSSProperties = {
    border: `1px solid ${INK.cardLine}`, background: 'transparent',
    color: INK.ink, borderRadius: 6, padding: '8px 12px',
    fontFamily: MONO, fontSize: 13, outline: 'none',
    WebkitAppearance: 'none', MozAppearance: 'textfield',
  };

  return (
    <div style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 12, padding: '18px 20px', background: INK.card }}>
      <div style={{ fontFamily: SERIF, fontSize: 13, letterSpacing: 2, color: INK.ink45, marginBottom: 14 }}>
        {label}
      </div>

      {/* 이름 */}
      <input
        type="text" placeholder="이름 (선택)"
        value={form.name}
        onChange={e => onChange({ ...form, name: e.target.value })}
        maxLength={20}
        style={{ ...inputStyle, width: '100%', marginBottom: 10, boxSizing: 'border-box' }}
      />

      {/* 생년월일 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {([['년도', 'year', '90px'], ['월', 'month', '55px'], ['일', 'day', '55px']] as [string, keyof PersonForm, string][]).map(([ph, k, w]) => (
          <input key={k} type="number" placeholder={ph}
            value={form[k] as string}
            onChange={e => onChange({ ...form, [k]: e.target.value })}
            style={{ ...inputStyle, width: w }}
          />
        ))}
      </div>

      {/* 시간 + 모름 */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <input type="number" placeholder="시 (0~23)"
          value={form.hour}
          onChange={e => onChange({ ...form, hour: e.target.value, unknownHour: false })}
          disabled={form.unknownHour}
          style={{ ...inputStyle, width: 90, opacity: form.unknownHour ? 0.35 : 1 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: INK.ink45, fontFamily: MONO, fontSize: 12 }}>
          <input type="checkbox" checked={form.unknownHour}
            onChange={e => onChange({ ...form, unknownHour: e.target.checked, hour: '' })}
            style={{ cursor: 'pointer' }}
          />
          시간 모름
        </label>
      </div>

      {/* 성별 */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['female', 'male'] as const).map(s => (
          <button key={s}
            onClick={() => onChange({ ...form, sex: s })}
            style={{
              padding: '6px 16px', borderRadius: 6, border: `1px solid ${form.sex === s ? INK.gold : INK.cardLine}`,
              background: form.sex === s ? 'rgba(194,163,91,0.12)' : 'transparent',
              color: form.sex === s ? INK.gold : INK.ink45, cursor: 'pointer',
              fontFamily: MONO, fontSize: 12, transition: 'all .15s',
            }}
          >
            {s === 'female' ? '여' : '남'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 궁합 점수 게이지 ──
function CompatScoreBar({ score, level, headline }: { score: number; level: string; headline?: string }) {
  const color =
    score >= 80 ? '#c2a35b' :
    score >= 65 ? '#7e9a6f' :
    score >= 45 ? '#6f88a6' :
    score >= 30 ? '#c0974f' : '#c4685a';

  return (
    <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
      <div style={{ fontFamily: SERIF, fontSize: 13, color: INK.ink45, letterSpacing: 2, marginBottom: 8 }}>
        궁합 점수
      </div>
      <div style={{ fontSize: 52, fontWeight: 700, color, fontFamily: MONO, lineHeight: 1 }}>
        {score}
      </div>
      <div style={{ fontSize: 12, color: INK.ink45, fontFamily: MONO, marginTop: 4 }}>/100</div>
      <div style={{ display: 'inline-block', marginTop: 10, padding: '4px 14px', borderRadius: 20,
        border: `1px solid ${color}`, color, fontFamily: MONO, fontSize: 12, letterSpacing: 1 }}>
        {level}
      </div>
      {/* 숫자만 있으면 무슨 뜻인지 모른다 — 관계를 한 줄로 정의해 붙인다 */}
      {headline && (
        <p style={{ margin: '14px auto 0', maxWidth: 340, padding: '0 16px', fontFamily: SERIF,
          fontSize: 15, fontWeight: 600, color: INK.ink, lineHeight: 1.55 }}>
          {headline}
        </p>
      )}

      {/* 진행 바 */}
      <div style={{ margin: '16px auto 0', maxWidth: 280, height: 4, borderRadius: 2, background: INK.cardLine, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 2 }}
        />
      </div>
    </div>
  );
}

// ── 궁합 요약 태그 ──
function SummaryChips({ summary }: { summary: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
      {summary.map((s, i) => (
        <span key={i} style={{
          padding: '4px 10px', borderRadius: 20, fontSize: 11,
          border: `1px solid ${INK.cardLine}`, color: INK.ink45,
          fontFamily: MONO, background: INK.card, lineHeight: 1.4,
        }}>
          {s}
        </span>
      ))}
    </div>
  );
}

// ── 섹션 카드 ──
function SectionCard({ section, index }: { section: CompatSection; index?: number }) {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 10, overflow: 'hidden', background: INK.card }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', textAlign: 'left', padding: '14px 18px', background: 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, paddingRight: 10 }}>
          {(section.label || index !== undefined) && (
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: INK.ink28 }}>
              {index !== undefined ? String(index + 1).padStart(2, '0') : ''}
              {section.label ? `  ${section.label}` : ''}
            </span>
          )}
          <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: INK.ink, lineHeight: 1.45 }}>
            {section.title}
          </span>
        </span>
        <span style={{ color: INK.ink28, fontSize: 12, fontFamily: MONO, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ height: 1, background: INK.hair }} />
            <p style={{ padding: '14px 18px', margin: 0, fontFamily: SERIF, fontSize: 14,
              lineHeight: 1.85, color: INK.ink, whiteSpace: 'pre-wrap' }}>
              {section.body}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 분석 요약 패널 ──
function AnalysisPanel({ analysis }: { analysis: CompatAnalysis }) {
  const rows: [string, string][] = [
    ['일간 관계', analysis.stemRelation.label],
    ['일지 관계', analysis.dayBranchRelation.label],
    ['십신 역학', analysis.sipshinDynamic.label],
    ['오행 보완', analysis.elementComplement.label],
  ];
  return (
    <div style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 10, background: INK.card, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px 0', fontFamily: SERIF, fontSize: 12, letterSpacing: 2, color: INK.ink45 }}>
        분석 요약
      </div>
      {rows.map(([label, value], i) => (
        <div key={i} style={{ display: 'flex', padding: '10px 18px', gap: 12,
          borderTop: i === 0 ? `1px solid ${INK.hair}` : 'none', borderBottom: `1px solid ${INK.hair}` }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: INK.ink28, minWidth: 70, flexShrink: 0 }}>{label}</span>
          <span style={{ fontFamily: SERIF, fontSize: 13, color: INK.ink70, lineHeight: 1.5 }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── 비로그인 게이트: 엔진 분석은 보여주고 AI 섹션은 블러 ──
function CompatPreviewGate({ onLogin }: { onLogin: () => void }) {
  useEffect(() => { track('saju_preview_view', { type: 'compat' }); }, []);
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, filter: 'blur(3px)', opacity: 0.5, pointerEvents: 'none' }} aria-hidden>
        {COMPAT_SECTION_TITLES.map((t, i) => (
          <div key={i} style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 10, background: INK.card, padding: '14px 18px' }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: INK.ink28 }}>
              {String(i + 1).padStart(2, '0')}  {t}
            </span>
            <p style={{ margin: '4px 0 0', fontFamily: SERIF, fontSize: 14.5, fontWeight: 600, color: INK.ink }}>
              {COMPAT_SECTION_SUBTITLES[i]}
            </p>
            <p style={{ margin: '10px 0 0', fontFamily: SERIF, fontSize: 13.5, lineHeight: 1.8, color: INK.ink45 }}>
              두 사람의 일간·일지·십신 관계를 근거로 어떤 상황에서 끌리고 부딪히는지 구체적으로 써준다.
            </p>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 360, textAlign: 'center', padding: '24px 20px', borderRadius: 14,
          background: 'rgba(12,9,7,0.94)', border: `1px solid ${INK.cardLine}`, boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
          <p style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: INK.ink, margin: 0 }}>끌리는 이유, 부딪히는 이유</p>
          <p style={{ fontFamily: SERIF, fontSize: 13, color: INK.ink45, margin: '8px 0 16px', lineHeight: 1.6 }}>
            점수와 관계 분석은 위에 그대로 보실 수 있습니다. 풀이 {COMPAT_SECTION_TITLES.length}편은 로그인 후 크레딧 1개.
          </p>
          <button onClick={onLogin}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: INK.gold, color: '#1a140c', fontFamily: SERIF, fontSize: 14.5, fontWeight: 600, letterSpacing: 1 }}>
            궁합 풀이 보기
          </button>
        </div>
      </div>
    </div>
  );
}

interface CompatLocalResult {
  analysis: CompatAnalysis;
}

type Mode = 'both' | 'invite';
const RELATIONS: CompatRelation[] = ['lover', 'friend', 'coworker', 'family'];

// ── 관계 선택 칩 ──
function RelationChips({ value, onChange }: { value: CompatRelation; onChange: (r: CompatRelation) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {RELATIONS.map(r => (
        <button key={r} onClick={() => onChange(r)}
          style={{ padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: MONO, fontSize: 12,
            border: `1px solid ${value === r ? INK.gold : INK.cardLine}`,
            background: value === r ? 'rgba(194,163,91,0.12)' : 'transparent', color: value === r ? INK.gold : INK.ink45 }}>
          {RELATION_LABEL[r]}
        </button>
      ))}
    </div>
  );
}

// ── 초대 링크 결과 카드 ──
function InviteLinkCard({ inv, onReset }: { inv: InviteCreateResponse; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}${inv.path}` : inv.path;
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  }
  async function share() {
    const text = `${inv.hook.line} — 생년월일만 넣으면 둘의 궁합이 열립니다`;
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: '술자리 궁합 초대', text, url }); return; } catch { /* 취소 */ }
    }
    await copy();
  }
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ border: `1px solid rgba(194,163,91,0.35)`, borderRadius: 14, background: 'rgba(194,163,91,0.06)', padding: '20px 18px' }}>
      <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: INK.ink45 }}>초대 링크 · {RELATION_LABEL[inv.relation]} · 7일</p>
      <p style={{ margin: '10px 0 0', fontFamily: SERIF, fontSize: 15, lineHeight: 1.6, color: INK.ink }}>
        <span style={{ color: INK.gold }}>{inv.hook.dayPillarHanja}</span> · {inv.hook.line}
      </p>
      <p style={{ margin: '6px 0 0', fontFamily: MONO, fontSize: 11, color: INK.ink28 }}>상대에게는 이 카드만 보입니다. 내 생년월일은 전달되지 않습니다.</p>
      <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', fontFamily: MONO, fontSize: 12, color: INK.ink70, wordBreak: 'break-all' }}>{url}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={share} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', background: INK.gold, color: '#1a140c', fontFamily: SERIF, fontSize: 14, fontWeight: 600 }}>
          카톡·문자로 보내기
        </button>
        <button onClick={copy} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: `1px solid ${INK.cardLine}`, cursor: 'pointer', background: 'transparent', color: INK.ink70, fontFamily: SERIF, fontSize: 14 }}>
          {copied ? '복사했습니다' : '링크 복사'}
        </button>
      </div>
      <p style={{ margin: '12px 0 0', textAlign: 'center', fontFamily: MONO, fontSize: 11, color: INK.ink45 }}>
        상대가 수락하면 두 분 다 결과를 보시고, 두 분 다 크레딧 +1입니다.
      </p>
      <button onClick={onReset} style={{ marginTop: 10, width: '100%', padding: 10, borderRadius: 8, border: 'none', background: 'transparent', color: INK.ink28, fontFamily: MONO, fontSize: 12, cursor: 'pointer' }}>
        다른 초대 만들기
      </button>
    </motion.div>
  );
}

// ── 크레딧 소진 (궁합) ──
function CompatCreditZero({ onInvite }: { onInvite: () => void }) {
  return (
    <div style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 14, background: INK.card, padding: '20px 18px' }}>
      <p style={{ margin: 0, fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: INK.ink }}>오늘 한 편은 이미 읽으셨습니다</p>
      <p style={{ margin: '6px 0 14px', fontFamily: SERIF, fontSize: 13, color: INK.ink45, lineHeight: 1.6 }}>
        풀이 한 편에 크레딧 1개입니다. 다만 궁합은 길이 하나 더 있습니다. 상대에게 초대 링크를 보내시면
        <b style={{ color: INK.ink70 }}> 크레딧을 쓰지 않고 두 분 다</b> 보시고, 두 분 다 크레딧 +1입니다.
      </p>
      <button onClick={onInvite} style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', background: INK.gold, color: '#1a140c', fontFamily: SERIF, fontSize: 14, fontWeight: 600 }}>
        초대 링크로 보내기
      </button>
    </div>
  );
}

// ── 메인 페이지 컴포넌트 ──
export function SajuCompatPage({ loggedIn = true, initialMode = 'both', readingId }: { loggedIn?: boolean; initialMode?: Mode; readingId?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [relation, setRelation] = useState<CompatRelation>('lover');
  const [formA, setFormA] = useState<PersonForm>({ ...PERSON_DEFAULTS });
  const [formB, setFormB] = useState<PersonForm>({ ...PERSON_DEFAULTS });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatResponse | null>(null);
  const [local, setLocal] = useState<CompatLocalResult | null>(null);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [creditZero, setCreditZero] = useState(false);
  const [invite, setInvite] = useState<InviteCreateResponse | null>(null);
  const [saved, setSaved] = useState<SavedReading | null>(null);

  // 저장된 궁합 리딩 복원 (이력 진입) — 분석은 두 chart 로 로컬 재계산
  useEffect(() => {
    if (!readingId) return;
    setLoading(true);
    fetch(`/api/saju/readings/${readingId}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: SavedReading | null) => {
        if (!d?.chart || !d.partner?.chart || !d.ai_sections) return;
        const advA = analyzeAdvanced(d.chart, daysFromJie(d.chart));
        const advB = analyzeAdvanced(d.partner.chart, daysFromJie(d.partner.chart));
        const analysis = compareCharts(d.chart, d.partner.chart, advA.strengths.ratios, advB.strengths.ratios);
        setSaved(d);
        setRelation(d.partner.relation);
        setResult({ cacheKey: '', cached: true, sections: d.ai_sections, analysis, tier: 'free', readingId: d.id });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [readingId]);

  async function deleteSaved() {
    if (!saved) return;
    if (!window.confirm('이 궁합 기록과 상대 출생정보를 삭제할까?')) return;
    const res = await fetch(`/api/saju/readings/${saved.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/saju');
  }

  // 로그인 전 입력을 복원 (재입력 0회)
  useEffect(() => {
    if (readingId) return;
    try {
      const raw = sessionStorage.getItem('saju:compat-form');
      if (raw) {
        const s = JSON.parse(raw) as { a: PersonForm; b: PersonForm; relation?: CompatRelation; mode?: Mode; resume?: boolean };
        setFormA(s.a); setFormB(s.b);
        if (s.relation) setRelation(s.relation);
        if (s.mode) setMode(s.mode);
        if (s.resume && loggedIn) { sessionStorage.removeItem('saju:compat-form'); setAutoSubmit(true); }
      }
    } catch { /* ignore */ }
  }, [loggedIn, readingId]);

  // 초대 링크 생성 (로그인 필요)
  const createInvite = useCallback(async () => {
    setError(null);
    const toNum = (s: string) => (s.trim() === '' ? null : parseInt(s, 10));
    const y = toNum(formA.year), m = toNum(formA.month), d = toNum(formA.day);
    if (!y || !m || !d) { setError('내 생년월일을 입력해 주세요.'); return; }
    try { sessionStorage.setItem('saju:compat-form', JSON.stringify({ a: formA, b: formB, relation, mode: 'invite' })); } catch { /* ignore */ }
    if (!loggedIn) {
      track('saju_login_prompt', { type: 'invite_create' });
      try { sessionStorage.setItem('saju:compat-form', JSON.stringify({ a: formA, b: formB, relation, mode: 'invite', resume: true })); } catch { /* ignore */ }
      router.push(`/auth/login?next=${encodeURIComponent('/saju/compat?mode=invite')}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/saju/compat/invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relation, person: { year: y, month: m, day: d, hour: formA.unknownHour ? null : toNum(formA.hour), sex: formA.sex, name: formA.name || undefined, longitudeE: 127.0 } }),
      });
      const data = await res.json() as InviteCreateResponse & { error?: string };
      if (!res.ok) { setError(data.error ?? '오류'); return; }
      track('saju_invite_create', { relation });
      setInvite(data);
    } catch { setError('네트워크 오류'); }
    finally { setLoading(false); }
  }, [formA, formB, relation, loggedIn, router]);

  const handleSubmit = useCallback(async () => {
    setError(null);

    const toNum = (s: string) => (s.trim() === '' ? null : parseInt(s, 10));

    const yA = toNum(formA.year), mA = toNum(formA.month), dA = toNum(formA.day);
    const yB = toNum(formB.year), mB = toNum(formB.month), dB = toNum(formB.day);

    if (!yA || !mA || !dA || !yB || !mB || !dB) {
      setError('두 분 모두 생년월일을 입력해 주세요.');
      return;
    }

    track('saju_form_submit', { type: 'compat', logged_in: loggedIn });
    try { sessionStorage.setItem('saju:compat-form', JSON.stringify({ a: formA, b: formB, relation, mode: 'both' })); } catch { /* ignore */ }

    // 1) 엔진 분석은 로그인 여부와 무관하게 클라이언트에서 (LLM 비용 0)
    setLoading(true);
    try {
      const index = await loadSeolgi();
      const fpA = calcLocal(index, { year: yA, month: mA, day: dA, hour: formA.unknownHour ? null : toNum(formA.hour), sex: formA.sex });
      const fpB = calcLocal(index, { year: yB, month: mB, day: dB, hour: formB.unknownHour ? null : toNum(formB.hour), sex: formB.sex });
      const advA = analyzeAdvanced(fpA, daysFromJie(fpA));
      const advB = analyzeAdvanced(fpB, daysFromJie(fpB));
      setLocal({ analysis: compareCharts(fpA, fpB, advA.strengths.ratios, advB.strengths.ratios) });
    } catch (e) {
      setError(`계산 오류: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
      setLoading(false);
      return;
    }

    // 2) AI 섹션은 로그인 시에만
    if (!loggedIn) { setLoading(false); return; }
    try {
      const res = await fetch('/api/saju/compat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personA: {
            year: yA, month: mA, day: dA,
            hour: formA.unknownHour ? null : toNum(formA.hour),
            sex: formA.sex, name: formA.name || undefined,
            longitudeE: 127.0,
          },
          personB: {
            year: yB, month: mB, day: dB,
            hour: formB.unknownHour ? null : toNum(formB.hour),
            sex: formB.sex, name: formB.name || undefined,
            longitudeE: 127.0,
          },
          relation,
          tier: 'free',
        }),
      });

      const data = await res.json() as CompatResponse & { error?: string; message?: string };
      if (!res.ok) {
        if (res.status === 402) { track('saju_credit_zero', { type: 'compat' }); setCreditZero(true); return; }
        setError(data.message ?? data.error ?? '오류가 발생했습니다.');
        return;
      }
      track('saju_reading_view', { type: 'compat', cached: data.cached });
      setResult(data);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [formA, formB, relation, loggedIn]);

  // 로그인 후 돌아오면 자동 제출 (모드별)
  useEffect(() => {
    if (!autoSubmit) return;
    setAutoSubmit(false);
    if (mode === 'invite') void createInvite(); else void handleSubmit();
  }, [autoSubmit, mode, handleSubmit, createInvite]);

  function handleLogin() {
    track('saju_login_prompt', { type: 'compat' });
    try { sessionStorage.setItem('saju:compat-form', JSON.stringify({ a: formA, b: formB, relation, mode: 'both', resume: true })); } catch { /* ignore */ }
    router.push(`/auth/login?next=${encodeURIComponent('/saju/compat')}`);
  }

  const analysis = result?.analysis ?? local?.analysis ?? null;

  return (
    <main style={{ minHeight: '100dvh', paddingTop: 56, paddingBottom: 32 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>

        {/* 헤더 */}
        <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700, color: INK.ink,
            WebkitTextStroke: '0.5px currentColor', margin: 0, letterSpacing: 2 }}>
            궁합
          </h1>
          <p style={{ fontFamily: MONO, fontSize: 12, color: INK.ink45, marginTop: 8, letterSpacing: 1 }}>
            두 사주로 보는 케미
          </p>
        </div>

        {invite ? (
          <InviteLinkCard inv={invite} onReset={() => setInvite(null)} />
        ) : creditZero ? (
          <CompatCreditZero onInvite={() => { setCreditZero(false); setLocal(null); setMode('invite'); }} />
        ) : !analysis ? (
          // ── 입력 폼 ──
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 모드 토글 */}
            <div style={{ display: 'flex', borderRadius: 10, border: `1px solid ${INK.cardLine}`, padding: 4, background: 'rgba(232,223,200,0.02)' }}>
              {([['both', '둘 다 입력'], ['invite', '상대에게 링크 보내기']] as [Mode, string][]).map(([mv, label]) => (
                <button key={mv} onClick={() => setMode(mv)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: SERIF, fontSize: 13.5,
                    background: mode === mv ? 'rgba(232,223,200,0.10)' : 'transparent', color: mode === mv ? INK.ink : INK.ink45, fontWeight: mode === mv ? 600 : 400 }}>
                  {label}
                </button>
              ))}
            </div>

            <RelationChips value={relation} onChange={setRelation} />

            <PersonInput label={mode === 'invite' ? '나' : '첫 번째 사람 (A)'} form={formA} onChange={setFormA} />

            {mode === 'both' && (
              <>
                <div style={{ textAlign: 'center', color: INK.ink28, fontFamily: SERIF, fontSize: 20 }}>×</div>
                <PersonInput label="두 번째 사람 (B)" form={formB} onChange={setFormB} />
              </>
            )}

            {error && (
              <p style={{ color: '#c4685a', fontFamily: MONO, fontSize: 12, textAlign: 'center', margin: 0 }}>
                {error}
              </p>
            )}

            <button
              onClick={mode === 'invite' ? createInvite : handleSubmit}
              disabled={loading}
              style={{
                marginTop: 8, padding: '14px', borderRadius: 10, border: 'none',
                background: loading ? 'rgba(194,163,91,0.3)' : 'rgba(194,163,91,0.15)',
                color: INK.gold, fontFamily: SERIF, fontSize: 15, cursor: loading ? 'default' : 'pointer',
                letterSpacing: 2, transition: 'background .2s', width: '100%',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(194,163,91,0.3)',
              }}
            >
              {loading ? (mode === 'invite' ? '링크 만드는 중…' : '분석 중…') : (mode === 'invite' ? '초대 링크 만들기' : '궁합 보기')}
            </button>

            <p style={{ textAlign: 'center', fontFamily: MONO, fontSize: 11, color: INK.ink28, margin: 0, lineHeight: 1.6 }}>
              {mode === 'invite'
                ? '상대가 생년월일을 입력하면 두 분 다 무료로 결과를 보십니다. 상대에게 내 생년월일은 보이지 않습니다.'
                : '점수·관계 분석은 무료 · 풀이는 로그인 후 크레딧 1개'}
            </p>
          </div>
        ) : (
          // ── 결과 ──
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {saved && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: MONO, fontSize: 11, color: INK.ink45 }}>
                  <span>{RELATION_LABEL[relation]} 궁합 · 상대 {saved.partner?.name ? saved.partner.name : `${saved.partner?.day_stem ?? ''}일간`}</span>
                  <button onClick={deleteSaved} style={{ border: 'none', background: 'transparent', color: INK.ink28, cursor: 'pointer', fontFamily: MONO, fontSize: 11 }}>기록·상대정보 삭제</button>
                </div>
              )}

              {/* 점수 */}
              <div style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 12, background: INK.card }}>
                <CompatScoreBar score={analysis.score} level={analysis.level} headline={result?.sections?.[0]?.title} />
              </div>

              {/* 분석 요약 */}
              <AnalysisPanel analysis={analysis} />
              <SummaryChips summary={analysis.summary} />

              {/* AI 섹션 — 로그인 전엔 게이트, 로그인 후 로딩 중엔 스피너 */}
              {result
                ? result.sections.map((s, i) => <SectionCard key={i} section={s} index={i} />)
                : loggedIn
                  ? <p style={{ textAlign: 'center', fontFamily: MONO, fontSize: 12, color: INK.ink45, padding: '20px 0' }}>{loading ? '풀이 중…' : (error ?? '')}</p>
                  : <CompatPreviewGate onLogin={handleLogin} />}

              {/* 다시 보기 버튼 */}
              <button
                onClick={() => { if (saved) { router.push('/saju/compat'); return; } setResult(null); setLocal(null); }}
                style={{ padding: '12px', borderRadius: 8, border: `1px solid ${INK.cardLine}`,
                  background: 'transparent', color: INK.ink45, fontFamily: MONO, fontSize: 13,
                  cursor: 'pointer', marginTop: 4 }}
              >
                다시 입력
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}
