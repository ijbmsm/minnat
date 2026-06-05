"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CompatResponse, CompatSection } from "@/app/api/saju/compat/route";
import type { CompatAnalysis } from "@/lib/saju/compat";

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
function CompatScoreBar({ score, level }: { score: number; level: string }) {
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
function SectionCard({ section }: { section: CompatSection }) {
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
        <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 500, color: INK.ink70 }}>
          {section.title}
        </span>
        <span style={{ color: INK.ink28, fontSize: 12, fontFamily: MONO }}>{open ? '▲' : '▼'}</span>
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

// ── 메인 페이지 컴포넌트 ──
export function SajuCompatPage() {
  const [formA, setFormA] = useState<PersonForm>({ ...PERSON_DEFAULTS });
  const [formB, setFormB] = useState<PersonForm>({ ...PERSON_DEFAULTS });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatResponse | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);

    const toNum = (s: string) => (s.trim() === '' ? null : parseInt(s, 10));

    const yA = toNum(formA.year), mA = toNum(formA.month), dA = toNum(formA.day);
    const yB = toNum(formB.year), mB = toNum(formB.month), dB = toNum(formB.day);

    if (!yA || !mA || !dA || !yB || !mB || !dB) {
      setError('두 사람 모두 생년월일을 입력해주세요.');
      return;
    }

    setLoading(true);
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
          tier: 'free',
        }),
      });

      const data = await res.json() as CompatResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? '오류가 발생했습니다.');
        return;
      }
      setResult(data);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [formA, formB]);

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

        {!result ? (
          // ── 입력 폼 ──
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <PersonInput label="첫 번째 사람 (A)" form={formA} onChange={setFormA} />

            {/* 구분 */}
            <div style={{ textAlign: 'center', color: INK.ink28, fontFamily: SERIF, fontSize: 20 }}>×</div>

            <PersonInput label="두 번째 사람 (B)" form={formB} onChange={setFormB} />

            {error && (
              <p style={{ color: '#c4685a', fontFamily: MONO, fontSize: 12, textAlign: 'center', margin: 0 }}>
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                marginTop: 8, padding: '14px', borderRadius: 10, border: 'none',
                background: loading ? 'rgba(194,163,91,0.3)' : 'rgba(194,163,91,0.15)',
                color: INK.gold, fontFamily: SERIF, fontSize: 15, cursor: loading ? 'default' : 'pointer',
                letterSpacing: 2, transition: 'background .2s', width: '100%',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(194,163,91,0.3)',
              }}
            >
              {loading ? '분석 중…' : '궁합 보기'}
            </button>

            <p style={{ textAlign: 'center', fontFamily: MONO, fontSize: 11, color: INK.ink28, margin: 0 }}>
              무료 3회/일
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
              {/* 점수 */}
              <div style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 12, background: INK.card }}>
                <CompatScoreBar score={result.analysis.score} level={result.analysis.level} />
              </div>

              {/* 분석 요약 */}
              <AnalysisPanel analysis={result.analysis} />

              {/* AI 섹션 */}
              {result.sections.map((s, i) => (
                <SectionCard key={i} section={s} />
              ))}

              {/* 다시 보기 버튼 */}
              <button
                onClick={() => setResult(null)}
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
