"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SajuHistoryItem } from "@/app/api/saju/history/route";
import { ELEMENT_COLOR } from "@/lib/saju";

const TYPE_LABEL: Record<string, string> = {
  full:  '종합',
  today: '오늘',
  love:  '연애',
};

const TYPE_COLOR: Record<string, string> = {
  full:  'text-white/50',
  today: 'text-amber-400/70',
  love:  'text-rose-400/70',
};

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

export function SajuHistory({ maxItems = 5 }: { maxItems?: number }) {
  const [items, setItems] = useState<SajuHistoryItem[] | null>(null);

  useEffect(() => {
    fetch('/api/saju/history')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.items) setItems(d.items); })
      .catch(() => {});
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <div className="w-full max-w-[500px] mt-8">
      <p className="text-[10px] text-white/25 tracking-widest mb-3 px-1">최근 열람</p>
      <div className="space-y-2">
        {items.slice(0, maxItems).map(item => (
          <Link
            key={item.id}
            href={`/saju/${item.type}/${item.id}`}
            className="w-full flex items-center gap-3 rounded-xl border border-white/[0.07] px-4 py-3 text-left transition-all hover:border-white/[0.14] hover:bg-white/[0.02]"
            style={{ background: 'rgba(255,255,255,0.012)' }}
          >
            {/* 일간 */}
            <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-white/8 bg-white/[0.03]">
              <span className="text-lg font-bold leading-none"
                style={{ color: item.day_element ? (ELEMENT_COLOR as Record<string, string>)[item.day_element] : '#fff' }}>
                {item.day_stem ?? '?'}
              </span>
            </div>

            {/* 본문 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${TYPE_COLOR[item.type] ?? 'text-white/50'}`}>
                  {TYPE_LABEL[item.type] ?? item.type}
                </span>
                {item.birth_name && (
                  <span className="text-sm text-white/80 font-medium truncate">{item.birth_name}</span>
                )}
                {!item.birth_name && (
                  <span className="text-sm text-white/50">
                    {item.birth_year}.{String(item.birth_month).padStart(2,'0')}.{String(item.birth_day).padStart(2,'0')}
                  </span>
                )}
              </div>
              {item.concern && (
                <p className="text-xs text-white/30 truncate mt-0.5">{item.concern}</p>
              )}
            </div>

            {/* 시간 */}
            <span className="shrink-0 text-[11px] text-white/25">{relativeTime(item.last_viewed_at)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
