"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { InvitePublicView } from "@/lib/saju/invite-server";
import type { InvitePreviewResponse } from "@/app/api/saju/compat/invite/[token]/preview/route";
import type { CompatResponse } from "@/app/api/saju/compat/route";
import type { CompatAnalysis } from "@/lib/saju/compat";
import { RELATION_LABEL } from "@/lib/saju/compat";
import { COMPAT_SECTION_TITLES } from "@/lib/saju/sections";
import { track } from "@/lib/analytics";

const INK = {
  bg: '#0c0907', card: 'rgba(232,223,200,0.035)', cardLine: 'rgba(232,223,200,0.10)', hair: 'rgba(232,223,200,0.085)',
  ink: 'rgba(232,223,200,0.94)', ink70: 'rgba(232,223,200,0.66)', ink45: 'rgba(232,223,200,0.42)', ink28: 'rgba(232,223,200,0.26)', gold: '#c2a35b',
};
const OH: Record<string, string> = { 목: '#7e9a6f', 화: '#c4685a', 토: '#c0974f', 금: '#c9c2ad', 수: '#6f88a6' };
const SERIF = 'var(--font-noto-serif-kr), "Apple SD Gothic Neo", serif';
const MONO  = 'var(--font-ibm-plex-mono), "Courier New", monospace';

interface PersonForm { name: string; year: string; month: string; day: string; hour: string; sex: 'male' | 'female'; unknownHour: boolean }
const DEFAULTS: PersonForm = { name: '', year: '', month: '', day: '', hour: '', sex: 'female', unknownHour: false };
const STORAGE_KEY = 'saju:invite-form';

function toPerson(f: PersonForm) {
  const n = (s: string) => (s.trim() === '' ? null : parseInt(s, 10));
  const year = n(f.year), month = n(f.month), day = n(f.day);
  if (!year || !month || !day) return null;
  return { year, month, day, hour: f.unknownHour ? null : n(f.hour), minute: 0, sex: f.sex, longitudeE: 127.0, dayBoundaryRule: 'midnight' as const, name: f.name.trim() || undefined };
}

function InviterCard({ v }: { v: InvitePublicView }) {
  const color = OH[v.inviter.element] ?? INK.ink;
  return (
    <div style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 14, background: INK.card, padding: '22px 20px', display: 'flex', gap: 18, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 700, color, lineHeight: 1 }}>{v.inviter.stem}</span>
        <span style={{ fontFamily: SERIF, fontSize: 34, color: INK.ink45, lineHeight: 1, marginBottom: 3 }}>{v.inviter.branch}</span>
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: INK.ink45 }}>
          {v.inviter.hook.dayPillarHanja} · {v.inviter.hook.keyword}
        </p>
        <p style={{ margin: '8px 0 0', fontFamily: SERIF, fontSize: 15.5, lineHeight: 1.6, color: INK.ink }}>
          {v.inviter.hook.line}
        </p>
        <p style={{ margin: '8px 0 0', fontFamily: MONO, fontSize: 11, color: INK.ink28 }}>
          끌리는 기운 · {v.inviter.hook.partnerElementHanja}
        </p>
      </div>
    </div>
  );
}

