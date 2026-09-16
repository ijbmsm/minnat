/**
 * GET /api/saju/og
 * 사주 공유 카드 이미지 생성 (1080×1080)
 *
 * Query params:
 *   stem, hanja, element, image, name, keywords (comma-sep), core
 *   variant=invite → 1200×630 가로 초대 카드 (hook, partner 파라미터). 생년월일은 절대 받지 않는다.
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

// Edge runtime for @vercel/og
export const runtime = 'edge';

const ELEM_COLOR: Record<string, string> = {
  목: '#4ade80', 화: '#f87171', 토: '#fbbf24', 금: '#d1d5db', 수: '#60a5fa',
};

const ELEM_LABEL: Record<string, string> = {
  목: '木 · 나무', 화: '火 · 불', 토: '土 · 흙', 금: '金 · 쇠', 수: '水 · 물',
};

async function loadFont(req: NextRequest): Promise<ArrayBuffer | null> {
  try {
    const url = new URL('/fonts/ShillaCulture-Bold.otf', req.url);
    return await fetch(url).then(r => r.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const s = new URL(req.url).searchParams;
  const stem     = s.get('stem')     ?? '갑';
  const branch   = s.get('branch')   ?? '';
  const hanja    = s.get('hanja')    ?? '甲';
  const element  = s.get('element')  ?? '목';
  const image    = s.get('image')    ?? '';
  const name     = s.get('name')     ?? '';
  const keywords = (s.get('keywords') ?? '').split(',').filter(Boolean).slice(0, 3);
  const core     = s.get('core')     ?? '';
  const variant  = s.get('variant')  ?? 'card';
  const hook     = s.get('hook')     ?? '';
  const partner  = s.get('partner')  ?? '';

  const color  = ELEM_COLOR[element]  ?? '#ffffff';
  const elLabel = ELEM_LABEL[element] ?? element;

  const fontData = await loadFont(req);

  const fontConfig = fontData
    ? [{ name: 'ShillaKR', data: fontData, weight: 700 as const, style: 'normal' as const }]
    : [];

  if (variant === 'invite') {
    return new ImageResponse(
      (
        <div style={{
          display: 'flex', width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #0c0907 0%, #14100c 60%, #0c0907 100%)',
          fontFamily: fontData ? 'ShillaKR, sans-serif' : 'sans-serif',
          padding: '56px 64px', position: 'relative',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <span style={{ color: 'rgba(232,223,200,0.4)', fontSize: '24px', letterSpacing: '0.15em' }}>술자리 · 궁합 초대</span>
              <span style={{ color, fontSize: '22px', border: `1px solid ${color}55`, borderRadius: '100px', padding: '6px 16px' }}>{elLabel}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '760px' }}>
              <span style={{ fontSize: '30px', color: 'rgba(232,223,200,0.55)' }}>
                {name ? `${name}이(가) 너와의 궁합이 궁금하대` : '누군가 너와의 궁합이 궁금하대'}
              </span>
              <span style={{ fontSize: '40px', color: 'rgba(232,223,200,0.94)', lineHeight: 1.45 }}>
                {hook.length > 70 ? hook.slice(0, 70) + '…' : hook}
              </span>
              {partner && (
                <span style={{ fontSize: '24px', color: 'rgba(232,223,200,0.45)' }}>끌리는 기운 · {partner}</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '28px', borderTop: '1px solid rgba(232,223,200,0.1)' }}>
              <span style={{ fontSize: '26px', color: '#c2a35b' }}>생년월일만 넣으면 둘의 궁합이 열려 →</span>
              <span style={{ fontSize: '22px', color: 'rgba(232,223,200,0.25)' }}>drinkplace.kr</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginLeft: '40px' }}>
            <span style={{ fontSize: '200px', fontWeight: 700, color, lineHeight: 1 }}>{stem}</span>
            <span style={{ fontSize: '130px', fontWeight: 300, color: 'rgba(232,223,200,0.45)', lineHeight: 1, marginBottom: '8px' }}>{branch}</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts: fontConfig },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(160deg, #0c0c0f 0%, #111114 60%, #0a0a0d 100%)',
          fontFamily: fontData ? 'ShillaKR, sans-serif' : 'sans-serif',
          padding: '72px',
          position: 'relative',
        }}
      >
        {/* 상단 브랜딩 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '56px' }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '26px', letterSpacing: '0.15em' }}>
            술자리 · 사주
          </span>
          <span style={{
            color: color,
            fontSize: '24px',
            letterSpacing: '0.1em',
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${color}40`,
            borderRadius: '100px',
            padding: '8px 20px',
          }}>
            {elLabel}
          </span>
        </div>

        {/* 중앙: 일주 대문자 */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '48px' }}>
          {/* 일주 (일간 + 일지) */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '16px',
            position: 'relative',
          }}>
            {/* glow */}
            <div style={{
              position: 'absolute',
              width: '340px',
              height: '340px',
              borderRadius: '50%',
              background: `radial-gradient(ellipse at center, ${color}16 0%, transparent 70%)`,
              top: '-50px',
              left: '-30px',
            }} />
            <span style={{ fontSize: '280px', fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {stem}
            </span>
            {branch && (
              <span style={{ fontSize: '180px', fontWeight: 300, color: 'rgba(255,255,255,0.45)', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                {branch}
              </span>
            )}
          </div>

          {/* 우측 정보 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
            {/* 한자 + 이미지 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '64px', color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>
                {hanja}
              </span>
              {image && (
                <span style={{ fontSize: '28px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
                  {image}
                </span>
              )}
            </div>

            {/* 키워드 배지 */}
            {keywords.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {keywords.map((k, i) => (
                  <span key={i} style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '100px',
                    padding: '10px 22px',
                    fontSize: '26px',
                    color: 'rgba(255,255,255,0.7)',
                  }}>
                    {k}
                  </span>
                ))}
              </div>
            )}

            {/* 핵심 한 줄 — 개인화 (일주+신강약+격국 종합) */}
            {core && (
              <span style={{
                fontSize: '26px',
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.7,
                maxWidth: '460px',
              }}>
                {core.length > 60 ? core.slice(0, 60) + '...' : core}
              </span>
            )}
          </div>
        </div>

        {/* 하단 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '40px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}>
          {name ? (
            <span style={{ fontSize: '32px', color: 'rgba(255,255,255,0.5)' }}>
              {name}님의 사주
            </span>
          ) : (
            <span style={{ fontSize: '28px', color: 'rgba(255,255,255,0.25)' }}>
              사주팔자
            </span>
          )}
          <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
            drinkplace.kr
          </span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: fontConfig,
    },
  );
}
