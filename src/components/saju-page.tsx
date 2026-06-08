"use client";

import { useState, useEffect, useCallback, createContext, useContext, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { buildSeolgiIndex, type SeolgiIndex, type SeolgiRow } from "@/lib/saju/seolgi-loader";
import { computeFourPillars, fromKST, type FourPillars, type Pillar } from "@/lib/saju/engine";
import { STEM_DATA, BRANCH_DATA, ELEMENT_COLOR, SIPSHIN_DESC, getCompat } from "@/lib/saju";
import { getSipshin, getBranchSipshin } from "@/lib/saju/sipshin";
import { DAY_MASTER_PROFILE, ELEMENT_COMMENT } from "@/lib/saju/interpret";
import type { Element, Stem, Branch } from "@/lib/saju/constants";
import type { ReadingSection, ReadingResponse } from "@/app/api/saju/reading/route";
import { lunarToSolar } from "@/lib/saju/lunar";
import { analyzeAdvanced, findRoots, JIJANGGAN, type AdvancedAnalysis } from "@/lib/saju/advanced";

// ── 디자인 토큰 ──
const INK = {
  bg:       '#0c0907',
  bgRaise:  '#14100c',
  card:     'rgba(232,223,200,0.035)',
  cardLine: 'rgba(232,223,200,0.10)',
  hair:     'rgba(232,223,200,0.085)',
  ink:      'rgba(232,223,200,0.94)',
  ink70:    'rgba(232,223,200,0.66)',
  ink45:    'rgba(232,223,200,0.42)',
  ink28:    'rgba(232,223,200,0.26)',
  gold:     '#c2a35b',
};

const OH: Record<string, { color: string; soft: string }> = {
  목: { color: '#7e9a6f', soft: 'rgba(126,154,111,0.16)' },
  화: { color: '#c4685a', soft: 'rgba(196,104,90,0.16)'  },
  토: { color: '#c0974f', soft: 'rgba(192,151,79,0.16)'  },
  금: { color: '#c9c2ad', soft: 'rgba(201,194,173,0.14)' },
  수: { color: '#6f88a6', soft: 'rgba(111,136,166,0.16)' },
};

// CSS 변수로 폰트 참조 (layout.tsx에서 next/font/google로 로드)
const SERIF = 'var(--font-noto-serif-kr), "Apple SD Gothic Neo", serif';
const MONO  = 'var(--font-ibm-plex-mono), "Courier New", monospace';

// ── 천간/지지 데이터 ──
const CHEONGAN_DATA: Record<string, { han: string; oh: string; yy: string; img: string }> = {
  갑: { han: '甲', oh: '목', yy: '양', img: '큰 나무·기둥' },
  을: { han: '乙', oh: '목', yy: '음', img: '풀·덩굴' },
  병: { han: '丙', oh: '화', yy: '양', img: '태양' },
  정: { han: '丁', oh: '화', yy: '음', img: '등불·촛불' },
  무: { han: '戊', oh: '토', yy: '양', img: '큰 산·제방' },
  기: { han: '己', oh: '토', yy: '음', img: '논밭·평지' },
  경: { han: '庚', oh: '금', yy: '양', img: '원석·도끼' },
  신: { han: '辛', oh: '금', yy: '음', img: '보석·칼' },
  임: { han: '壬', oh: '수', yy: '양', img: '큰 강·바다' },
  계: { han: '癸', oh: '수', yy: '음', img: '이슬·빗물' },
};

const JIJI_DATA: Record<string, { han: string; oh: string; animal: string }> = {
  자: { han: '子', oh: '수', animal: '쥐' }, 축: { han: '丑', oh: '토', animal: '소' },
  인: { han: '寅', oh: '목', animal: '호랑이' }, 묘: { han: '卯', oh: '목', animal: '토끼' },
  진: { han: '辰', oh: '토', animal: '용' }, 사: { han: '巳', oh: '화', animal: '뱀' },
  오: { han: '午', oh: '화', animal: '말' }, 미: { han: '未', oh: '토', animal: '양' },
  신: { han: '申', oh: '금', animal: '원숭이' }, 유: { han: '酉', oh: '금', animal: '닭' },
  술: { han: '戌', oh: '토', animal: '개' }, 해: { han: '亥', oh: '수', animal: '돼지' },
};

// ── 용어 사전 ──
const GLOSS: Record<string, { sub: string; body: string }> = {
  격국:         { sub: '格局', body: '사주 전체의 짜임새이자 그릇. 어떤 유형의 사람인지를 보는 큰 틀.' },
  용신:         { sub: '用神', body: '사주의 균형을 잡아주는 약(藥) 같은 오행. 이 기운이 살아야 흐름이 풀림.' },
  '용신 / 기신': { sub: '用神 / 忌神', body: '용신은 나를 돕는 오행, 기신은 그 반대로 흐름을 막는 오행.' },
  기신:         { sub: '忌神', body: '용신을 해치는 오행. 이 기운이 강해지는 시기는 흐름이 막힘.' },
  신강약:       { sub: '身强弱', body: '일간(나)의 힘이 센지 약한지. 신강은 주체가 강한 상태, 신약은 외부 기운에 쏠린 상태.' },
  지장간:       { sub: '支藏干', body: '지지 속에 숨어있는 천간. 겉으론 보이지 않지만 속에서 작용하며 여기·중기·정기 순서로 흐름.' },
  통근:         { sub: '通根', body: '천간이 지지에 뿌리를 내린 상태. 뿌리가 있을수록 그 기운이 안정되고 강해짐.' },
  운성:         { sub: '十二運星', body: '천간이 지지를 만나 갖는 기운의 세기. 사람의 일생처럼 장생→목욕→관대→건록→제왕→쇠→병→사→묘→절→태→양 열두 단계로 순환.' },
  사령신:       { sub: '司令神', body: '태어난 달 그 시점에 실제로 힘을 잡고 있는 기운. 월지 지장간 중 당령한 천간.' },
  오행:         { sub: '五行', body: '목·화·토·금·수 다섯 기운. 이 다섯의 많고 적음이 사주의 색깔과 균형을 결정.' },
  세운:         { sub: '歲運', body: '한 해 한 해의 운. 매년 들어오는 천간·지지가 사주 원국과 어떻게 만나는지를 봄.' },
  대운:         { sub: '大運', body: '10년 단위로 바뀌는 큰 흐름. 인생의 계절과 같음.' },
  천간:         { sub: '天干', body: '사주 네 기둥 위쪽 글자 네 자. 하늘의 기운이며 성격·의지·표현을 드러냄.' },
  지지:         { sub: '地支', body: '사주 네 기둥 아래쪽 글자 네 자. 땅의 기운이며 환경·운·실제 삶을 담음.' },
};

// 클릭 시 추가 블록 (격국·용신기신·신강약)
const GLOSS_EXTRA: Record<string, Array<{ label: string; text: string }>> = {
  격국: [
    { label: '어떻게 정해지나', text: '월지(월주 지지)가 일간에 어떤 십신으로 작용하는지를 기준으로 결정됨.' },
    { label: '격국 종류 예시', text: '식신격 · 상관격 · 편재격 · 정재격 · 편관격 · 정관격 · 편인격 · 정인격 (8 기본격). 여기에 건록격 · 양인격이 추가됨.' },
  ],
  '용신 / 기신': [
    { label: '어떻게 찾나', text: '신강이면 일간을 약하게 할 오행(관·식상·재), 신약이면 일간을 보강할 오행(인성·비겁)이 용신이 됨.' },
    { label: '오행별 용신 예시', text: '목 용신 → 성장·배움·확장 / 화 용신 → 표현·소통·활동 / 토 용신 → 현실 착지·안정·중재 / 금 용신 → 결단·정리·원칙 / 수 용신 → 사색·유연·지식' },
  ],
  신강약: [
    { label: '신강 (身强)', text: '일간을 돕는 기운(비겁·인성)이 많은 상태. 주체성이 강하고 추진력이 있으나 독단 경향도 있음.' },
    { label: '신약 (身弱)', text: '일간을 도와주는 기운이 부족한 상태. 환경과 타인 영향을 크게 받음. 인성·비겁이 용신이 되기 쉬움.' },
    { label: '중화 (中和)', text: '일간의 힘이 균형 잡힌 상태. 가장 유연하게 운을 활용할 수 있는 구조.' },
  ],
};

const SIPSIN_GLOSS: Record<string, string> = {
  비견: '나와 같은 오행·음양. 자존심·독립심·경쟁심. 형제·동료에 해당하는 기운.',
  겁재: '나와 같은 오행이지만 음양이 다름. 추진력·승부욕이 강하나 재물이 새기 쉬운 기운.',
  식신: '내가 자연스럽게 내놓는 기운. 표현력·먹을복·꾸준함. 한 우물을 파는 재능.',
  상관: '강한 표현력과 비판 정신. 재주가 많고 틀을 깨는 힘이 있으나 충돌도 잦음.',
  편재: '넓게 흐르는 재물 기운. 융통성·사업 수완. 큰 돈을 굴리는 기질.',
  정재: '착실히 모으는 재물 기운. 성실·안정. 내 몫을 지키는 성향.',
  편관: '나를 강하게 누르는 압력. 결단력·카리스마가 있으나 스트레스와 함께 옴.',
  정관: '책임·명예·규범. 스스로를 다스리는 기운. 직장·관직과 인연이 깊음.',
  편인: '독특한 사고와 직관. 학문·기획·창작에서 남다른 관점을 만드는 기운.',
  정인: '배움과 보호받는 기운. 인내·인덕. 꾸준히 받쳐주는 뿌리.',
  일간: '사주의 주인공, 나 자신. 모든 해석의 기준점이 되는 글자.',
};

const ROLE_GLOSS: Record<string, string> = {
  년주: '뿌리·조상·어린 시절. 내가 자란 배경의 자리.',
  월주: '환경·사회·부모. 직업과 사회생활이 드러나는 자리.',
  일주: '나 자신과 배우자. 사주의 중심 자리.',
  시주: '활동·미래·자식. 말년과 결실의 자리.',
};

// ── DetailPayload 타입 ──
interface DetailPayload {
  head: string;
  han: string | null;
  oh: string | null;
  chips: string[];
  blocks: Array<{ label: string; text: string }>;
}

// ── Context ──
const SajuUICtx = createContext<{ m: boolean; openDetail: (p: DetailPayload) => void }>({
  m: false, openDetail: () => {},
});

// ── 반응형 훅 ──
function useIsMobile(bp = 768) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp - 1}px)`);
    const h = () => setM(mq.matches); h();
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [bp]);
  return m;
}

// ── KoLabel ──
function KoLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 3, color: INK.ink45, ...style }}>
      {children}
    </span>
  );
}

// ── Panel ──
function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 8, background: INK.card, ...style }}>
      {children}
    </div>
  );
}

// ── Hair 구분선 ──
function Hair({ style }: { style?: React.CSSProperties }) {
  return <div style={{ height: 1, background: INK.hair, ...style }} />;
}

// ── TapChar ──
function TapChar({ char, el, size, onTap }: { char: string; el: string; size: number; onTap: () => void }) {
  const ohColor = OH[el]?.color ?? INK.ink;
  const ohSoft  = OH[el]?.soft  ?? 'transparent';
  return (
    <span
      onClick={(e) => { e.stopPropagation(); onTap(); }}
      onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.textShadow = `0 0 22px ${ohSoft}`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.textShadow = 'none'; }}
      style={{ display: 'inline-block', cursor: 'pointer', fontSize: size, fontWeight: 500,
        fontFamily: SERIF, lineHeight: 1.15, color: ohColor, transition: 'text-shadow .15s', borderRadius: 4 }}
    >
      {char}
    </span>
  );
}

// ── Term ──
function Term({ termKey, children, onOpen }: {
  termKey: string;
  children: React.ReactNode;
  onOpen: (p: DetailPayload) => void;
}) {
  function buildTermPayload(key: string): DetailPayload {
    const g = GLOSS[key];
    const extra = GLOSS_EXTRA[key] ?? [];
    if (g) {
      return { head: key, han: g.sub || null, oh: null, chips: g.sub ? [g.sub] : [], blocks: [{ label: '개념', text: g.body }, ...extra] };
    }
    const ss = SIPSIN_GLOSS[key];
    if (ss) {
      return { head: key, han: null, oh: null, chips: [], blocks: [{ label: key, text: ss }] };
    }
    return { head: key, han: null, oh: null, chips: [], blocks: [{ label: key, text: '' }] };
  }
  return (
    <span
      onClick={e => { e.stopPropagation(); onOpen(buildTermPayload(termKey)); }}
      style={{ cursor: 'pointer', borderBottom: `1px dotted ${INK.ink28}` }}
    >
      {children}
    </span>
  );
}

// ── DetailSheet ──
function DetailSheet({ data, onClose }: { data: DetailPayload | null; onClose: () => void }) {
  const { m } = useContext(SajuUICtx);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (data) requestAnimationFrame(() => setShow(true));
    else setShow(false);
  }, [data]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  if (!data) return null;

  const accent = data.oh ? (OH[data.oh]?.color ?? INK.gold) : INK.gold;
  const glow   = data.oh ? (OH[data.oh]?.soft  ?? 'none')   : 'none';

  const panelBase: React.CSSProperties = {
    position: 'fixed', background: '#100c09', zIndex: 200,
    border: `1px solid ${INK.cardLine}`,
    boxShadow: '0 -10px 60px rgba(0,0,0,.6), 0 10px 60px rgba(0,0,0,.6)',
    fontFamily: SERIF, color: INK.ink, boxSizing: 'border-box',
    transition: 'transform .26s cubic-bezier(.2,.7,.3,1)',
    overflowY: 'auto',
  };

  const panelStyle: React.CSSProperties = m
    ? { ...panelBase, left: 0, right: 0, bottom: 0, borderRadius: '16px 16px 0 0',
        padding: '14px 22px 30px', maxHeight: '86vh',
        transform: show ? 'translateY(0)' : 'translateY(101%)' }
    : { ...panelBase, top: 0, bottom: 0, right: 0, width: 440,
        padding: '34px 36px',
        transform: show ? 'translateX(0)' : 'translateX(101%)' };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 199,
        background: 'rgba(8,6,4,.62)', backdropFilter: 'blur(3px)',
        opacity: show ? 1 : 0, transition: 'opacity .26s' }}
    >
      <div onClick={e => e.stopPropagation()} style={panelStyle}>
        {m && <div style={{ width: 40, height: 4, borderRadius: 2, background: INK.ink28, margin: '0 auto 18px' }} />}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: m ? 0 : -10 }}>
          <button onClick={onClose}
            style={{ border: 'none', background: 'transparent', color: INK.ink45,
              fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 4 }}>×</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ fontSize: 72, lineHeight: 0.9, fontWeight: 500, color: accent,
            textShadow: data.oh ? `0 0 44px ${glow}` : 'none', fontFamily: SERIF }}>{data.head}</span>
          {data.han && <span style={{ fontSize: 30, fontWeight: 300, fontFamily: SERIF, color: INK.ink70 }}>{data.han}</span>}
        </div>
        {data.chips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 16 }}>
            {data.chips.map((ch, i) => (
              <span key={i} style={{ fontSize: 12.5, color: INK.ink70,
                border: `1px solid ${INK.cardLine}`, borderRadius: 20, padding: '5px 13px' }}>{ch}</span>
            ))}
          </div>
        )}
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {data.blocks.filter(b => b.text).map((b, i) => (
            <div key={i}>
              <KoLabel style={{ fontSize: 10.5, color: accent }}>{b.label}</KoLabel>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: INK.ink, margin: '8px 0 0' }}>{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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

// ── seolgi.json 로더 ──
let seolgiCache: SeolgiIndex | null = null;
async function loadSeolgi(): Promise<SeolgiIndex> {
  if (seolgiCache) return seolgiCache;
  const res = await fetch("/seolgi.json");
  const rows: SeolgiRow[] = await res.json();
  seolgiCache = buildSeolgiIndex(rows);
  return seolgiCache;
}

// ── 타입 ──
interface BirthParams {
  year: number; month: number; day: number;
  hour: number | null; minute: number;
  sex: 'male' | 'female';
  longitudeE: number;
  dayBoundaryRule: 'midnight' | 'zi_hour';
  applyHapHwa: boolean;
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
  advanced: AdvancedAnalysis;
}

// ── buildUIResult ──
function buildUIResult(fp: FourPillars, birth: BirthParams): SajuUIResult {
  const dm = fp.day.stem;
  const dmData = STEM_DATA[dm];

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
    yearStem:    getSipshin(dm, fp.year.stem),
    yearBranch:  getBranchSipshin(dm, fp.year.branch),
    monthStem:   getSipshin(dm, fp.month.stem),
    monthBranch: getBranchSipshin(dm, fp.month.branch),
    dayStem:     '본인',
    dayBranch:   getBranchSipshin(dm, fp.day.branch),
    hourStem:    fp.hour ? getSipshin(dm, fp.hour.stem)      : null,
    hourBranch:  fp.hour ? getBranchSipshin(dm, fp.hour.branch) : null,
  };

  // daysFromJie: trace의 canonical birthUTC 사용 (KST 재조립 금지 — 9시간 오차 방지)
  const daysFromJie = Math.max(
    0,
    Math.floor(
      (new Date(fp.trace.birthUTC).getTime() - new Date(fp.trace.jieUTC).getTime()) / 86_400_000
    ),
  );
  const advanced = analyzeAdvanced(fp, daysFromJie, undefined, birth.applyHapHwa);

  return {
    pillars: fp,
    dayMaster: { stem: dm, hanja: dmData.hanja, element: dmData.element, image: dmData.image, profile: DAY_MASTER_PROFILE[dm] },
    elements,
    sipshinMap,
    birth,
    advanced,
  };
}

// ── 12운성 ──
const UNSUNG_NAMES = ['장생','목욕','관대','건록','제왕','쇠','병','사','묘','절','태','양'] as const;
type Unsung = typeof UNSUNG_NAMES[number];
const BRANCHES_12 = ['자','축','인','묘','진','사','오','미','신','유','술','해'] as const;
const UNSUNG_YANG_START: Record<Element, number> = { 목:11, 화:2, 토:2, 금:5, 수:8 };
const UNSUNG_YIN_START:  Record<Element, number> = { 목:6,  화:9, 토:9, 금:0, 수:3 };

function getUnsung(stem: Stem, branch: Branch): Unsung {
  const { yang, element } = STEM_DATA[stem];
  const brIdx = BRANCHES_12.indexOf(branch as typeof BRANCHES_12[number]);
  const start = yang ? UNSUNG_YANG_START[element] : UNSUNG_YIN_START[element];
  const offset = yang ? (brIdx - start + 12) % 12 : (start - brIdx + 12) % 12;
  return UNSUNG_NAMES[offset];
}

// ── 공망 ──
function getGongmang(dayGz: number): Branch[] {
  const g = Math.floor(dayGz / 10);
  const pairs: Branch[][] = [['술','해'],['신','유'],['오','미'],['진','사'],['인','묘'],['자','축']];
  return pairs[g % 6];
}

// ── 신살 ──
interface Sinsal { name: string; desc: string; branches: Branch[] }

function calcSinsal(fp: FourPillars): Sinsal[] {
  const result: Sinsal[] = [];
  const all = [fp.year.branch, fp.month.branch, fp.day.branch, ...(fp.hour ? [fp.hour.branch] : [])] as Branch[];
  const yb  = fp.year.branch;
  const dm  = fp.day.stem;

  const yeokmaMap: Partial<Record<Branch, Branch>> = {
    인:'신', 오:'신', 술:'신', 신:'인', 자:'인', 진:'인',
    사:'해', 유:'해', 축:'해', 해:'사', 묘:'사', 미:'사',
  };
  const ym = yeokmaMap[yb];
  if (ym) { const f = all.filter(b=>b===ym); if(f.length) result.push({ name:'역마살', desc:'이동·변화·활동성', branches:f }); }

  const dohwaMap: Partial<Record<Branch, Branch>> = {
    인:'묘', 오:'묘', 술:'묘', 사:'오', 유:'오', 축:'오',
    신:'유', 자:'유', 진:'유', 해:'자', 묘:'자', 미:'자',
  };
  const dh = dohwaMap[yb];
  if (dh) { const f = all.filter(b=>b===dh); if(f.length) result.push({ name:'도화살', desc:'매력·인기·예술성', branches:f }); }

  const guiMap: Partial<Record<Stem, Branch[]>> = {
    갑:['축','미'], 무:['축','미'], 경:['축','미'],
    을:['자','신'], 기:['자','신'],
    병:['해','유'], 정:['해','유'],
    신:['인','오'],
    임:['묘','사'], 계:['묘','사'],
  };
  const gt = (guiMap[dm] ?? []) as Branch[];
  const gf = all.filter(b=>gt.includes(b));
  if (gf.length) result.push({ name:'천을귀인', desc:'귀인 도움·위기 극복', branches:gf });

  const yanginMap: Partial<Record<Stem, Branch>> = { 갑:'묘', 병:'오', 무:'오', 경:'유', 임:'자' };
  const yi = yanginMap[dm];
  if (yi) { const f = all.filter(b=>b===yi); if(f.length) result.push({ name:'양인살', desc:'강한 의지·공격성·고집', branches:f }); }

  const hwagaeMap: Partial<Record<Branch, Branch>> = {
    인:'술', 오:'술', 술:'술', 사:'축', 유:'축', 축:'축',
    신:'진', 자:'진', 진:'진', 해:'미', 묘:'미', 미:'미',
  };
  const hw = hwagaeMap[yb];
  if (hw) { const f = all.filter(b=>b===hw); if(f.length) result.push({ name:'화개살', desc:'예술·종교·고독·집중력', branches:f }); }

  return result;
}

// ── 세운 계산 ──
const STEMS_ARR  = ['갑','을','병','정','무','기','경','신','임','계'] as const;
const BRANCHES_ARR = ['자','축','인','묘','진','사','오','미','신','유','술','해'] as const;
const mod = (n: number, m: number) => ((n % m) + m) % m;

function calcSeyunPillar(year: number) {
  const gz = mod(year - 4, 60);
  const stem   = STEMS_ARR[gz % 10];
  const branch = BRANCHES_ARR[gz % 12];
  return { stem, branch, gz };
}

// ── POS_LABEL ──
const POS_LABEL = { jeongi: '정기', junggi: '중기', yeogi: '여기' } as const;

// ── 타입 탭 ──
type ReadingType = 'full' | 'today' | 'love' | 'career';

// ── AI 해석 컴포넌트 ──
function ReadingTab({ birth, initialType = 'full', cachedSections, onReadingId }: {
  birth: BirthParams;
  initialType?: ReadingType;
  cachedSections?: ReadingSection[] | null;
  onReadingId?: (id: string) => void;
}) {
  const [reading, setReading] = useState<ReadingResponse | null>(
    cachedSections ? { cacheKey: '', cached: true, sections: cachedSections, tier: 'free', cautions: [] } : null
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const res = await fetch('/api/saju/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: birth.year, month: birth.month, day: birth.day,
          hour: birth.hour, minute: birth.minute, sex: birth.sex, longitudeE: birth.longitudeE,
          dayBoundaryRule: birth.dayBoundaryRule, applyHapHwa: birth.applyHapHwa,
          name: birth.name, concern: birth.concern, tier: 'free', type: initialType,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as ReadingResponse;
      setReading(data);
      if (data.readingId) onReadingId?.(data.readingId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cachedSections) load();
  }, []); // eslint-disable-line

  return (
    <div>
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ width: 20, height: 20, borderRadius: '50%',
              border: `2px solid ${INK.ink28}`, borderTopColor: INK.ink70 }} />
          <span style={{ fontSize: 12, color: INK.ink45, fontFamily: MONO }}>해석 중...</span>
        </div>
      )}
      {err && !loading && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ fontSize: 13, color: '#c4685a', marginBottom: 12 }}>{err}</p>
          <button onClick={load}
            style={{ border: `1px solid ${INK.cardLine}`, background: 'transparent', color: INK.ink45,
              borderRadius: 4, padding: '8px 20px', cursor: 'pointer', fontFamily: MONO, fontSize: 12 }}>
            다시 시도
          </button>
        </div>
      )}
      {reading && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reading.cautions.length > 0 && (
            <p style={{ fontSize: 11, color: 'rgba(251,191,36,0.7)', border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: 6, padding: '8px 12px', margin: 0 }}>
              ⚠ {reading.cautions.join(' · ')}
            </p>
          )}
          {reading.sections.map((s: ReadingSection, i: number) => (
            <div key={i} style={{ padding: 20, borderRadius: 8,
              background: 'rgba(250,248,243,0.93)', border: '1px solid rgba(180,165,130,0.18)' }}>
              <p style={{ fontSize: 10, color: 'rgba(120,100,60,0.7)', letterSpacing: 3, fontFamily: MONO,
                textTransform: 'uppercase', marginBottom: 8 }}>{s.title}</p>
              <p style={{ fontSize: 14, color: '#2a2218', lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ── 공유 카드 모달 ──
interface ShareParams {
  stem: string; branch: string; hanja: string; element: string;
  image: string; name: string; keywords: string; core: string;
}

function ShareModal({ params, shareLink, onClose }: { params: ShareParams; shareLink?: string; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState<'link'|'card'|null>(null);

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

  async function copyLink() {
    if (!shareLink) return;
    try {
      const url = `${window.location.origin}${shareLink}`;
      if (navigator.share) {
        await navigator.share({ title: '내 사주 결과', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied('link');
        setTimeout(() => setCopied(null), 2000);
      }
    } catch { /* cancelled */ }
  }

  async function copyCard() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied('card');
      setTimeout(() => setCopied(null), 2000);
    } catch { /* cancelled */ }
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
          <p className="text-sm font-medium text-white">공유하기</p>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none">×</button>
        </div>

        {/* 링크 공유 — 로그인 없이 볼 수 있는 공개 URL */}
        {shareLink && (
          <button onClick={copyLink}
            className="w-full flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 mb-2 text-left hover:bg-white/[0.09] transition-colors">
            <span className="text-lg">🔗</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium">{copied === 'link' ? '링크 복사됨!' : '링크로 공유'}</p>
              <p className="text-xs text-white/35 truncate">{window.location.origin}{shareLink}</p>
            </div>
          </button>
        )}

        {/* 이미지 카드 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ogUrl} alt="사주 카드"
          className="w-full rounded-xl mb-2 border border-white/8"
          style={{ aspectRatio: '1 / 1', objectFit: 'cover' }} />
        <div className="flex gap-2">
          <button onClick={download} disabled={downloading}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50">
            {downloading ? '저장 중...' : '이미지 저장'}
          </button>
          <button onClick={copyCard}
            className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm text-white hover:bg-white/15 transition-colors">
            {copied === 'card' ? '복사됨!' : 'URL 복사'}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-white/25 text-center">링크를 받은 사람은 로그인 없이 볼 수 있어</p>
      </motion.div>
    </motion.div>
  );
}

// ─── RESULT VIEW ────────────────────────────────────────────────

// ── buildCoreDesc: 일주 기반 개인화 한 줄 합성 ──
// 일간·일지·일지십신 → deterministic (단정)
// 신강약·격국 → 추정 항목이므로 hedge 톤 유지
function buildCoreDesc(
  dm: Stem,
  dayBranch: Branch,
  dayBranchSipshin: string | null,
  bodyStrength: 'strong' | 'weak' | 'neutral',
  geokGuk: { name: string; confidence: 'deterministic' | 'heuristic' },
): string {
  const sip = dayBranchSipshin ?? '';

  // 일지 절 — deterministic, 항상 단정. 격국과 인과 분리된 독립 구절로.
  const SIPSHIN_JI: Partial<Record<string, string>> = {
    비견: `${dayBranch}(비견)을 깔고 앉아 독립·자존의 기운이 강한`,
    겁재: `${dayBranch}(겁재)와 함께 경쟁·추진의 에너지를 품은`,
    식신: `${dayBranch}(식신)을 깔고 앉아 표현·재능으로 빛나는`,
    상관: `${dayBranch}(상관)을 품어 자유·비범한 기질이 드러나는`,
    편재: `${dayBranch}(편재)를 깔고 앉아 활동·재물 감각을 품은`,
    정재: `${dayBranch}(정재)를 깔고 앉아 안정·성실의 기반을 둔`,
    편관: `${dayBranch}(편관)을 품어 긴장·도전의 기운이 강한`,
    정관: `${dayBranch}(정관)을 깔고 앉아 규범·명예 의식이 뚜렷한`,
    편인: `${dayBranch}(편인)을 품어 직관·독창의 기운이 강한`,
    정인: `${dayBranch}(정인)을 깔고 앉아 배움·보호의 기운이 강한`,
  };
  const iljiClause = SIPSHIN_JI[sip] ?? `${dayBranch}(${sip})을 깔고 앉은`;

  // 신강약 절 — 임계값 기반 추정이므로 항상 hedge
  const BODY_CLAUSE: Record<string, string> = {
    strong:  '신강한 편으로 보이는 구조',
    weak:    '신약한 편으로 보이는 구조',
    neutral: '중화에 가까운 구조',
  };
  const bodyClause = BODY_CLAUSE[bodyStrength] ?? bodyStrength;

  // 격국 절 — 일지 절과 인과 분리된 독립 구절. confidence로 hedge.
  const GEOK_CHAR: Partial<Record<string, string>> = {
    건록격: '자기 주도 기반',
    양인격: '강한 의지·도전',
    정인격: '배움과 확신이 드라이브',
    편인격: '직관·독창이 드라이브',
    식신격: '표현·창의가 드라이브',
    상관격: '자유·비범함이 드라이브',
    정재격: '성실·안정이 드라이브',
    편재격: '넓은 활동이 드라이브',
    정관격: '규범·명예가 드라이브',
    편관격: '강한 추진이 드라이브',
  };
  const geokChar = GEOK_CHAR[geokGuk.name] ?? '';
  const geokSuffix = geokChar ? ` — ${geokChar}` : '';
  const geokClause = geokGuk.confidence === 'heuristic'
    ? `${geokGuk.name} 성향${geokSuffix}`
    : `${geokGuk.name}${geokSuffix}`;

  return `${dm}${dayBranch} 일주 — ${iljiClause} 타입. ${bodyClause}, ${geokClause}.`;
}

// ── IlganCard ──
function IlganCard({ result }: { result: SajuUIResult }) {
  const { m } = useContext(SajuUICtx);
  const { dayMaster, pillars: fp, advanced, sipshinMap } = result;
  const dm = dayMaster.stem;
  const cg = CHEONGAN_DATA[dm];
  const ohColor = OH[cg?.oh ?? dayMaster.element]?.color ?? INK.ink;
  const ohSoft  = OH[cg?.oh ?? dayMaster.element]?.soft ?? 'transparent';
  const keywords: string[] = dayMaster.profile.keyword ?? ['집중력', '감성', '섬세'];
  const sub  = dayMaster.profile.vibe ?? '';

  // 일지 데이터
  const dayBranch = fp.day.branch;
  const jj = JIJI_DATA[dayBranch];
  const dayBranchSipshin = sipshinMap.dayBranch;
  const branchEl = BRANCH_DATA[dayBranch].element;
  const branchColor = OH[branchEl]?.color ?? INK.ink45;

  // 신강약·격국
  const { bodyStrength, geokGuk } = advanced;

  // 통근
  const allBranches = [fp.year.branch, fp.month.branch, fp.day.branch, ...(fp.hour ? [fp.hour.branch] : [])] as Branch[];
  const roots = findRoots(dm, allBranches);

  // 개인화 핵심 한 줄 (일지·신강약·격국 종합)
  const coreDesc = buildCoreDesc(dm, dayBranch, dayBranchSipshin, bodyStrength, geokGuk);

  // 뱃지 — 신강약은 항상 (추정), 격국은 heuristic일 때만 (추정)
  const bodyBadge = (bodyStrength === 'strong' ? '신강' : bodyStrength === 'weak' ? '신약' : '중화') + '(추정)';
  const geokBadge = geokGuk.name + (geokGuk.confidence === 'heuristic' ? '(추정)' : '');

  return (
    <Panel style={{ padding: m ? 22 : 26, display: 'flex', flexDirection: 'column' }}>
      <KoLabel style={{ color: INK.ink45 }}>나의 핵심 · 日柱</KoLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
        {/* 일간 (大) */}
        <span style={{ fontSize: m ? 68 : 82, lineHeight: 0.85, fontWeight: 500,
          color: ohColor, textShadow: `0 0 50px ${ohSoft}`, fontFamily: SERIF }}>
          {dm}
        </span>
        {/* 일지 (中) */}
        <span style={{ fontSize: m ? 42 : 52, lineHeight: 0.85, fontWeight: 300,
          color: branchColor, fontFamily: SERIF }}>
          {dayBranch}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 300, fontFamily: SERIF, color: INK.ink70 }}>
            {cg?.han ?? dayMaster.hanja}
          </div>
          <div style={{ fontSize: 12, color: INK.ink45 }}>
            {jj?.oh ?? branchEl} · {jj?.animal ?? ''} · {dayBranchSipshin}
          </div>
          <div style={{ fontSize: 12.5, color: INK.ink70 }}>{cg?.img ?? dayMaster.image}</div>
        </div>
      </div>
      {/* 개인화 핵심 라인 (일주·신강약·격국 종합) */}
      <p style={{ fontSize: 14, lineHeight: 1.7, margin: '16px 0 6px', color: INK.ink }}>{coreDesc}</p>
      {/* 일간 강점 (secondary) */}
      <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 8px', color: INK.ink70 }}>
        {dayMaster.profile.strength}
      </p>
      {sub && <p style={{ fontSize: 12.5, lineHeight: 1.6, margin: '0 0 12px', color: INK.ink45, fontStyle: 'italic' }}>"{sub}"</p>}
      {roots.length > 0 && (
        <p style={{ fontSize: 12, color: INK.ink28, margin: '0 0 10px', fontFamily: MONO }}>
          통근: {roots.map(r => r.branch).join(' ')}
        </p>
      )}
      <div style={{ display: 'flex', gap: 7, marginTop: 'auto', flexWrap: 'wrap' }}>
        {keywords.map((k: string) => (
          <span key={k} style={{ fontSize: 12.5, color: INK.ink70,
            border: `1px solid ${INK.cardLine}`, borderRadius: 20, padding: '5px 12px', whiteSpace: 'nowrap' }}>{k}</span>
        ))}
        <span style={{ fontSize: 12.5, color: INK.ink45,
          border: `1px solid ${INK.hair}`, borderRadius: 20, padding: '5px 12px', whiteSpace: 'nowrap' }}>
          {bodyBadge}
        </span>
        <span style={{ fontSize: 12.5, color: INK.ink45,
          border: `1px solid ${INK.hair}`, borderRadius: 20, padding: '5px 12px', whiteSpace: 'nowrap' }}>
          {geokBadge}
        </span>
      </div>
    </Panel>
  );
}

// ── WonGukCard ──
function WonGukCard({ result }: { result: SajuUIResult }) {
  const { m, openDetail } = useContext(SajuUICtx);
  const { pillars: fp, sipshinMap } = result;
  const cs = m ? 30 : 42;

  // 시·일·월·년 순 (디자인 명세)
  const pillarsDisplay = [
    { label: '시주', role: '활동·미래', isSelf: false,
      pillar: fp.hour, sipGan: sipshinMap.hourStem, sipJi: sipshinMap.hourBranch },
    { label: '일주', role: '나 자신',   isSelf: true,
      pillar: fp.day,  sipGan: '일간',               sipJi: sipshinMap.dayBranch  },
    { label: '월주', role: '환경·사회', isSelf: false,
      pillar: fp.month, sipGan: sipshinMap.monthStem, sipJi: sipshinMap.monthBranch },
    { label: '년주', role: '뿌리·조상', isSelf: false,
      pillar: fp.year,  sipGan: sipshinMap.yearStem,  sipJi: sipshinMap.yearBranch  },
  ];

  function buildGanPayload(label: string, pillar: Pillar, sipGan: string | null): DetailPayload {
    const cg = CHEONGAN_DATA[pillar.stem] ?? {};
    const oh = STEM_DATA[pillar.stem].element;
    return {
      head: pillar.stem,
      han: cg.han ?? null,
      oh,
      chips: [`${oh} · ${cg.yy === '양' ? '양(陽)' : '음(陰)'}`, cg.img ?? STEM_DATA[pillar.stem].image],
      blocks: [
        { label: `십신 — ${sipGan ?? ''}`, text: SIPSIN_GLOSS[sipGan ?? ''] ?? '' },
        { label: `${label} · 천간`, text: ROLE_GLOSS[label] ?? '' },
      ],
    };
  }

  function buildJiPayload(label: string, pillar: Pillar, sipJi: string | null): DetailPayload {
    const jj = JIJI_DATA[pillar.branch] ?? {};
    const oh = BRANCH_DATA[pillar.branch].element;
    const jijangItems = (JIJANGGAN[pillar.branch as Branch] ?? []);
    return {
      head: pillar.branch,
      han: jj.han ?? null,
      oh,
      chips: [`${oh} · 지지`, `${jj.animal ?? BRANCH_DATA[pillar.branch].animal}띠`],
      blocks: [
        { label: `십신 — ${sipJi ?? ''}`, text: SIPSIN_GLOSS[sipJi ?? ''] ?? '' },
        { label: `${label} · 지지`, text: ROLE_GLOSS[label] ?? '' },
        { label: '지장간', text: '이 지지 속에 숨은 천간: ' + jijangItems.map(j => `${j.stem}(${POS_LABEL[j.pos]})`).join(' · ') },
      ],
    };
  }

  const wonGukInfoPayload: DetailPayload = {
    head: '命式', han: '사주 여덟 글자', oh: null,
    chips: ['년주', '월주', '일주', '시주'],
    blocks: [
      { label: '사주 여덟 글자란', text: '태어난 년·월·일·시를 각각 두 글자(천간·지지)로 나타낸 여덟 자. 이 여덟 글자가 사주의 뼈대.' },
      { label: '일주(日柱) — 나 자신', text: '가장 중심이 되는 기둥. 천간(위)이 나의 본질·일간, 지지(아래)가 내면과 배우자 자리. 모든 해석의 기준.' },
      { label: '월주(月柱) — 환경·사회', text: '자란 환경, 부모, 직업운이 드러나는 자리. 일간에 가장 큰 영향을 주는 기둥. 格(격)도 여기서 정함.' },
      { label: '년주(年柱) — 뿌리·조상', text: '태어난 해의 기운. 집안 배경, 어린 시절, 조상의 덕을 읽는 자리.' },
      { label: '시주(時柱) — 활동·미래', text: '태어난 시의 기운. 내 의지·활동 방향, 자식운, 말년운을 보는 자리.' },
    ],
  };

  return (
    <Panel style={{ padding: m ? 16 : 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <KoLabel style={{ color: INK.ink45 }}>사주 여덟 글자 · 命式</KoLabel>
          <button
            onClick={() => openDetail(wonGukInfoPayload)}
            style={{ width: 18, height: 18, borderRadius: '50%', border: `1px solid ${INK.ink28}`,
              background: 'transparent', color: INK.ink28, fontSize: 10, lineHeight: 1,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: MONO, flexShrink: 0 }}>
            ?
          </button>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: 1, color: INK.ink28 }}>글자를 눌러 뜻을 확인하세요</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: m ? 6 : 10 }}>
        {pillarsDisplay.map(({ label, role, isSelf, pillar, sipGan, sipJi }) => {
          if (!pillar) {
            return (
              <div key={label} style={{ borderRadius: 6, border: `1px solid ${INK.hair}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 120, textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: INK.ink28 }}>시간<br/>미상</span>
              </div>
            );
          }
          const stemEl   = STEM_DATA[pillar.stem].element;
          const branchEl = BRANCH_DATA[pillar.branch].element;
          return (
            <div key={label} style={{ borderRadius: 6, overflow: 'hidden',
              border: `1px solid ${isSelf ? INK.gold + '55' : INK.hair}` }}>
              <div style={{ textAlign: 'center', padding: '9px 0',
                background: isSelf ? 'rgba(194,163,91,0.06)' : 'rgba(232,223,200,0.02)' }}>
                <KoLabel style={{ fontSize: 9.5, letterSpacing: 1.5, color: isSelf ? INK.gold : INK.ink45 }}>{label}</KoLabel>
                {!m && <div style={{ fontSize: 9.5, color: INK.ink28, marginTop: 2 }}>{role}</div>}
              </div>
              <div style={{ textAlign: 'center', padding: m ? '8px 0 9px' : '10px 0 12px',
                background: isSelf ? 'rgba(194,163,91,0.04)' : 'transparent' }}>
                <div style={{ fontSize: 11, color: INK.ink45 }}>{sipGan}</div>
                <TapChar char={pillar.stem} el={stemEl} size={cs}
                  onTap={() => openDetail(buildGanPayload(label, pillar, sipGan))} />
                <div style={{ fontSize: 10, color: INK.ink28 }}>{stemEl}</div>
              </div>
              <Hair />
              <div style={{ textAlign: 'center', padding: m ? '9px 0 8px' : '12px 0 11px',
                background: isSelf ? 'rgba(194,163,91,0.04)' : 'transparent' }}>
                <TapChar char={pillar.branch} el={branchEl} size={cs}
                  onTap={() => openDetail(buildJiPayload(label, pillar, sipJi))} />
                <div style={{ fontSize: 10, color: INK.ink28, marginTop: 2 }}>{branchEl} · {BRANCH_DATA[pillar.branch].animal}</div>
                <div style={{ fontSize: 11, color: INK.ink45, marginTop: 4 }}>{sipJi}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ── ManseTab ──
function ManseTab({ result }: { result: SajuUIResult }) {
  const { m, openDetail } = useContext(SajuUICtx);
  const { pillars: fp, advanced, sipshinMap, dayMaster } = result;
  const { strengths, bodyStrength, hapChung, geokGuk, yongSin } = advanced;
  const dmEl = STEM_DATA[fp.day.stem].element;
  const selfRatio = Math.round((strengths.ratios[dmEl] ?? 0) * 100);
  const bodyLabel = bodyStrength === 'strong' ? '신강' : bodyStrength === 'weak' ? '신약' : '중화';

  // 시·일·월·년 순으로 표시 (년→월→일→시를 뒤집기)
  const pillarsAll = [
    { label: '년주', stem: fp.year.stem,   branch: fp.year.branch,   sipGan: sipshinMap.yearStem,   sipJi: sipshinMap.yearBranch,  isSelf: false },
    { label: '월주', stem: fp.month.stem,  branch: fp.month.branch,  sipGan: sipshinMap.monthStem,  sipJi: sipshinMap.monthBranch, isSelf: false },
    { label: '일주', stem: fp.day.stem,    branch: fp.day.branch,    sipGan: '일간',                 sipJi: sipshinMap.dayBranch,   isSelf: true  },
    ...(fp.hour ? [{ label: '시주', stem: fp.hour.stem, branch: fp.hour.branch, sipGan: sipshinMap.hourStem, sipJi: sipshinMap.hourBranch, isSelf: false }] : []),
  ];
  const allBranches = pillarsAll.map(p => p.branch) as Branch[];
  const gongmang = getGongmang(fp.day.gz);
  const sinsal   = calcSinsal(fp);

  const hapParts: string[] = [];
  hapChung.stemCombines.forEach(sc => hapParts.push(`${sc.a}${sc.b}합→${sc.transformed}${sc.formed ? '' : '(불화)'}`));
  hapChung.branchHaps.forEach(bh => hapParts.push(`${bh.branches.join('')}${bh.type}→${bh.element}`));
  hapChung.branchChungs.forEach(([a, b]) => hapParts.push(`${a}${b}충`));

  const [showExpert, setShowExpert] = useState(false);

  const gutter = m ? 52 : 86;
  const cs = m ? 30 : 46;
  const rowGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: `${gutter}px repeat(4,1fr)` };

  function GutterTerm({ children }: { children: string }) {
    return (
      <div style={{ padding: m ? '10px 8px' : '12px 18px', display: 'flex', alignItems: 'center' }}>
        <Term termKey={children} onOpen={openDetail}>
          <KoLabel style={{ fontSize: m ? 9.5 : 10.5 }}>{children}</KoLabel>
        </Term>
      </div>
    );
  }

  function Cell({ children, isSelf, style }: { children: React.ReactNode; isSelf?: boolean; style?: React.CSSProperties }) {
    return (
      <div style={{ padding: m ? '10px 4px' : '12px 8px', textAlign: 'center',
        borderLeft: `1px solid ${INK.hair}`,
        background: isSelf ? 'rgba(194,163,91,0.04)' : 'transparent', ...style }}>
        {children}
      </div>
    );
  }

  function buildGanPayload2(label: string, stem: Stem, sipGan: string | null): DetailPayload {
    const cg = CHEONGAN_DATA[stem] ?? {};
    const oh = STEM_DATA[stem].element;
    return {
      head: stem, han: cg.han ?? null, oh,
      chips: [`${oh} · ${cg.yy === '양' ? '양(陽)' : '음(陰)'}`, cg.img ?? STEM_DATA[stem].image],
      blocks: [
        { label: `십신 — ${sipGan ?? ''}`, text: SIPSIN_GLOSS[sipGan ?? ''] ?? '' },
        { label: `${label} · 천간`, text: ROLE_GLOSS[label] ?? '' },
      ],
    };
  }

  function buildJiPayload2(label: string, branch: Branch, sipJi: string | null): DetailPayload {
    const jj = JIJI_DATA[branch] ?? {};
    const oh = BRANCH_DATA[branch].element;
    const jijangItems = JIJANGGAN[branch] ?? [];
    return {
      head: branch, han: jj.han ?? null, oh,
      chips: [`${oh} · 지지`, `${jj.animal ?? BRANCH_DATA[branch].animal}띠`],
      blocks: [
        { label: `십신 — ${sipJi ?? ''}`, text: SIPSIN_GLOSS[sipJi ?? ''] ?? '' },
        { label: `${label} · 지지`, text: ROLE_GLOSS[label] ?? '' },
        { label: '지장간', text: '이 지지 속에 숨은 천간: ' + jijangItems.map(j => `${j.stem}(${POS_LABEL[j.pos]})`).join(' · ') },
      ],
    };
  }

  // 오행 분포 %
  const active = [fp.year, fp.month, fp.day, ...(fp.hour ? [fp.hour] : [])];
  const elemCount: Record<Element, number> = { 목:0, 화:0, 토:0, 금:0, 수:0 };
  for (const p of active) {
    elemCount[STEM_DATA[p.stem].element]++;
    elemCount[BRANCH_DATA[p.branch].element]++;
  }
  const totalCount = Object.values(elemCount).reduce((s,v)=>s+v,0);
  const OH_ORDER: Element[] = ['목','화','토','금','수'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 14 : 20 }}>

      {/* ① 오행 분포 */}
      <Panel style={{ padding: m ? 18 : 24 }}>
        <Term termKey="오행" onOpen={openDetail}>
          <KoLabel style={{ color: INK.ink45 }}>오행 분포 · 五行</KoLabel>
        </Term>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', border: `1px solid ${INK.cardLine}` }}>
            {OH_ORDER.map(oh => {
              const pct = totalCount > 0 ? (elemCount[oh] / totalCount) * 100 : 0;
              return <div key={oh} style={{ width: `${pct}%`, background: OH[oh]?.color, opacity: 0.85 }} />;
            })}
          </div>
          <div style={{ display: 'flex', marginTop: 12 }}>
            {OH_ORDER.map(oh => {
              const pct = totalCount > 0 ? Math.round((elemCount[oh] / totalCount) * 100) : 0;
              return (
                <div key={oh} style={{ flex: 1, minWidth: m ? 38 : 46 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: OH[oh]?.color, display: 'inline-block' }} />
                    <span style={{ fontSize: m ? 13 : 14, fontWeight: 600, color: INK.ink }}>{oh}</span>
                    {!m && <span style={{ fontSize: 11, color: INK.ink45, fontFamily: MONO }}>{pct}%</span>}
                  </div>
                  {m && <div style={{ fontSize: 10, color: INK.ink45, fontFamily: MONO, marginLeft: 12 }}>{pct}%</div>}
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* ② 만세력 테이블 — 천간·지지만 표시 */}
      <Panel style={{ overflow: 'hidden' }}>
        {/* 기둥 라벨 행 */}
        <div style={{ ...rowGrid, borderBottom: `1px solid ${INK.hair}` }}>
          <div />
          {pillarsAll.map(p => (
            <div key={p.label} style={{ padding: '11px 0', textAlign: 'center',
              borderLeft: `1px solid ${INK.hair}`,
              background: p.isSelf ? 'rgba(194,163,91,0.05)' : 'transparent' }}>
              <KoLabel style={{ fontSize: 10, letterSpacing: 1.5, color: p.isSelf ? INK.gold : INK.ink45 }}>{p.label}</KoLabel>
              {!m && <div style={{ fontSize: 10, color: INK.ink28, marginTop: 2 }}>
                {p.label === '년주' ? '뿌리·조상' : p.label === '월주' ? '환경·사회' : p.label === '일주' ? '나 자신' : '활동·미래'}
              </div>}
            </div>
          ))}
        </div>

        {/* 천간 행 */}
        <div style={{ ...rowGrid, borderBottom: `1px solid ${INK.hair}` }}>
          <GutterTerm>천간</GutterTerm>
          {pillarsAll.map(p => (
            <Cell key={p.label} isSelf={p.isSelf}>
              <div style={{ fontSize: m ? 10 : 11, color: INK.ink45 }}>{p.sipGan}</div>
              <TapChar char={p.stem} el={STEM_DATA[p.stem as Stem].element} size={cs}
                onTap={() => openDetail(buildGanPayload2(p.label, p.stem as Stem, p.sipGan))} />
              {!m && <div style={{ fontSize: 10, color: INK.ink28 }}>
                {STEM_DATA[p.stem as Stem].element} · {CHEONGAN_DATA[p.stem]?.img ?? STEM_DATA[p.stem as Stem].image}
              </div>}
            </Cell>
          ))}
        </div>

        {/* 지지 행 */}
        <div style={{ ...rowGrid }}>
          <GutterTerm>지지</GutterTerm>
          {pillarsAll.map(p => (
            <Cell key={p.label} isSelf={p.isSelf}>
              <TapChar char={p.branch} el={BRANCH_DATA[p.branch as Branch].element} size={cs}
                onTap={() => openDetail(buildJiPayload2(p.label, p.branch as Branch, p.sipJi))} />
              <div style={{ fontSize: 10, color: INK.ink28, marginTop: 2 }}>
                {BRANCH_DATA[p.branch as Branch].element} · {BRANCH_DATA[p.branch as Branch].animal}
              </div>
              <div style={{ fontSize: m ? 10 : 11, color: INK.ink45, marginTop: 3 }}>{p.sipJi}</div>
            </Cell>
          ))}
        </div>
      </Panel>

      {/* ③ 강점/주의 */}
      <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: m ? 12 : 16 }}>
        <Panel style={{ padding: 22, borderLeft: `2px solid ${OH['목']?.color}` }}>
          <KoLabel style={{ fontSize: 10, color: OH['목']?.color }}>강점</KoLabel>
          <div style={{ fontSize: 15, lineHeight: 1.65, color: INK.ink, marginTop: 8 }}>
            {dayMaster.profile.strength}
          </div>
        </Panel>
        <Panel style={{ padding: 22, borderLeft: `2px solid ${OH['화']?.color}` }}>
          <KoLabel style={{ fontSize: 10, color: OH['화']?.color }}>주의</KoLabel>
          <div style={{ fontSize: 15, lineHeight: 1.65, color: INK.ink, marginTop: 8 }}>
            {dayMaster.profile.weakness}
          </div>
        </Panel>
      </div>

      {/* ④ 근거 더보기 토글 */}
      <button
        onClick={() => setShowExpert(v => !v)}
        style={{ background: 'none', border: `1px solid ${INK.cardLine}`, borderRadius: 6,
          padding: m ? '9px 16px' : '10px 20px', cursor: 'pointer', width: '100%',
          fontFamily: MONO, fontSize: m ? 11 : 12, letterSpacing: 1,
          color: INK.ink45, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {showExpert ? '▲ 전문 정보 접기' : '▼ 격국 · 용신 · 지장간 · 운성 — 전문 정보'}
      </button>

      {/* ⑤ 전문 정보 (접힘) */}
      {showExpert && (
        <>
          {/* 격국·용신·신강약 */}
          <Panel style={{ padding: m ? '18px 0' : '22px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
              {[
                { l: '격국', v: geokGuk.name, s: geokGuk.confidence === 'deterministic' ? '확정' : '추정', c: INK.ink },
                { l: '용신 / 기신',
                  v: yongSin.yongsin
                    ? `${yongSin.yongsin}${yongSin.present ? '' : '(원국 부재)'} / ${yongSin.gisin}`
                    : yongSin.label,
                  s: yongSin.yongsin ? yongSin.label : '억부 부적용',
                  c: yongSin.yongsin ? (OH[yongSin.yongsin]?.color ?? INK.ink) : INK.ink },
                { l: '신강약', v: bodyLabel, s: `일간 세력 ${selfRatio}%`, c: OH['화']?.color ?? INK.ink },
              ].map((item, i) => (
                <div key={item.l} style={{ padding: m ? '2px 12px' : '4px 24px', borderLeft: i ? `1px solid ${INK.hair}` : 'none' }}>
                  <Term termKey={item.l} onOpen={openDetail}>
                    <KoLabel style={{ fontSize: m ? 9 : 10, letterSpacing: 1.5, whiteSpace: 'nowrap' }}>{item.l}</KoLabel>
                  </Term>
                  <div style={{ fontSize: m ? 18 : 22, fontWeight: 600, color: item.c, marginTop: 10, whiteSpace: 'nowrap' }}>{item.v}</div>
                  <div style={{ fontSize: m ? 11 : 12, color: INK.ink45, marginTop: 6 }}>{item.s}</div>
                </div>
              ))}
            </div>
          </Panel>

          {/* 운성·지장간·통근·사령신·합충·공망·신살 */}
          <Panel style={{ overflow: 'hidden' }}>
            {/* 운성 행 */}
            <div style={{ ...rowGrid, borderBottom: `1px solid ${INK.hair}` }}>
              <GutterTerm>운성</GutterTerm>
              {pillarsAll.map(p => {
                const u = getUnsung(p.stem as Stem, p.branch as Branch);
                return (
                  <Cell key={p.label} isSelf={p.isSelf}>
                    <span style={{ fontSize: m ? 13 : 15, color: u === '장생' ? OH['목']?.color : INK.ink70 }}>{u}</span>
                  </Cell>
                );
              })}
            </div>

            {/* 지장간 행 */}
            <div style={{ ...rowGrid, borderBottom: `1px solid ${INK.hair}` }}>
              <GutterTerm>지장간</GutterTerm>
              {pillarsAll.map(p => {
                const jj = JIJANGGAN[p.branch as Branch] ?? [];
                return (
                  <Cell key={p.label} isSelf={p.isSelf} style={{ padding: m ? '11px 4px' : '14px 8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                      {jj.map((hs, k) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                          <span style={{ fontSize: m ? 14 : 17, fontWeight: 500, color: INK.ink }}>{hs.stem}</span>
                          <span style={{ fontSize: 10, color: INK.ink28, fontFamily: MONO }}>{POS_LABEL[hs.pos][0]}</span>
                        </div>
                      ))}
                    </div>
                  </Cell>
                );
              })}
            </div>

            {/* 통근 행 */}
            <div style={{ ...rowGrid }}>
              <GutterTerm>통근</GutterTerm>
              {pillarsAll.map(p => {
                const roots = findRoots(p.stem as Stem, allBranches);
                return (
                  <Cell key={p.label} isSelf={p.isSelf}>
                    {roots.length > 0
                      ? <span style={{ fontSize: m ? 12 : 14, color: INK.ink70 }}>{roots.map(r => r.branch).join(' ')}</span>
                      : <span style={{ fontSize: m ? 12 : 14, color: INK.ink28 }}>—</span>}
                  </Cell>
                );
              })}
            </div>

            {/* 사령신·합충·공망·신살 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: m ? 10 : 16,
              padding: m ? '13px 16px' : '15px 18px',
              borderTop: `1px solid ${INK.hair}`, fontSize: m ? 11.5 : 12.5,
              color: INK.ink45, alignItems: 'baseline' }}>
              <span>
                <Term termKey="사령신" onOpen={openDetail}>사령신</Term>{' '}
                <b style={{ color: OH['목']?.color }}>
                  {strengths.salyeong.stem}({strengths.salyeong.element}) {POS_LABEL[strengths.salyeong.pos]}
                </b>
              </span>
              {hapParts.map((part, i) => <span key={i}>· {part}</span>)}
              <span>· 공망 {gongmang.join(' · ')}</span>
              {sinsal.length > 0 && (
                <>
                  <span>· 신살</span>
                  {sinsal.map(s => <span key={s.name} title={s.desc}>{s.name}({s.branches.join('')})</span>)}
                </>
              )}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

// ── OhaengAccordion (풀이탭 상단 접힘) ──
function OhaengAccordion({ result }: { result: SajuUIResult }) {
  const { m } = useContext(SajuUICtx);
  const [open, setOpen] = useState(false);
  const { elements } = result;
  const total = elements.reduce((s, e) => s + e.count, 0);
  const OH_ORDER: Element[] = ['목','화','토','금','수'];
  const { yongSin } = result.advanced;
  const topEl = elements.reduce((a, b) => a.count > b.count ? a : b);

  return (
    <Panel style={{ overflow: 'hidden' }}>
      {/* 헤더 — 항상 표시 */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: m ? '14px 18px' : '16px 22px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left' }}
      >
        <KoLabel style={{ color: INK.ink45, margin: 0 }}>오행</KoLabel>
        {/* 미니 바 */}
        <div style={{ flex: 1, height: 6, borderRadius: 3, overflow: 'hidden',
          border: `1px solid ${INK.cardLine}`, display: 'flex' }}>
          {OH_ORDER.map(oh => {
            const e = elements.find(el => el.el === oh);
            const pct = total > 0 && e ? (e.count / total) * 100 : 0;
            return <div key={oh} style={{ width: `${pct}%`, background: OH[oh]?.color, opacity: 0.85 }} />;
          })}
        </div>
        {/* 도트 */}
        <div style={{ display: 'flex', gap: 4 }}>
          {OH_ORDER.map(oh => {
            const e = elements.find(el => el.el === oh);
            const pct = total > 0 && e ? Math.round((e.count / total) * 100) : 0;
            return (
              <div key={oh} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%',
                  background: OH[oh]?.color, opacity: pct > 0 ? 0.85 : 0.18 }} />
              </div>
            );
          })}
        </div>
        <span style={{ fontSize: 11, color: INK.ink28, lineHeight: 1, transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </button>

      {/* 펼침 영역 */}
      {open && (
        <div style={{ borderTop: `1px solid ${INK.hair}` }}>
          {/* 수치 바 + 요약 */}
          <div style={{ padding: m ? '16px 18px' : '18px 22px' }}>
            <div style={{ display: 'flex', marginBottom: 14 }}>
              {OH_ORDER.map(oh => {
                const e = elements.find(el => el.el === oh);
                const pct = total > 0 && e ? Math.round((e.count / total) * 100) : 0;
                return (
                  <div key={oh} style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: OH[oh]?.color,
                        display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: m ? 13 : 14, fontWeight: 600, color: INK.ink }}>{oh}</span>
                    </div>
                    <div style={{ fontSize: 10, color: INK.ink45, fontFamily: MONO, marginLeft: 11, marginTop: 2 }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: m ? 13 : 14, lineHeight: 1.75, color: INK.ink70, margin: 0 }}>
              <span style={{ color: OH[topEl.el]?.color, fontWeight: 600 }}>{topEl.el}</span>이{' '}
              {total > 0 ? Math.round((topEl.count / total) * 100) : 0}%로 두드러져.{' '}
              {yongSin.yongsin
                ? <>용신 <span style={{ color: OH[yongSin.yongsin]?.color, fontWeight: 600 }}>{yongSin.yongsin}</span>이{' '}살아야 흐름이 풀리니 이 기운을 의식적으로 키워봐.</>
                : <>{yongSin.label} — {yongSin.reason}</>
              }
            </p>
          </div>
          {/* 오행 상세 */}
          {OH_ORDER.map((oh, i) => {
            const e = elements.find(el => el.el === oh);
            const pct = total > 0 && e ? Math.round((e.count / total) * 100) : 0;
            return (
              <div key={oh} style={{ display: 'flex', alignItems: 'center', gap: m ? 14 : 18,
                padding: m ? '13px 18px' : '15px 22px',
                borderTop: `1px solid ${INK.hair}` }}>
                <div style={{ width: m ? 36 : 44, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: m ? 22 : 26, fontWeight: 600, color: OH[oh]?.color, lineHeight: 1 }}>{oh}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(232,223,200,0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: OH[oh]?.color, opacity: 0.85, borderRadius: 3 }} />
                    </div>
                    <span style={{ width: 36, textAlign: 'right', fontSize: 13, fontFamily: MONO,
                      color: pct >= 40 ? OH[oh]?.color : INK.ink45 }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize: m ? 12 : 13, color: INK.ink70, marginTop: 6 }}>{OH_MEAN[oh]}</div>
                  {e?.comment && <div style={{ fontSize: 12, color: INK.ink45, marginTop: 4 }}>{e.comment}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

// ── OhaengTab ──
const OH_MEAN: Record<string, string> = {
  목: '배움·성장·확장의 기운. 나무처럼 위로 뻗으려 해.',
  화: '표현·열정·예의 기운. 등불처럼 주변을 밝혀.',
  토: '안정·중재·신뢰의 기운. 흩어진 걸 모아 현실로 굳혀.',
  금: '결단·정리·원칙의 기운. 쇠처럼 끊고 다듬어.',
  수: '지혜·유연·소통의 기운. 물처럼 낮은 곳으로 흘러.',
};

function OhaengTab({ result }: { result: SajuUIResult }) {
  const { m, openDetail } = useContext(SajuUICtx);
  const { elements } = result;
  const total = elements.reduce((s, e) => s + e.count, 0);
  const OH_ORDER: Element[] = ['목','화','토','금','수'];

  // 가장 많은 오행과 용신 찾기
  const topEl = elements.reduce((a, b) => a.count > b.count ? a : b);
  const { yongSin } = result.advanced;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 12 : 16 }}>
      <Panel style={{ padding: m ? 20 : 28 }}>
        <KoLabel style={{ color: INK.ink45 }}>오행의 균형 · 五行</KoLabel>
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', border: `1px solid ${INK.cardLine}` }}>
            {OH_ORDER.map(oh => {
              const e = elements.find(el => el.el === oh);
              const pct = total > 0 && e ? (e.count / total) * 100 : 0;
              return <div key={oh} style={{ width: `${pct}%`, background: OH[oh]?.color, opacity: 0.85 }} />;
            })}
          </div>
          <div style={{ display: 'flex', marginTop: 12 }}>
            {OH_ORDER.map(oh => {
              const e = elements.find(el => el.el === oh);
              const pct = total > 0 && e ? Math.round((e.count / total) * 100) : 0;
              return (
                <div key={oh} style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: OH[oh]?.color, display: 'inline-block' }} />
                    <span style={{ fontSize: m ? 13 : 14, fontWeight: 600, color: INK.ink }}>{oh}</span>
                    {!m && <span style={{ fontSize: 11, color: INK.ink45, fontFamily: MONO }}>{pct}%</span>}
                  </div>
                  {m && <div style={{ fontSize: 10, color: INK.ink45, fontFamily: MONO, marginLeft: 12 }}>{pct}%</div>}
                </div>
              );
            })}
          </div>
        </div>
        <p style={{ marginTop: 22, fontSize: m ? 14 : 15, lineHeight: 1.75, color: INK.ink70 }}>
          <span style={{ color: OH[topEl.el]?.color, fontWeight: 600 }}>{topEl.el}</span>이{' '}
          {total > 0 ? Math.round((topEl.count / total) * 100) : 0}%로 두드러져.{' '}
          {yongSin.yongsin
            ? <>용신 <span style={{ color: OH[yongSin.yongsin]?.color, fontWeight: 600 }}>{yongSin.yongsin}</span>이{' '}살아야 흐름이 풀리니 이 기운을 의식적으로 키워봐.</>
            : <>{yongSin.label} — {yongSin.reason}</>
          }
        </p>
      </Panel>
      <Panel style={{ overflow: 'hidden' }}>
        {OH_ORDER.map((oh, i) => {
          const e = elements.find(el => el.el === oh);
          const pct = total > 0 && e ? Math.round((e.count / total) * 100) : 0;
          return (
            <div key={oh} style={{ display: 'flex', alignItems: 'center', gap: m ? 14 : 20,
              padding: m ? '15px 18px' : '18px 26px',
              borderTop: i ? `1px solid ${INK.hair}` : 'none' }}>
              <div style={{ width: m ? 40 : 52, textAlign: 'center', flex: '0 0 auto' }}>
                <div style={{ fontSize: m ? 24 : 28, fontWeight: 600, color: OH[oh]?.color, lineHeight: 1 }}>{oh}</div>
                <div style={{ fontSize: 11, color: INK.ink28, fontFamily: MONO, marginTop: 3 }}>
                  {CHEONGAN_DATA[oh] ? '' : ''}木火土金水'[i]
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(232,223,200,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: OH[oh]?.color, opacity: 0.85, borderRadius: 4 }} />
                  </div>
                  <span style={{ width: 40, textAlign: 'right', fontSize: 14, fontFamily: MONO,
                    color: pct >= 40 ? OH[oh]?.color : INK.ink45 }}>{pct}%</span>
                </div>
                <div style={{ fontSize: m ? 12.5 : 13.5, color: INK.ink70, marginTop: 8 }}>{OH_MEAN[oh]}</div>
                {e?.comment && <div style={{ fontSize: 13, color: INK.ink45, marginTop: 6 }}>{e.comment}</div>}
              </div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

// ── DaeunTab ──
function DaeunTab({ result }: { result: SajuUIResult }) {
  const { m, openDetail } = useContext(SajuUICtx);
  const { pillars: fp } = result;
  const dm = fp.day.stem;
  const currentYear = new Date().getFullYear();
  const birthYear = fp.trace.sajuYear;
  const currentAge = currentYear - birthYear;

  const daeunList = fp.daeun;
  const currentIdx = daeunList.findIndex(d => currentAge >= d.startAge && currentAge < d.startAge + 10);
  const currentDaeun = currentIdx >= 0 ? daeunList[currentIdx] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 10 : 12 }}>
      {/* 헤더 */}
      <Panel style={{ padding: m ? '16px 18px' : '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <Term termKey="대운" onOpen={openDetail}>
            <KoLabel style={{ color: INK.ink45 }}>대운 · 大運 — 10년의 흐름</KoLabel>
          </Term>
          {daeunList.length > 0 && (
            <span style={{ fontFamily: MONO, fontSize: 10, color: INK.ink28 }}>
              대운수 {daeunList[0].startAge}세 시작
            </span>
          )}
        </div>
        {currentDaeun && (() => {
          const se = STEM_DATA[currentDaeun.pillar.stem];
          const be = BRANCH_DATA[currentDaeun.pillar.branch];
          const ss = getSipshin(dm, currentDaeun.pillar.stem);
          const bs = getBranchSipshin(dm, currentDaeun.pillar.branch);
          const ageInDaeun = currentAge - currentDaeun.startAge;
          const progress = Math.round((ageInDaeun / 10) * 100);
          return (
            <div style={{ marginTop: 16, padding: m ? '14px 16px' : '16px 18px',
              borderRadius: 10, border: `1px solid ${INK.gold}44`,
              background: 'rgba(194,163,91,0.055)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 9, fontFamily: MONO, color: INK.gold, letterSpacing: 2,
                  border: `1px solid ${INK.gold}55`, borderRadius: 3, padding: '2px 6px' }}>지금</span>
                <span style={{ fontSize: 12, color: INK.ink45, fontFamily: MONO }}>
                  {currentDaeun.startAge}~{currentDaeun.startAge + 9}세 · {birthYear + currentDaeun.startAge}~{birthYear + currentDaeun.startAge + 9}년
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: m ? 14 : 18 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  <span style={{ fontSize: m ? 36 : 42, fontWeight: 500, fontFamily: SERIF, lineHeight: 1,
                    color: OH[se.element]?.color ?? INK.ink }}>{currentDaeun.pillar.stem}</span>
                  <span style={{ fontSize: m ? 36 : 42, fontWeight: 500, fontFamily: SERIF, lineHeight: 1,
                    color: OH[be.element]?.color ?? INK.ink }}>{currentDaeun.pillar.branch}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontFamily: MONO, color: OH[se.element]?.color ?? INK.ink45,
                      border: `1px solid ${OH[se.element]?.color ?? INK.ink28}55`, borderRadius: 4,
                      padding: '2px 7px' }}>{ss}</span>
                    <span style={{ fontSize: 11, fontFamily: MONO, color: OH[be.element]?.color ?? INK.ink45,
                      border: `1px solid ${OH[be.element]?.color ?? INK.ink28}55`, borderRadius: 4,
                      padding: '2px 7px' }}>{bs}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(232,223,200,0.08)', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: INK.gold, borderRadius: 2, opacity: 0.7 }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: MONO, color: INK.gold, opacity: 0.7 }}>{progress}%</span>
                  </div>
                  <p style={{ fontSize: 11, color: INK.ink28, marginTop: 4, fontFamily: MONO }}>
                    {birthYear + currentAge}년 기준 · {ageInDaeun}년 경과
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </Panel>

      {/* 전체 타임라인 */}
      <Panel style={{ overflow: 'hidden' }}>
        {daeunList.map((d, i) => {
          const se = STEM_DATA[d.pillar.stem];
          const be = BRANCH_DATA[d.pillar.branch];
          const ss = getSipshin(dm, d.pillar.stem);
          const bs = getBranchSipshin(dm, d.pillar.branch);
          const isCurrent = i === currentIdx;
          const isPast = currentAge >= d.startAge + 10;
          const startYear = birthYear + d.startAge;

          return (
            <div key={d.startAge}
              onClick={() => openDetail({
                head: `${d.pillar.stem}${d.pillar.branch}`, han: null, oh: se.element,
                chips: [`${d.startAge}~${d.startAge + 9}세`, `${startYear}~${startYear + 9}년`, isCurrent ? '현재 대운' : isPast ? '지난 대운' : '다가올 대운'],
                blocks: [
                  { label: `천간 ${d.pillar.stem} (${ss})`, text: CHEONGAN_DATA[d.pillar.stem]?.img ?? se.image },
                  { label: `지지 ${d.pillar.branch} (${bs})`, text: `${be.element} · ${be.animal}` },
                ],
              })}
              style={{
                display: 'flex', alignItems: 'center', gap: m ? 12 : 16, cursor: 'pointer',
                padding: m ? '14px 18px' : '16px 24px',
                borderTop: i ? `1px solid ${INK.hair}` : 'none',
                opacity: isPast ? 0.45 : 1,
                background: isCurrent ? 'rgba(194,163,91,0.04)' : 'transparent',
                transition: 'background 0.15s',
              }}>
              {/* 타임라인 도트 */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{
                  width: isCurrent ? 10 : 7, height: isCurrent ? 10 : 7, borderRadius: '50%',
                  background: isCurrent ? INK.gold : isPast ? INK.ink28 : INK.ink45,
                  boxShadow: isCurrent ? `0 0 8px ${INK.gold}88` : 'none',
                  flexShrink: 0,
                }} />
              </div>

              {/* 연도/나이 */}
              <div style={{ flexShrink: 0, width: m ? 72 : 88, textAlign: 'right' }}>
                <div style={{ fontSize: m ? 11 : 12, fontFamily: MONO,
                  color: isCurrent ? INK.gold : INK.ink45 }}>
                  {startYear}~{startYear + 9}
                </div>
                <div style={{ fontSize: 10, color: INK.ink28, fontFamily: MONO, marginTop: 1 }}>
                  {d.startAge}~{d.startAge + 9}세
                </div>
              </div>

              {/* 천간·지지 */}
              <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <span style={{ fontSize: m ? 26 : 30, fontWeight: 500, fontFamily: SERIF, lineHeight: 1,
                  color: isCurrent ? (OH[se.element]?.color ?? INK.ink) : (OH[se.element]?.color ?? INK.ink45),
                  opacity: isPast ? 1 : 1 }}>{d.pillar.stem}</span>
                <span style={{ fontSize: m ? 26 : 30, fontWeight: 500, fontFamily: SERIF, lineHeight: 1,
                  color: isCurrent ? (OH[be.element]?.color ?? INK.ink) : (OH[be.element]?.color ?? INK.ink45) }}>{d.pillar.branch}</span>
              </div>

              {/* 십신 뱃지 */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontFamily: MONO,
                  color: OH[se.element]?.color ?? INK.ink45, opacity: 0.8 }}>{ss}</span>
                <span style={{ fontSize: 10, color: INK.ink28 }}>·</span>
                <span style={{ fontSize: 10, fontFamily: MONO,
                  color: OH[be.element]?.color ?? INK.ink45, opacity: 0.8 }}>{bs}</span>
              </div>

              {/* 화살표 */}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: INK.ink28, flexShrink: 0 }}>›</span>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

// ── OlhaeTab ──
function OlhaeTab({ result }: { result: SajuUIResult }) {
  const { m } = useContext(SajuUICtx);
  const dm = result.pillars.day.stem;
  const currentYear = new Date().getFullYear();

  const { stem: curStem, branch: curBranch } = calcSeyunPillar(currentYear);
  const { stem: nextStem, branch: nextBranch } = calcSeyunPillar(currentYear + 1);

  const curStemEl   = STEM_DATA[curStem].element;
  const curBranchEl = BRANCH_DATA[curBranch].element;
  const nextStemEl  = STEM_DATA[nextStem].element;

  const curSipGan  = getSipshin(dm, curStem);
  const curSipJi   = getBranchSipshin(dm, curBranch);
  const nextSipGan = getSipshin(dm, nextStem);
  const nextSipJi  = getBranchSipshin(dm, nextBranch);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 12 : 16 }}>
      <Panel style={{ padding: m ? 22 : 28, display: 'flex', flexDirection: m ? 'column' : 'row',
        gap: m ? 20 : 30, alignItems: m ? 'stretch' : 'center' }}>
        <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontFamily: MONO, color: INK.ink70 }}>{currentYear}</span>
            <span style={{ fontSize: 11, color: INK.gold, letterSpacing: 1 }}>올해</span>
          </div>
          <div style={{ fontSize: 64, fontWeight: 500, fontFamily: SERIF, lineHeight: 1.1, marginTop: 6 }}>
            <span style={{ color: OH[curStemEl]?.color ?? INK.ink }}>{curStem}</span>
            <span style={{ color: OH[curBranchEl]?.color ?? INK.ink }}>{curBranch}</span>
          </div>
          <div style={{ fontSize: 13, color: INK.ink45, marginTop: 4 }}>{curSipGan} · {curSipJi}</div>
        </div>
        <div style={{ width: m ? '100%' : 1, height: m ? 1 : 'auto', alignSelf: 'stretch', background: INK.hair }} />
        <div>
          <div style={{ fontSize: m ? 16 : 18, fontWeight: 600, marginBottom: 10, color: INK.ink }}>올해 흐름</div>
          <p style={{ fontSize: m ? 14.5 : 15.5, lineHeight: 1.8, color: INK.ink70, margin: 0 }}>
            올해는 <b style={{ color: OH[curStemEl]?.color }}>{curStem}{curBranch}</b>년.{' '}
            천간 {curSipGan}, 지지 {curSipJi} 기운이 들어와.{' '}
            이 두 에너지가 나의 사주와 어떻게 만나는지가 올해의 핵심이야.
          </p>
        </div>
      </Panel>
      <Panel style={{ padding: m ? '18px 22px' : '20px 28px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <KoLabel style={{ fontSize: 10 }}>다음 해 미리보기</KoLabel>
          <div style={{ fontSize: 13, color: INK.ink45, marginTop: 6 }}>{nextSipGan} · {nextSipJi}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 13, fontFamily: MONO, color: INK.ink45 }}>{currentYear + 1}</span>
          <span style={{ fontSize: 30, fontWeight: 500, fontFamily: SERIF, whiteSpace: 'nowrap' }}>
            <span style={{ color: OH[nextStemEl]?.color ?? INK.ink }}>{nextStem}</span>
            {' '}
            <span style={{ color: OH[BRANCH_DATA[nextBranch].element]?.color ?? INK.ink }}>{nextBranch}</span>
          </span>
        </div>
      </Panel>
    </div>
  );
}

// ── GunghapTab ──
function GunghapTab({ result }: { result: SajuUIResult }) {
  const { m } = useContext(SajuUICtx);
  const myElement = result.dayMaster.element;
  const [form, setForm] = useState({ year: '', month: '', day: '' });
  const [res, setRes] = useState<{ compat: ReturnType<typeof getCompat>; dm: string } | null>(null);

  async function check() {
    const y=parseInt(form.year), mm=parseInt(form.month), d=parseInt(form.day);
    if (!y||!mm||!d) return;
    const index = await loadSeolgi();
    const fp2 = computeFourPillars(index, fromKST(y,mm,d,null), 'male');
    const otherEl = STEM_DATA[fp2.day.stem].element;
    setRes({ compat: getCompat(myElement, otherEl), dm: `${fp2.day.stem}(${STEM_DATA[fp2.day.stem].hanja}) · ${otherEl}` });
  }

  return (
    <Panel style={{ padding: m ? '48px 22px' : '64px 28px', textAlign: 'center' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 52, height: 52, borderRadius: 5, border: `1px solid ${INK.gold}55`, color: INK.gold,
        fontFamily: SERIF, fontSize: 28, fontWeight: 500 }}>合</span>
      <div style={{ fontSize: m ? 18 : 20, fontWeight: 600, marginTop: 22, color: INK.ink }}>궁합 볼 상대를 더해줘</div>
      <p style={{ fontSize: m ? 14 : 15, lineHeight: 1.75, color: INK.ink70, maxWidth: 420, margin: '12px auto 28px' }}>
        상대의 생년월일을 입력하면, 두 사람의 오행이 어떻게 만나는지 읽어줄게.
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        {([['년도','year','80px'],['월','month','60px'],['일','day','60px']] as [string,string,string][]).map(([ph,k,w])=>(
          <input key={k} type="number" placeholder={ph} value={form[k as keyof typeof form]}
            onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
            style={{ width: w, border: `1px solid ${INK.cardLine}`, background: 'transparent',
              color: INK.ink, borderRadius: 4, padding: '8px 10px', fontFamily: MONO, fontSize: 13 }} />
        ))}
        <button onClick={check}
          style={{ background: INK.gold, color: INK.bg, border: 'none', borderRadius: 4,
            padding: '8px 20px', fontFamily: MONO, fontSize: 12, letterSpacing: 1,
            cursor: 'pointer', fontWeight: 600 }}>
          궁합 보기
        </button>
      </div>
      {res && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 8, padding: '20px 24px',
            textAlign: 'left', background: INK.card, maxWidth: 420, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 28 }}>{res.compat.emoji}</span>
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: INK.ink }}>{res.compat.level}</span>
              <span style={{ marginLeft: 12, fontSize: 12, color: INK.ink45, fontFamily: MONO }}>{res.dm}</span>
            </div>
          </div>
          <p style={{ fontSize: 14, color: INK.ink70, lineHeight: 1.7, margin: 0 }}>{res.compat.comment}</p>
        </motion.div>
      )}
    </Panel>
  );
}

// ── ResultView ──
type TabId = 'ai' | 'manse' | 'ohaeng' | 'daeun' | 'olhae' | 'gunghap';

const TABS: { id: TabId; ko: string; mark?: string }[] = [
  { id: 'ai',      ko: '풀이',   mark: '✦' },
  { id: 'manse',   ko: '사주풀이' },
  { id: 'ohaeng',  ko: '오행' },
  { id: 'daeun',   ko: '대운' },
  { id: 'olhae',   ko: '올해' },
  { id: 'gunghap', ko: '궁합' },
];

function ResultView({ result, defaultType = 'full', cachedSections, onReadingId, currentReadingId, onReset, onShare }: {
  result: SajuUIResult;
  defaultType?: ReadingType;
  cachedSections?: ReadingSection[] | null;
  onReadingId?: (id: string) => void;
  currentReadingId?: string | null;
  onReset: () => void;
  onShare: () => void;
}) {
  const m = useIsMobile();
  const isLeanType = defaultType === 'love' || defaultType === 'today' || defaultType === 'career';
  const [tab, setTab] = useState<TabId>(isLeanType ? 'ai' : 'manse');
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const { birth, dayMaster } = result;

  const ctx = useMemo(() => ({ m, openDetail: setDetail }), [m]);

  const sexLabel  = birth.sex === 'male' ? '남' : '여';
  const hourLabel = birth.hour === null ? '시간 미상' : `${birth.hour}:${String(birth.minute).padStart(2,'0')}`;

  return (
    <SajuUICtx.Provider value={ctx}>
      <div style={{ background: INK.bg, fontFamily: SERIF, color: INK.ink, minHeight: '100vh' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: m ? '76px 15px 48px' : '96px 44px 64px', boxSizing: 'border-box' }}>

          {/* 상단 바 */}
          <div style={{ display: 'flex', alignItems: m ? 'flex-start' : 'center',
            justifyContent: 'space-between', flexDirection: m ? 'column' : 'row',
            gap: m ? 12 : 0, paddingBottom: m ? 18 : 22, borderBottom: `1px solid ${INK.hair}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', minWidth: 0 }}>
              {birth.name && (
                <span style={{ fontSize: m ? 20 : 22, fontWeight: 600, letterSpacing: 1, whiteSpace: 'nowrap', color: INK.ink }}>
                  {birth.name}
                </span>
              )}
              <span style={{ fontFamily: MONO, fontSize: m ? 10 : 11, color: INK.ink45, whiteSpace: 'nowrap' }}>
                {sexLabel} · {birth.year}.{String(birth.month).padStart(2,'0')}.{String(birth.day).padStart(2,'0')} · {hourLabel}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flex: '0 0 auto', alignSelf: m ? 'stretch' : 'auto' }}>
              {[
                { label: '카드 공유', action: onShare },
                { label: '다시 입력', action: onReset },
              ].map(({ label, action }) => (
                <button key={label} onClick={action}
                  style={{ flex: m ? 1 : '0 0 auto', textAlign: 'center',
                    fontFamily: MONO, fontSize: 11, whiteSpace: 'nowrap',
                    letterSpacing: 1, color: INK.ink45,
                    border: `1px solid ${INK.cardLine}`, padding: '7px 13px',
                    borderRadius: 4, background: 'transparent', cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 원국 — 일간카드 + 8자카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '380px 1fr',
            gap: m ? 14 : 24, alignItems: 'stretch', marginTop: m ? 18 : 28 }}>
            <IlganCard result={result} />
            <WonGukCard result={result} />
          </div>

          {/* 탭 바 */}
          <div style={{ display: 'flex', gap: 4, marginTop: m ? 22 : 32, padding: 5,
            borderRadius: 10, border: `1px solid ${INK.cardLine}`,
            background: 'rgba(232,223,200,0.02)',
            overflowX: m ? 'auto' : 'visible', scrollbarWidth: 'none' }}>
            {(defaultType === 'today'  ? TABS.filter(t => t.id === 'ai') :
              defaultType === 'love'   ? TABS.filter(t => t.id === 'ai' || t.id === 'gunghap') :
              defaultType === 'career' ? TABS.filter(t => t.id === 'ai') :
              TABS).map(t => {
              const on = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ flex: m ? '0 0 auto' : 1, cursor: 'pointer',
                    border: 'none', borderRadius: 7,
                    padding: m ? '10px 16px' : '12px 8px', whiteSpace: 'nowrap',
                    fontFamily: SERIF, fontSize: m ? 14 : 15,
                    fontWeight: on ? 600 : 400, letterSpacing: 0.5,
                    transition: 'background-color .18s, color .18s',
                    backgroundColor: on ? 'rgba(232,223,200,0.10)' : 'rgba(0,0,0,0)',
                    color: on ? INK.ink : INK.ink45,
                    boxShadow: on ? `inset 0 0 0 1px rgba(232,223,200,0.10)` : 'none' }}>
                  {t.mark && <span style={{ color: INK.gold, marginRight: 6, fontSize: 13 }}>{t.mark}</span>}
                  {t.ko}
                </button>
              );
            })}
          </div>

          {/* 탭 콘텐츠 */}
          <div style={{ marginTop: m ? 16 : 24 }}>
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {tab === 'ai'      && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <OhaengAccordion result={result} />
                    <Panel style={{ padding: m ? 20 : 28 }}>
                      <ReadingTab birth={result.birth} initialType={defaultType ?? 'full'}
                        cachedSections={cachedSections} onReadingId={onReadingId} />
                    </Panel>
                  </div>
                )}
                {tab === 'manse'   && <ManseTab result={result} />}
                {tab === 'ohaeng'  && <OhaengTab result={result} />}
                {tab === 'daeun'   && <DaeunTab result={result} />}
                {tab === 'olhae'   && <OlhaeTab result={result} />}
                {tab === 'gunghap' && <GunghapTab result={result} />}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>

      <DetailSheet data={detail} onClose={() => setDetail(null)} />
    </SajuUICtx.Provider>
  );
}

// ── 타입 메타 (SEO / 라우팅용) ──
const TYPE_META: Record<ReadingType, { title: string; sub: string }> = {
  full:   { title: '종합 풀이',  sub: '성격부터 올해 세운까지' },
  today:  { title: '오늘의 사주', sub: '오늘 일진으로 보는 하루' },
  love:   { title: '연애운',     sub: '내 인연은 누구? 언제 만날까?' },
  career: { title: '직업·재물운', sub: '어울리는 일과 재물 성향' },
};

export type { ReadingType };

// ── 폼 기본값 ──
const FORM_DEFAULTS = {
  name: '', concern: '',
  year: '', month: '', day: '', hour: '', minute: '',
  unknownHour: false,
  sex: 'male' as 'male' | 'female',
  calType: 'solar' as 'solar' | 'lunar',
  isLeapMonth: false,
  city: '서울',
  customLon: '',
  dayBoundaryRule: 'midnight' as 'midnight' | 'zi_hour',
  applyHapHwa: false,
};

// ── 메인 페이지 ──
export function SajuPage({ fixedType, readingId: initialReadingId, publicApi = false }: { fixedType?: ReadingType; readingId?: string; publicApi?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState(FORM_DEFAULTS);
  const [selectedType, setSelectedType] = useState<ReadingType>(fixedType ?? 'full');
  const [result, setResult] = useState<SajuUIResult | null>(null);
  const [cachedSections, setCachedSections] = useState<ReadingSection[] | null>(null);
  const [currentReadingId, setCurrentReadingId] = useState<string | null>(initialReadingId ?? null);
  const [expandedInfo, setExpandedInfo] = useState<'zi_hour' | 'hapHwa' | null>(null);
  const [error, setError]   = useState<string | null>(null);
  // readingId로 직접 진입 시 첫 렌더부터 loading=true — 폼 flash 방지
  const [loading, setLoading] = useState(!!initialReadingId);
  const [showShare, setShowShare] = useState(false);
  // 폼 레이아웃용 반응형 — 얼리 리턴 이전에 선언해야 훅 규칙 위반 없음
  const formIsMobile = useIsMobile(880);
  const formIsSmall  = useIsMobile(560);

  // readingId로 진입 시 DB에서 결과 복원
  useEffect(() => {
    if (!initialReadingId) return;
    setLoading(true);
    const endpoint = publicApi
      ? `/api/saju/public/${initialReadingId}`
      : `/api/saju/readings/${initialReadingId}`;
    fetch(endpoint)
      .then(r => r.ok ? r.json() : null)
      .then(async d => {
        if (!d?.birth_year) { setLoading(false); return; }
        const index = await loadSeolgi();
        const lon = d.birth_longitude ?? 127.0;
        const fp = computeFourPillars(index, fromKST(d.birth_year, d.birth_month, d.birth_day, d.birth_hour, d.birth_minute ?? 0, lon, 'midnight'), d.birth_sex);
        const birthParams = {
          year: d.birth_year, month: d.birth_month, day: d.birth_day,
          hour: d.birth_hour, minute: d.birth_minute ?? 0, sex: d.birth_sex as 'male' | 'female',
          longitudeE: lon, dayBoundaryRule: 'midnight' as const, applyHapHwa: false,
          name: d.birth_name ?? undefined, concern: d.concern ?? undefined,
        };
        setResult(buildUIResult(fp, birthParams));
        if (d.ai_sections) setCachedSections(d.ai_sections);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialReadingId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialReadingId) return; // readingId 있으면 폼 복원 불필요
    let pending: { year:number; month:number; day:number; hour:number|null; minute:number; sex:'male'|'female'; longitudeE:number; dayBoundaryRule:'midnight'|'zi_hour'; applyHapHwa:boolean; name?:string; concern?:string } | null = null;
    try {
      const saved = sessionStorage.getItem('saju:form');
      if (saved) {
        setForm(f => ({ ...f, ...JSON.parse(saved) }));
      } else {
        // 세션 폼 없으면 저장된 프로필로 pre-fill
        fetch('/api/user/profile')
          .then(r => r.ok ? r.json() : null)
          .then(d => {
            if (d?.birth_year) {
              setForm(f => ({
                ...f,
                year:        String(d.birth_year),
                month:       String(d.birth_month),
                day:         String(d.birth_day),
                hour:        d.birth_hour != null ? String(d.birth_hour) : '',
                unknownHour: d.birth_hour == null,
                sex:         d.birth_sex ?? 'male',
                name:        d.birth_name ?? '',
                city:        Math.abs((d.birth_longitude ?? 127.0) - 127.0) > 0.5 ? '__custom__' : '서울',
                customLon:   String(d.birth_longitude ?? 127.0),
              }));
            }
          }).catch(() => {});
      }
      const raw = sessionStorage.getItem('saju:pending-compute');
      if (raw) {
        sessionStorage.removeItem('saju:pending-compute');
        pending = JSON.parse(raw);
      }
    } catch { /* ignore */ }

    if (pending) {
      const p = pending;
      setError(null); setLoading(true);
      loadSeolgi().then(index => {
        const fp = computeFourPillars(index, fromKST(p.year, p.month, p.day, p.hour, p.minute ?? 0, p.longitudeE, p.dayBoundaryRule ?? 'midnight'), p.sex);
        setResult(buildUIResult(fp, { year:p.year, month:p.month, day:p.day, hour:p.hour, minute:p.minute??0, sex:p.sex, longitudeE:p.longitudeE, dayBoundaryRule:p.dayBoundaryRule??'midnight', applyHapHwa:p.applyHapHwa??false, name:p.name, concern:p.concern }));
      }).catch(err => {
        setError(`계산 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      }).finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    const min = form.unknownHour ? 0 : (parseInt(form.minute) || 0);

    if (!y || !m || !d || y < 1880 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
      setError('날짜를 올바르게 입력해주세요. (1880~2100)'); setLoading(false); return;
    }
    if (!form.unknownHour && (isNaN(h!) || h! < 0 || h! > 23)) {
      setError('시간은 0~23 사이로 입력하거나 "모름"을 체크하세요.'); setLoading(false); return;
    }
    if (!form.unknownHour && (min < 0 || min > 59)) {
      setError('분은 0~59 사이로 입력해주세요.'); setLoading(false); return;
    }

    if (form.calType === 'lunar') {
      try {
        const solar = lunarToSolar(y, m, d, form.isLeapMonth);
        y = solar.year; m = solar.month; d = solar.day;
      } catch {
        setError('음력 날짜 변환에 실패했습니다. 날짜를 확인해주세요.'); setLoading(false); return;
      }
    }

    const longitudeE = getLongitude();
    try { sessionStorage.setItem('saju:form', JSON.stringify(form)); } catch { /* ignore */ }

    // 출생 정보 프로필에 자동 저장 (fire-and-forget)
    fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birth_year: y, birth_month: m, birth_day: d,
        birth_hour: h, birth_minute: min,
        birth_sex: form.sex,
        birth_name: form.name.trim() || null,
        birth_longitude: longitudeE,
      }),
    }).catch(() => {});

    try {
      const index = await loadSeolgi();
      const fp = computeFourPillars(index, fromKST(y, m, d, h, min, longitudeE, form.dayBoundaryRule), form.sex);
      setResult(buildUIResult(fp, {
        year: y, month: m, day: d, hour: h, minute: min, sex: form.sex,
        longitudeE, dayBoundaryRule: form.dayBoundaryRule, applyHapHwa: form.applyHapHwa,
        name: form.name.trim() || undefined, concern: form.concern.trim() || undefined,
      }));
    } catch (err) {
      setError(`계산 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally { setLoading(false); }
  }

  function handleReadingId(id: string) {
    setCurrentReadingId(id);
    // URL에 이미 ID가 있으면(직접 URL 진입) replace 불필요 — 재마운트로 폼 깜빡임 유발
    // 폼 제출 후(initialReadingId 없음)일 때만 URL에 ID 추가
    if (!publicApi && fixedType && !initialReadingId) {
      router.replace(`/saju/${fixedType}/${id}`);
    }
  }

  // readingId 복원 중 — 폼 대신 스피너
  if (!result && initialReadingId && loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-white/30 tracking-widest">불러오는 중...</p>
      </div>
    );
  }

  if (result) {
    const shareParams: ShareParams = {
      stem:     result.dayMaster.stem,
      branch:   result.pillars.day.branch,
      hanja:    result.dayMaster.hanja,
      element:  result.dayMaster.element,
      image:    result.dayMaster.image,
      name:     result.birth.name ?? '',
      keywords: result.dayMaster.profile.keyword.join(','),
      core:     buildCoreDesc(
        result.dayMaster.stem,
        result.pillars.day.branch,
        result.sipshinMap.dayBranch,
        result.advanced.bodyStrength,
        result.advanced.geokGuk,
      ),
    };

    return (
      <>
        <ResultView
          result={result}
          defaultType={selectedType}
          cachedSections={cachedSections}
          onReadingId={handleReadingId}
          currentReadingId={currentReadingId}
          onReset={() => { setResult(null); setCachedSections(null); if (fixedType && initialReadingId) router.replace(`/saju/${fixedType}`); }}
          onShare={() => setShowShare(true)}
        />
        <AnimatePresence>
          {showShare && (
            <ShareModal
              params={shareParams}
              shareLink={currentReadingId ? `/saju/view/${currentReadingId}` : undefined}
              onClose={() => setShowShare(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  const isMobile = formIsMobile;
  const isSmall  = formIsSmall;

  const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: INK.card, border: `1px solid ${INK.cardLine}`,
    borderRadius: 9, color: INK.ink,
    fontFamily: SERIF, fontSize: 16,
    padding: '14px 16px', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: SERIF, fontSize: 14.5, fontWeight: 500,
    color: INK.ink70, letterSpacing: 0.3, display: 'block', marginBottom: 11,
  };

  const fieldGap = isMobile ? 22 : 26;

  const DISPLAY_FONT = '"Shilla", var(--font-noto-serif-kr), serif';

  return (
    <div style={{ background: INK.bg, minHeight: '100dvh', color: INK.ink, fontFamily: SERIF }}>
      <div style={{
        width: '100%',
        maxWidth: isMobile ? 560 : 880,
        margin: '0 auto',
        boxSizing: 'border-box',
        padding: isSmall ? '34px 18px 60px' : (isMobile ? '40px 24px 60px' : '56px 40px 80px'),
      }}>

        {/* FormHead */}
        <div style={{ marginBottom: isMobile ? 30 : 40 }}>
          <Link href="/saju" style={{
            fontFamily: MONO, fontSize: 12, letterSpacing: 1,
            color: INK.ink45, display: 'inline-flex', alignItems: 'center',
            gap: 8, cursor: 'pointer', textDecoration: 'none',
          }}>
            ← 사주팔자
          </Link>
          <h1 style={{
            fontFamily: DISPLAY_FONT,
            fontSize: isMobile ? '38px' : '50px',
            color: INK.ink, margin: '16px 0 0',
            letterSpacing: 1, fontWeight: 400, lineHeight: 1.1,
          }}>
            {TYPE_META[selectedType]?.title ?? '사주팔자'}
          </h1>
          <p style={{
            fontFamily: SERIF,
            fontSize: isMobile ? '14.5px' : '16px',
            color: INK.ink45, margin: '12px 0 0',
          }}>
            {TYPE_META[selectedType]?.sub}
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: INK.card,
          border: `1px solid ${INK.cardLine}`,
          borderRadius: 16,
          padding: isMobile ? '24px 20px' : '36px 40px',
        }}>
          <form onSubmit={submit}>

            {/* Inner grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1px 1fr',
              gap: isMobile ? 0 : 44,
            }}>
              {/* LEFT col */}
              <div>
                <p style={{ fontFamily: MONO, fontSize: 11, color: INK.ink28, marginBottom: 4 }}>01 누구</p>
                <p style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: INK.ink70, marginBottom: isMobile ? 20 : 24 }}>이름과 성별</p>

                {/* 이름 */}
                <div>
                  <label style={labelStyle}>
                    이름{' '}
                    <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: 1, color: INK.ink28 }}>선택</span>
                  </label>
                  <input
                    type="text" placeholder="홍길동" maxLength={20} value={form.name}
                    onChange={e => set('name', e.target.value)}
                    style={inputBase}
                  />
                </div>

                {/* 성별 */}
                <div style={{ marginTop: fieldGap }}>
                  <label style={labelStyle}>성별</label>
                  <div style={{
                    display: 'inline-flex', width: '100%', padding: 4, gap: 4,
                    borderRadius: 9, border: `1px solid ${INK.cardLine}`, background: INK.card,
                    boxSizing: 'border-box',
                  }}>
                    {(['male', 'female'] as const).map(s => (
                      <button
                        key={s} type="button" onClick={() => set('sex', s)}
                        style={{
                          flex: 1, textAlign: 'center', cursor: 'pointer',
                          padding: '11px 20px', borderRadius: 6, border: 'none',
                          fontFamily: SERIF, fontSize: 15, transition: 'all 0.15s',
                          fontWeight: form.sex === s ? 600 : 400,
                          color: form.sex === s ? INK.ink : INK.ink45,
                          background: form.sex === s ? 'rgba(232,223,200,0.11)' : 'transparent',
                          boxShadow: form.sex === s ? `inset 0 0 0 1px ${INK.cardLine}` : 'none',
                        }}
                      >
                        {s === 'male' ? '남자' : '여자'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vertical divider (desktop) / horizontal divider (mobile) */}
              {isMobile ? (
                <div style={{ height: 1, background: INK.hair, margin: `${fieldGap}px 0` }} />
              ) : (
                <div style={{ background: INK.hair }} />
              )}

              {/* RIGHT col */}
              <div>
                <p style={{ fontFamily: MONO, fontSize: 11, color: INK.ink28, marginBottom: 4 }}>02 언제·어디서</p>
                <p style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: INK.ink70, marginBottom: isMobile ? 20 : 24 }}>생년월일 · 시간 · 장소</p>

                {/* 생년월일 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>생년월일</label>
                    {/* Cal toggle */}
                    <div style={{
                      display: 'inline-flex', padding: '3px', gap: 3,
                      borderRadius: 7, border: `1px solid ${INK.cardLine}`, background: INK.card,
                    }}>
                      {(['solar', 'lunar'] as const).map(t => (
                        <button key={t} type="button" onClick={() => set('calType', t)}
                          style={{
                            padding: '7px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                            border: 'none', fontFamily: SERIF, transition: 'all 0.15s',
                            fontWeight: form.calType === t ? 600 : 400,
                            color: form.calType === t ? INK.ink : INK.ink45,
                            background: form.calType === t ? 'rgba(232,223,200,0.11)' : 'transparent',
                          }}
                        >
                          {t === 'solar' ? '양력' : '음력'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 10 }}>
                    {[
                      { key: 'year', placeholder: '년도', unit: '년', val: form.year },
                      { key: 'month', placeholder: '월', unit: '월', val: form.month },
                      { key: 'day', placeholder: '일', unit: '일', val: form.day },
                    ].map(({ key, placeholder, unit, val }) => (
                      <div key={key} style={{ position: 'relative' }}>
                        <input
                          type="text" inputMode="numeric" pattern="[0-9]*"
                          placeholder={placeholder} value={val}
                          onChange={e => set(key, e.target.value)}
                          style={{ ...inputBase, paddingRight: 36 }}
                        />
                        <span style={{
                          position: 'absolute', right: 14, top: '50%',
                          transform: 'translateY(-50%)',
                          fontFamily: MONO, fontSize: 12, color: INK.ink28,
                          pointerEvents: 'none',
                        }}>
                          {unit}
                        </span>
                      </div>
                    ))}
                  </div>
                  {form.calType === 'lunar' && (
                    <label style={{
                      marginTop: 10, display: 'flex', alignItems: 'center', gap: 8,
                      fontFamily: SERIF, fontSize: 14, color: INK.ink45, cursor: 'pointer',
                    }}>
                      <input
                        type="checkbox" checked={form.isLeapMonth}
                        onChange={e => set('isLeapMonth', e.target.checked)}
                        style={{ accentColor: INK.gold, width: 16, height: 16 }}
                      />
                      윤달
                    </label>
                  )}
                </div>

                {/* 태어난 시간 */}
                <div style={{ marginTop: fieldGap }}>
                  <label style={labelStyle}>태어난 시간</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {/* 시 */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*"
                        placeholder="0~23" value={form.hour} disabled={form.unknownHour}
                        onChange={e => set('hour', e.target.value)}
                        style={{
                          ...inputBase, width: 110, paddingRight: 36,
                          opacity: form.unknownHour ? 0.35 : 1,
                        }}
                      />
                      <span style={{
                        position: 'absolute', right: 14, top: '50%',
                        transform: 'translateY(-50%)',
                        fontFamily: MONO, fontSize: 12, color: INK.ink28,
                        pointerEvents: 'none',
                      }}>시</span>
                    </div>
                    <span style={{ fontFamily: MONO, color: INK.ink28, fontSize: 16 }}>:</span>
                    {/* 분 */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*"
                        placeholder="0~59" value={form.minute} disabled={form.unknownHour}
                        onChange={e => set('minute', e.target.value)}
                        style={{
                          ...inputBase, width: 110, paddingRight: 36,
                          opacity: form.unknownHour ? 0.35 : 1,
                        }}
                      />
                      <span style={{
                        position: 'absolute', right: 14, top: '50%',
                        transform: 'translateY(-50%)',
                        fontFamily: MONO, fontSize: 12, color: INK.ink28,
                        pointerEvents: 'none',
                      }}>분</span>
                    </div>
                    {/* 모름 */}
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontFamily: SERIF, fontSize: 14.5, color: INK.ink70, cursor: 'pointer',
                    }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: `1px solid ${form.unknownHour ? INK.gold : INK.cardLine}`,
                        background: form.unknownHour ? INK.gold : 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                        {form.unknownHour && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="#1a140c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      <input
                        type="checkbox" checked={form.unknownHour}
                        onChange={e => set('unknownHour', e.target.checked)}
                        style={{ display: 'none' }}
                      />
                      모름
                    </label>
                  </div>
                </div>

                {/* 태어난 곳 */}
                <div style={{ marginTop: fieldGap }}>
                  <label style={labelStyle}>태어난 곳</label>
                  <select
                    value={form.city} onChange={e => set('city', e.target.value)}
                    style={{ ...inputBase, appearance: 'none', WebkitAppearance: 'none' }}
                  >
                    <option value="" style={{ background: '#1a140c' }}>도시 선택</option>
                    {DOMESTIC_CITIES.map(c => (
                      <option key={c.label} value={c.label} style={{ background: '#1a140c' }}>{c.label}</option>
                    ))}
                    <option value="__overseas__" disabled style={{ background: '#1a140c' }}>── 해외 ──</option>
                    {OVERSEAS_CITIES.map(c => (
                      <option key={c.label} value={c.label} style={{ background: '#1a140c' }}>{c.label}</option>
                    ))}
                    <option value="__custom__" style={{ background: '#1a140c' }}>직접 입력 (경도)</option>
                  </select>
                  {form.city === '__custom__' && (
                    <input
                      type="number" placeholder="경도 (예: 127.0 = 서울, -118.2 = LA)"
                      value={form.customLon} onChange={e => set('customLon', e.target.value)}
                      step="0.1" min="-180" max="180"
                      style={{ ...inputBase, marginTop: 10 }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 고급 설정 */}
            <div style={{
              marginTop: isMobile ? 22 : 28,
              border: `1px solid ${INK.cardLine}`, borderRadius: 12,
              background: INK.card, padding: '16px 18px',
            }}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: INK.ink45, marginBottom: 16 }}>
                고급 설정
              </p>

              {/* 야자시/조자시 */}
              <div style={{ opacity: form.unknownHour ? 0.3 : 1, pointerEvents: form.unknownHour ? 'none' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}>
                    <input type="checkbox"
                      checked={form.dayBoundaryRule === 'zi_hour'}
                      disabled={form.unknownHour}
                      onChange={e => set('dayBoundaryRule', e.target.checked ? 'zi_hour' : 'midnight')}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                    />
                    <div style={{
                      width: 36, height: 20, borderRadius: 10,
                      background: form.dayBoundaryRule === 'zi_hour' ? 'rgba(232,223,200,0.3)' : 'rgba(232,223,200,0.1)',
                      transition: 'background 0.2s', position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', top: 2, left: 2, width: 16, height: 16,
                        borderRadius: '50%', background: '#fff',
                        transition: 'transform 0.2s',
                        transform: form.dayBoundaryRule === 'zi_hour' ? 'translateX(16px)' : 'translateX(0)',
                      }} />
                    </div>
                  </label>
                  <span style={{ fontFamily: SERIF, fontSize: 14, color: INK.ink70, flex: 1 }}>
                    자시(子時) 전체를 다음날 일주로
                  </span>
                  <button type="button"
                    onClick={() => setExpandedInfo(v => v === 'zi_hour' ? null : 'zi_hour')}
                    style={{
                      color: INK.ink28, fontSize: 11, border: `1px solid ${INK.cardLine}`,
                      borderRadius: '50%', width: 20, height: 20, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: 'transparent', cursor: 'pointer', fontFamily: MONO,
                    }}>
                    ?
                  </button>
                </div>
                {expandedInfo === 'zi_hour' && (
                  <div style={{ marginTop: 10, marginLeft: 48, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontFamily: SERIF, fontSize: 12, color: INK.ink45, lineHeight: 1.7, margin: 0 }}>사주에서 하루가 언제 바뀌는지에 대한 두 가지 관법이 있어요.</p>
                    <p style={{ fontFamily: SERIF, fontSize: 12, color: INK.ink45, lineHeight: 1.7, margin: 0 }}><span style={{ color: INK.ink70 }}>기본 (진태양시 자정 기준)</span> — 태양이 정확히 자정을 넘는 순간 날짜가 바뀝니다.</p>
                    <p style={{ fontFamily: SERIF, fontSize: 12, color: INK.ink45, lineHeight: 1.7, margin: 0 }}><span style={{ color: INK.ink70 }}>이 옵션 ON (자시설)</span> — 자시(23:00~01:00 진태양시) 전체를 다음날로 봅니다.</p>
                    <p style={{ fontFamily: SERIF, fontSize: 12, color: INK.ink28, lineHeight: 1.7, margin: 0 }}>모르겠으면 그냥 꺼두세요. 자정 전후 출생이 아니면 결과가 같아요.</p>
                  </div>
                )}
              </div>

              {/* 합화 오행 변화 */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}>
                    <input type="checkbox"
                      checked={form.applyHapHwa}
                      onChange={e => set('applyHapHwa', e.target.checked)}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                    />
                    <div style={{
                      width: 36, height: 20, borderRadius: 10,
                      background: form.applyHapHwa ? 'rgba(232,223,200,0.3)' : 'rgba(232,223,200,0.1)',
                      transition: 'background 0.2s', position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', top: 2, left: 2, width: 16, height: 16,
                        borderRadius: '50%', background: '#fff',
                        transition: 'transform 0.2s',
                        transform: form.applyHapHwa ? 'translateX(16px)' : 'translateX(0)',
                      }} />
                    </div>
                  </label>
                  <span style={{ fontFamily: SERIF, fontSize: 14, color: INK.ink70, flex: 1 }}>
                    합(合)에 따른 오행 변화 반영
                  </span>
                  <button type="button"
                    onClick={() => setExpandedInfo(v => v === 'hapHwa' ? null : 'hapHwa')}
                    style={{
                      color: INK.ink28, fontSize: 11, border: `1px solid ${INK.cardLine}`,
                      borderRadius: '50%', width: 20, height: 20, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: 'transparent', cursor: 'pointer', fontFamily: MONO,
                    }}>
                    ?
                  </button>
                </div>
                {expandedInfo === 'hapHwa' && (
                  <div style={{ marginTop: 10, marginLeft: 48, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontFamily: SERIF, fontSize: 12, color: INK.ink45, lineHeight: 1.7, margin: 0 }}>사주 여덟 글자가 서로 만나 오행이 바뀌는 현상을 강도 계산에 반영해요.</p>
                    <p style={{ fontFamily: SERIF, fontSize: 12, color: INK.ink45, lineHeight: 1.7, margin: 0 }}><span style={{ color: INK.ink70 }}>천간합화</span> — 甲·己가 만나면 둘 다 土로, 乙·庚은 金으로 바뀌는 식.</p>
                    <p style={{ fontFamily: SERIF, fontSize: 12, color: INK.ink45, lineHeight: 1.7, margin: 0 }}><span style={{ color: INK.ink70 }}>지지합</span> — 子·丑(土), 寅·亥(木) 같은 짝이 나란히 있으면 합쳐진 오행의 힘이 강해져요.</p>
                    <p style={{ fontFamily: SERIF, fontSize: 12, color: INK.ink28, lineHeight: 1.7, margin: 0 }}>학파마다 적용 방식이 달라 정답은 없고, 비교해보고 더 잘 맞는 쪽을 쓰세요.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 고민/질문 */}
            <div style={{ marginTop: isMobile ? 22 : 28 }}>
              <label style={labelStyle}>
                지금 가장 궁금한 것{' '}
                <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: 1, color: INK.ink28 }}>선택</span>
              </label>
              <textarea
                placeholder={
                  selectedType === 'today' ? '오늘 중요한 일정이 있어 / 오늘 기분이 왜 이럴까?' :
                  selectedType === 'love'  ? '지금 만나는 사람이랑 잘 맞는지 궁금해 / 내가 왜 항상 이런 사람만 만날까?' :
                  '올해 이직해도 될까? / 내가 잘 할 수 있는 일이 뭔지 모르겠어'
                }
                value={form.concern}
                onChange={e => set('concern', e.target.value)}
                maxLength={200} rows={3}
                style={{ ...inputBase, resize: 'none', padding: '14px 16px' }}
              />
              <p style={{ fontFamily: MONO, fontSize: 11, color: INK.ink28, textAlign: 'right', marginTop: 6 }}>
                {form.concern.length}/200
              </p>
            </div>

            {/* Bottom hairline */}
            <div style={{
              height: 1, background: INK.hair,
              margin: `${isMobile ? 26 : 34}px 0 0`,
            }} />

            {/* Error */}
            {error && (
              <p style={{ fontFamily: SERIF, fontSize: 13, color: '#e07070', marginTop: 16 }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: isMobile ? '15px' : '17px',
                borderRadius: 10, marginTop: 16,
                background: INK.gold, color: '#1a140c',
                fontFamily: SERIF, fontWeight: 700,
                fontSize: isMobile ? 16 : 17, letterSpacing: 1,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? '읽는 중...' : (
                TYPE_META[selectedType]
                  ? `${TYPE_META[selectedType].title} 보기`
                  : '사주 보기'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
