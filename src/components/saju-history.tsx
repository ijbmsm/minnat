"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SajuHistoryItem } from "@/app/api/saju/history/route";

// ── Design tokens ──
const INK = {
  hair:  'rgba(232,223,200,0.085)',
  ink:   'rgba(232,223,200,0.94)',
  ink70: 'rgba(232,223,200,0.66)',
  ink45: 'rgba(232,223,200,0.42)',
  ink28: 'rgba(232,223,200,0.26)',
  gold:  '#c2a35b',
};
const SERIF = 'var(--font-noto-serif-kr), serif';
const MONO  = 'var(--font-ibm-plex-mono), monospace';

// ── Element color map ──
const OH: Record<string, { color: string; soft: string }> = {
  목: { color: '#7e9a6f', soft: 'rgba(126,154,111,0.16)' },
  화: { color: '#c4685a', soft: 'rgba(196,104,90,0.16)'  },
  토: { color: '#c0974f', soft: 'rgba(192,151,79,0.16)'  },
  금: { color: '#c9c2ad', soft: 'rgba(201,194,173,0.14)' },
  수: { color: '#6f88a6', soft: 'rgba(111,136,166,0.16)' },
};

const TYPE_LABEL: Record<string, string> = {
  full:   '종합',
  today:  '오늘',
  love:   '연애',
  career: '직업·재물',
};

type Status = 'loading' | 'unauthed' | 'empty' | 'loaded';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return '방금';
  if (m < 60)  return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

interface SajuHistoryProps {
  maxItems?: number;
  variant?: 'standalone' | 'sidebar';
}

export function SajuHistory({ maxItems = 5, variant = 'standalone' }: SajuHistoryProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [items, setItems] = useState<SajuHistoryItem[]>([]);

  useEffect(() => {
    fetch('/api/saju/history')
      .then(r => {
        if (r.status === 401) { setStatus('unauthed'); return null; }
        return r.ok ? r.json() : null;
      })
      .then(d => {
        if (d === null) return;
        setItems(d?.items ?? []);
        setStatus(d?.items?.length > 0 ? 'loaded' : 'empty');
      })
      .catch(() => setStatus('empty'));
  }, []);

  const isSidebar = variant === 'sidebar';

  // ── 로딩 스켈레톤 ──
  if (status === 'loading') {
    const skRows = isSidebar ? 4 : 3;
    const rowPad = isSidebar ? '15px 6px' : '13px 4px';
    return (
      <div style={!isSidebar ? { marginTop: 40 } : {}}>
        {Array.from({ length: skRows }).map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: isSidebar ? 14 : 12,
            padding: rowPad,
            borderTop: i === 0 ? 'none' : `1px solid ${INK.hair}`,
          }}>
            <div className="saju-skeleton" style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div className="saju-skeleton" style={{ width: `${55 + i * 10}%`, height: 13, borderRadius: 4 }} />
              <div className="saju-skeleton" style={{ width: `${35 + i * 8}%`, height: 11, borderRadius: 4 }} />
            </div>
            <div className="saju-skeleton" style={{ width: 36, height: 11, borderRadius: 4, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    );
  }

  // ── 비로그인 안내 ──
  if (status === 'unauthed') {
    const wrapper: React.CSSProperties = isSidebar
      ? { padding: '20px 6px 8px', textAlign: 'center' }
      : { marginTop: 40, padding: '24px 4px', textAlign: 'center' };
    return (
      <div style={wrapper}>
        <p style={{
          fontFamily: SERIF, fontSize: 13, lineHeight: 1.8,
          color: INK.ink28, marginBottom: 12,
        }}>
          로그인하면 열람한 사주가<br />여기에 기록됩니다
        </p>
        <Link href="/auth/login" style={{
          display: 'inline-block',
          fontFamily: MONO, fontSize: 11, letterSpacing: 0.8,
          color: INK.gold,
          border: `1px solid rgba(194,163,91,0.3)`,
          borderRadius: 6,
          padding: '5px 14px',
          textDecoration: 'none',
        }}>
          로그인
        </Link>
      </div>
    );
  }

  // ── 로그인은 됐지만 이력 없음 ──
  if (status === 'empty') return null;

  // ── 이력 목록 ──
  const rowGap = isSidebar ? 14 : 12;
  const rowPadV = isSidebar ? 15 : 13;
  const rowPadH = isSidebar ? 6 : 4;

  const rows = (
    <div>
      {items.slice(0, maxItems).map((item, idx) => {
        const el = item.day_element ? OH[item.day_element] : null;
        const elColor = el?.color ?? INK.ink45;
        const elSoft = el?.soft ?? 'rgba(232,223,200,0.06)';
        const typeColor = item.type === 'today' ? INK.gold : elColor;

        return (
          <Link
            key={item.id}
            href={`/saju/${item.type}/${item.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: rowGap,
              padding: `${rowPadV}px ${rowPadH}px`,
              borderTop: idx === 0 ? 'none' : `1px solid ${INK.hair}`,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            {/* Day stem badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: 8, flexShrink: 0,
              background: elSoft,
              color: elColor,
              border: `1px solid ${elColor}33`,
              fontFamily: SERIF, fontSize: 18, fontWeight: 600,
            }}>
              {item.day_stem ?? '?'}
            </span>

            {/* Middle */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontFamily: MONO, fontSize: 11, letterSpacing: 0.5,
                  color: typeColor,
                }}>
                  {TYPE_LABEL[item.type] ?? item.type}
                </span>
                {item.birth_name ? (
                  <span style={{
                    fontFamily: SERIF, fontSize: 15.5, fontWeight: 500,
                    color: INK.ink,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.birth_name}
                  </span>
                ) : (
                  <span style={{ fontFamily: SERIF, fontSize: 15.5, fontWeight: 500, color: INK.ink45 }}>
                    {item.birth_year}.{String(item.birth_month).padStart(2, '0')}.{String(item.birth_day).padStart(2, '0')}
                  </span>
                )}
              </div>
              {item.concern && (
                <p style={{
                  fontFamily: SERIF, fontSize: 12.5, color: INK.ink45,
                  marginTop: 4, marginBottom: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.concern}
                </p>
              )}
            </div>

            {/* Time */}
            <span style={{
              fontFamily: MONO, fontSize: 11,
              color: INK.ink28, flexShrink: 0,
            }}>
              {relativeTime(item.last_viewed_at)}
            </span>
          </Link>
        );
      })}
    </div>
  );

  if (isSidebar) return rows;

  return (
    <div style={{ marginTop: 40 }}>
      {rows}
    </div>
  );
}
