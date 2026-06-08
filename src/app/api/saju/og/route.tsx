/**
 * GET /api/saju/og
 * 사주 공유 카드 이미지 생성 (1080×1080)
 *
 * Query params:
 *   stem, hanja, element, image, name, keywords (comma-sep), core
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

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700',
      {
        headers: { 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)' },
      },
    ).then(r => r.text());

    const fontUrl = css.match(/url\(([^)]+)\)/)?.[1];
    if (!fontUrl) return null;
    return fetch(fontUrl).then(r => r.arrayBuffer());
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

  const color  = ELEM_COLOR[element]  ?? '#ffffff';
  const elLabel = ELEM_LABEL[element] ?? element;

  const fontData = await loadFont();

  const fontConfig = fontData
    ? [{ name: 'NotoKR', data: fontData, weight: 700 as const, style: 'normal' as const }]
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(160deg, #0c0c0f 0%, #111114 60%, #0a0a0d 100%)',
          fontFamily: fontData ? 'NotoKR, sans-serif' : 'sans-serif',
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
            minnat.kr
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