function ScoreBlock({ a }: { a: CompatAnalysis }) {
  const color = a.score >= 80 ? '#c2a35b' : a.score >= 65 ? '#7e9a6f' : a.score >= 45 ? '#6f88a6' : a.score >= 30 ? '#c0974f' : '#c4685a';
  return (
    <div style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 12, background: INK.card, padding: '20px 18px', textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: 12, color: INK.ink45, letterSpacing: 2 }}>궁합 점수</div>
      <div style={{ fontFamily: MONO, fontSize: 48, fontWeight: 700, color, lineHeight: 1.1 }}>{a.score}</div>
      <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 12px', borderRadius: 20, border: `1px solid ${color}`, color, fontFamily: MONO, fontSize: 12 }}>{a.level}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 14 }}>
        {a.summary.map((s, i) => (
          <span key={i} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, border: `1px solid ${INK.cardLine}`, color: INK.ink45, fontFamily: MONO }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

export function SajuCompatInvitePage({ token, invite, loggedIn, isInviter }: {
  token: string; invite: InvitePublicView | null; loggedIn: boolean; isInviter: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PersonForm>(DEFAULTS);
  const [analysis, setAnalysis] = useState<CompatAnalysis | null>(null);
  const [result, setResult] = useState<CompatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoAccept, setAutoAccept] = useState(false);

  // 로그인 전 입력 복원 → 자동 수락
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { token: string; form: PersonForm; resume?: boolean };
      if (saved.token !== token) return;
      setForm(saved.form);
      if (saved.resume && loggedIn) { sessionStorage.removeItem(STORAGE_KEY); setAutoAccept(true); }
    } catch { /* ignore */ }
  }, [token, loggedIn]);

  const preview = useCallback(async () => {
    setError(null);
    const person = toPerson(form);
    if (!person) { setError('생년월일을 입력해줘.'); return; }
    track('saju_form_submit', { type: 'invite', logged_in: loggedIn });
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, form })); } catch { /* ignore */ }
    setLoading(true);
    try {
      const res = await fetch(`/api/saju/compat/invite/${token}/preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ person }) });
      const data = await res.json() as InvitePreviewResponse & { error?: string };
      if (!res.ok) { setError(data.error ?? '오류'); return; }
      setAnalysis(data.analysis);
      track('saju_preview_view', { type: 'invite' });
    } catch { setError('네트워크 오류'); }
    finally { setLoading(false); }
  }, [form, token, loggedIn]);

  const accept = useCallback(async () => {
    setError(null);
    const person = toPerson(form);
    if (!person) { setError('생년월일을 입력해줘.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/saju/compat/invite/${token}/accept`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ person }) });
      const data = await res.json() as CompatResponse & { error?: string; message?: string };
      if (!res.ok) { setError(data.message ?? data.error ?? '오류'); return; }
      setResult(data); setAnalysis(data.analysis);
      track('saju_invite_accept', { relation: invite?.relation ?? 'lover' });
    } catch { setError('네트워크 오류'); }
    finally { setLoading(false); }
  }, [form, token, invite]);

  useEffect(() => { if (autoAccept) { setAutoAccept(false); void accept(); } }, [autoAccept, accept]);

  function goLogin() {
    track('saju_login_prompt', { type: 'invite' });
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, form, resume: true })); } catch { /* ignore */ }
    router.push(`/auth/login?next=${encodeURIComponent(`/saju/compat/i/${token}`)}`);
  }

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${INK.cardLine}`, background: 'transparent', color: INK.ink, borderRadius: 8,
    padding: '11px 12px', fontFamily: MONO, fontSize: 15, outline: 'none', WebkitAppearance: 'none', MozAppearance: 'textfield',
  };

  if (!invite) {
    return (
      <main style={{ minHeight: '100dvh', background: INK.bg, color: INK.ink, fontFamily: SERIF, padding: '120px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 18 }}>초대 링크를 찾을 수 없어.</p>
        <p style={{ fontSize: 13, color: INK.ink45 }}>링크가 잘못됐거나 삭제됐어. 보낸 사람에게 다시 받아줘.</p>
      </main>
    );
  }

  const rel = RELATION_LABEL[invite.relation];

  return (
    <main style={{ minHeight: '100dvh', background: INK.bg, color: INK.ink, fontFamily: SERIF, paddingTop: 56, paddingBottom: 48 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', padding: '28px 0 20px' }}>
          <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, letterSpacing: 2, color: INK.ink45 }}>{rel} 궁합 초대</p>
          <h1 style={{ margin: '10px 0 0', fontSize: 24, fontWeight: 600, lineHeight: 1.4 }}>
            {invite.inviter.name ? `${invite.inviter.name}이(가)` : '누군가'} 너와의 궁합이 궁금하대
          </h1>
        </div>

        <InviterCard v={invite} />

        {invite.expired && (
          <p style={{ marginTop: 14, textAlign: 'center', color: '#c4685a', fontFamily: MONO, fontSize: 12 }}>초대가 만료됐어. 다시 보내달라고 해줘.</p>
        )}
        {isInviter && (
          <p style={{ marginTop: 14, textAlign: 'center', color: INK.ink45, fontFamily: MONO, fontSize: 12 }}>이건 내가 만든 초대야. 상대가 수락하면 이력에 결과가 올라와.</p>
        )}

        {!invite.expired && !isInviter && !result && (
          <div style={{ marginTop: 16, border: `1px solid ${INK.cardLine}`, borderRadius: 14, background: INK.card, padding: '20px 18px' }}>
            <p style={{ margin: '0 0 14px', fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, color: INK.ink45 }}>내 생년월일</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 8 }}>
              <input type="number" inputMode="numeric" placeholder="년도" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} style={inputStyle} />
              <input type="number" inputMode="numeric" placeholder="월" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} style={inputStyle} />
              <input type="number" inputMode="numeric" placeholder="일" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
              <input type="number" inputMode="numeric" placeholder="시 (0~23)" value={form.hour} disabled={form.unknownHour}
                onChange={e => setForm({ ...form, hour: e.target.value })} style={{ ...inputStyle, width: 120, opacity: form.unknownHour ? 0.35 : 1 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: INK.ink45, fontFamily: MONO, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.unknownHour} onChange={e => setForm({ ...form, unknownHour: e.target.checked, hour: '' })} /> 시간 모름
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {(['female', 'male'] as const).map(sx => (
                <button key={sx} onClick={() => setForm({ ...form, sex: sx })}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${form.sex === sx ? INK.gold : INK.cardLine}`,
                    background: form.sex === sx ? 'rgba(194,163,91,0.12)' : 'transparent', color: form.sex === sx ? INK.gold : INK.ink45, cursor: 'pointer', fontFamily: MONO, fontSize: 13 }}>
                  {sx === 'female' ? '여' : '남'}
                </button>
              ))}
            </div>
            <input type="text" placeholder="이름 (선택)" value={form.name} maxLength={20} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginTop: 10 }} />
            {error && <p style={{ color: '#c4685a', fontFamily: MONO, fontSize: 12, textAlign: 'center', margin: '12px 0 0' }}>{error}</p>}
            {!analysis ? (
              <button onClick={preview} disabled={loading}
                style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: INK.gold, color: '#1a140c', fontFamily: SERIF, fontSize: 15, fontWeight: 600, letterSpacing: 1 }}>
                {loading ? '계산 중…' : '둘의 궁합 보기'}
              </button>
            ) : null}
            <p style={{ margin: '10px 0 0', textAlign: 'center', fontFamily: MONO, fontSize: 10.5, color: INK.ink28 }}>
              내 생년월일은 상대에게 보이지 않아. 결과만 같이 봐.
            </p>
          </div>
        )}

        {analysis && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            <ScoreBlock a={analysis} />
            {result ? (
              <>
                {result.sections.map((s, i) => (
                  <div key={i} style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 10, background: INK.card, padding: '14px 18px' }}>
                    <p style={{ margin: 0, fontFamily: SERIF, fontSize: 14, fontWeight: 500, color: INK.ink70 }}>{s.title}</p>
                    <p style={{ margin: '10px 0 0', fontFamily: SERIF, fontSize: 14, lineHeight: 1.85, color: INK.ink, whiteSpace: 'pre-wrap' }}>{s.body}</p>
                  </div>
                ))}
                <p style={{ textAlign: 'center', fontFamily: MONO, fontSize: 11, color: INK.ink45, margin: '4px 0 0' }}>
                  둘 다 크레딧 +1. 이 결과는 내 이력에서 다시 볼 수 있어.
                </p>
                <button onClick={() => router.push('/saju/full')}
                  style={{ padding: 13, borderRadius: 10, border: `1px solid ${INK.cardLine}`, background: 'transparent', color: INK.ink70, fontFamily: SERIF, fontSize: 14, cursor: 'pointer' }}>
                  내 사주도 보기 →
                </button>
              </>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, filter: 'blur(3px)', opacity: 0.5, pointerEvents: 'none' }} aria-hidden>
                  {COMPAT_SECTION_TITLES.map((t, i) => (
                    <div key={i} style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 10, background: INK.card, padding: '14px 18px' }}>
                      <span style={{ fontFamily: SERIF, fontSize: 14, color: INK.ink70 }}>{t}</span>
                      <p style={{ margin: '10px 0 0', fontFamily: SERIF, fontSize: 13.5, lineHeight: 1.8, color: INK.ink45 }}>두 사람의 일간·일지·십신 관계를 근거로 구체적으로 써준다.</p>
                    </div>
                  ))}
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                  <div style={{ width: '100%', maxWidth: 340, textAlign: 'center', padding: '22px 18px', borderRadius: 14, background: 'rgba(12,9,7,0.95)', border: `1px solid ${INK.cardLine}` }}>
                    <p style={{ margin: 0, fontFamily: SERIF, fontSize: 16, fontWeight: 600 }}>풀이 4개가 준비됐어</p>
                    <p style={{ margin: '8px 0 16px', fontFamily: SERIF, fontSize: 13, color: INK.ink45, lineHeight: 1.6 }}>
                      초대로 보는 궁합은 둘 다 무료. 결과를 저장하려면 로그인이 필요해.
                    </p>
                    {error && <p style={{ color: '#c4685a', fontFamily: MONO, fontSize: 12, margin: '0 0 10px' }}>{error}</p>}
                    <button onClick={loggedIn ? accept : goLogin} disabled={loading}
                      style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', background: INK.gold, color: '#1a140c', fontFamily: SERIF, fontSize: 14.5, fontWeight: 600 }}>
                      {loading ? '풀이 중…' : loggedIn ? '결과 보기' : '카카오로 1초 로그인'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
