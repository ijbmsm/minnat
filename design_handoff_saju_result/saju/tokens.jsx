// tokens.jsx — 사주 리디자인: 디자인 토큰 + 유승민 사주 데이터 + 공용 원자(atom)들
// 한지/먹 다크 베이스, 채도 낮춘 오방색 오행.

// ─────────────────────────────────────────────────────────────
// 색 — 먹빛 베이스 + 한지 본문 + 채도 낮춘 오방색 오행
// ─────────────────────────────────────────────────────────────
const INK = {
  bg:        '#0c0907',   // 먹 종이
  bgRaise:   '#14100c',   // 살짝 든 면
  card:      'rgba(232,223,200,0.035)',
  cardLine:  'rgba(232,223,200,0.10)',
  hair:      'rgba(232,223,200,0.085)',
  ink:       'rgba(232,223,200,0.94)',   // 본문 (한지빛)
  ink70:     'rgba(232,223,200,0.66)',
  ink45:     'rgba(232,223,200,0.42)',
  ink28:     'rgba(232,223,200,0.26)',
  gold:      '#c2a35b',   // 인장/강조 (주묵 대신 금니 느낌)
};

// 오행 — 전통 오방색 기반, 채도 확 낮춤 (먹에 풀어놓은 안료)
const OHAENG = {
  목: { ko: '목', han: '木', color: '#7e9a6f', soft: 'rgba(126,154,111,0.16)', label: '나무' },
  화: { ko: '화', han: '火', color: '#c4685a', soft: 'rgba(196,104,90,0.16)',  label: '불'   },
  토: { ko: '토', han: '土', color: '#c0974f', soft: 'rgba(192,151,79,0.16)',  label: '흙'   },
  금: { ko: '금', han: '金', color: '#c9c2ad', soft: 'rgba(201,194,173,0.14)', label: '쇠'   },
  수: { ko: '수', han: '水', color: '#6f88a6', soft: 'rgba(111,136,166,0.16)', label: '물'   },
};
const OH_ORDER = ['목', '화', '토', '금', '수'];

// ─────────────────────────────────────────────────────────────
// 유승민 — 1999.04.04 5시 / 남  (스크린샷에서 정리)
// ─────────────────────────────────────────────────────────────
const SAJU = {
  name: '유승민',
  sex: '남',
  birth: '1999. 04. 04',
  time: '인시 · 05',

  // 일간
  ilgan: {
    char: '정', han: '丁', oh: '화',
    title: '등불·촛불',
    line: '촛불처럼 작지만 강렬해. 한 가지에 깊이 파고드는 사람.',
    sub: '겉보기엔 조용한데 혼자 생각은 엄청 많이 함.',
    keywords: ['집중력', '감성', '섬세'],
  },

  // 상단 요약 3종
  meta: {
    gyeokguk: '편인격',
    yongsin: '토',
    gisin: '수',
    yong_note: '식상으로 기운을 덜어내야 흐름이 풀려',
    sinkang: '신강',
    jabi: 25,
  },

  // 오행 분포 (%)
  ohaeng: { 목: 54, 화: 25, 토: 6, 금: 8, 수: 7 },

  // 사주 8자 — 시·일·월·년 순으로 보여줌 (한국식 우→좌)
  // pos: 십신(천간) / 천간 / 천간오행 / 지지 / 지지오행 / 동물 / 십신(지지)
  pillars: [
    { gan: '시주', role: '활동·미래', sipGan: '정관', gan_ch: '임', gan_oh: '수', gan_mean: '큰 강·바다',
      ji_ch: '인', ji_oh: '목', animal: '호랑이', sipJi: '정인', unseong: '병',
      jijang: [['무','여'],['병','중'],['갑','정']], tonggeun: '—' },
    { gan: '일주', role: '나 자신', self: true, sipGan: '일간', gan_ch: '정', gan_oh: '화', gan_mean: '등불·촛불',
      ji_ch: '유', ji_oh: '금', animal: '닭', sipJi: '편재', unseong: '장생',
      jijang: [['경','여'],['신','정']], tonggeun: '인' },
    { gan: '월주', role: '환경·사회', sipGan: '비견', gan_ch: '정', gan_oh: '화', gan_mean: '등불·촛불',
      ji_ch: '묘', ji_oh: '목', animal: '토끼', sipJi: '편인', unseong: '병',
      jijang: [['갑','여'],['을','정']], tonggeun: '인' },
    { gan: '년주', role: '뿌리·조상', sipGan: '식신', gan_ch: '기', gan_oh: '토', gan_mean: '논밭·평지',
      ji_ch: '묘', ji_oh: '목', animal: '토끼', sipJi: '편인', unseong: '병',
      jijang: [['갑','여'],['을','정']], tonggeun: '인' },
  ],

  // 만세력 디테일 (마니아용 펼치기)
  detail: {
    saryeong: '을(목) 정기 · 29일 경과',
    hap: ['정임합 → 목', '묘유충'],
    gongmang: '진 · 사',
    sinsal: '천을귀인 (유)',
  },

  // 세운
  seun: [
    { year: '2026', tag: '올해', gan: '병', ji: '오', sipGan: '겁재', sipJi: '겁재' },
    { year: '2027', tag: null,   gan: '정', ji: '미', sipGan: '비견', sipJi: '식신' },
  ],

  // 대운 (역행 · 대운수 8 · 추정)
  daeunMeta: { dir: '역행', su: 8, note: '추정', currentAge: 28 },
  daeun: [
    { age: 8,  gan: '병', gan_oh: '화', ji: '인', ji_oh: '목', sipGan: '겁재', sipJi: '정인' },
    { age: 18, gan: '을', gan_oh: '목', ji: '축', ji_oh: '토', sipGan: '편인', sipJi: '식신' },
    { age: 28, gan: '갑', gan_oh: '목', ji: '자', ji_oh: '수', sipGan: '정인', sipJi: '편관' },
    { age: 38, gan: '계', gan_oh: '수', ji: '해', ji_oh: '수', sipGan: '편관', sipJi: '정관' },
    { age: 48, gan: '임', gan_oh: '수', ji: '술', ji_oh: '토', sipGan: '정관', sipJi: '상관' },
    { age: 58, gan: '신', gan_oh: '금', ji: '유', ji_oh: '금', sipGan: '편재', sipJi: '편재' },
    { age: 68, gan: '경', gan_oh: '금', ji: '신', ji_oh: '금', sipGan: '정재', sipJi: '정재' },
  ],

  // 강점 / 주의
  trait: {
    strong: '집중력, 정교함, 진심. 한번 믿으면 끝까지 가.',
    weak:   '걱정이 많은 편. 상처를 깊게 받고 오래 기억해.',
  },

  // AI 해석 — 메인엔 1줄 요약, 펼치면 본문
  ai: [
    { no: '01', tag: '나라는 사람',
      summary: '지식 욕심 많고 사색형. 생각이 현실로 착지되는 덴 시간이 걸려.',
      body: '정화의 등불 같은 에너지인데, 겉으론 차분해 보여도 속은 굉장히 활발해. 편인이 2개나 되고 목 세력이 54%로 압도적이라 끊임없이 배우고 사색하려는 성향이 있어. 근데 신강이면서 토(용신)가 약해서, 그 모든 생각이 현실로 착지되는 덴 시간이 걸려. 정 일간의 따뜻함과 꼼꼼함이 있으니 한번 마음먹으면 신중하게 접근해.' },
    { no: '02', tag: '연애',
      summary: '감정을 깊게 나누고 싶은 타입. 책임감이 커서 자기 표현은 뒤로 밀려.',
      body: '연애에서 감정을 깊이 나누고 싶어 해. 임수 정관이 시주에 있어 관계에 책임감을 크게 느끼고, 상대를 챙기느라 자기 감정 표현은 뒤로 밀리기 쉬워. 묘유충이 걸려 변수가 많고 흔들리는 시기엔 관계 자체를 의심하게 되는 면이 있어.' },
    { no: '03', tag: '직업·재물',
      summary: '창의·사색형 일에서 빛나. 돈은 한곳에 모이기보다 여러 곳으로 흐르는 편.',
      body: '편인이 강하니 학문·기획·창작·상담처럼 자기만의 관점을 만드는 일에서 빛나. 식상(토)이 용신이면서 약해 아이디어를 현금화하는 과정에서 답답함을 느껴. 재물은 한곳에 모이기보다 여러 곳에서 조금씩 흐르기 쉬우니 돈 관리는 더 의식적으로 해야 해.' },
    { no: '04', tag: '2026 흐름',
      summary: '겁재의 해. 도전심은 살지만 금전·동업은 신중하게.',
      body: '2026 병오는 천간·지지 모두 겁재가 작용하는 해야. 도전심과 외향성이 살아나는 대신 주관이 강해져 충돌하기 쉽고, 돈이 새는 기운이 있어 동업·금전 거래는 신중해야 해. 새 분야에 발 들일 기회는 충분하니 신중함과 도전을 적절히 섞어 움직이면 좋은 결과를 만들 수 있어.' },
  ],
};

// ─────────────────────────────────────────────────────────────
// 한지 텍스처 — 캔버스 1회 생성 → CSS dataURL
// ─────────────────────────────────────────────────────────────
let _hanji = null;
function hanjiURL() {
  if (_hanji) return _hanji;
  const size = 460;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  x.fillStyle = '#0c0907';
  x.fillRect(0, 0, size, size);
  for (let i = 0; i < 90; i++) {
    const px = Math.random() * size, py = Math.random() * size;
    const len = 24 + Math.random() * 120, a = Math.random() * Math.PI * 2;
    const g = 44 + Math.random() * 26;
    x.strokeStyle = `rgba(${g},${g - 6},${g - 16},${0.03 + Math.random() * 0.05})`;
    x.lineWidth = 0.4 + Math.random() * 0.7;
    x.beginPath(); x.moveTo(px, py);
    x.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); x.stroke();
  }
  const img = x.getImageData(0, 0, size, size);
  for (let i = 0; i < 1500; i++) {
    const px = Math.floor(Math.random() * size), py = Math.floor(Math.random() * size);
    const idx = (py * size + px) * 4;
    const b = Math.random() < 0.85 ? 9 + Math.random() * 14 : 24 + Math.random() * 30;
    img.data[idx] = Math.min(255, img.data[idx] + b);
    img.data[idx + 1] = Math.min(255, img.data[idx + 1] + b * 0.92);
    img.data[idx + 2] = Math.min(255, img.data[idx + 2] + b * 0.78);
  }
  x.putImageData(img, 0, 0);
  _hanji = c.toDataURL('image/png');
  return _hanji;
}

// ─────────────────────────────────────────────────────────────
// 공용 원자 — 모노 라벨, 한자 인장, 머리글, 얇은 구분선
// ─────────────────────────────────────────────────────────────
const Mono = ({ children, style }) => (
  <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, letterSpacing: 2.2,
    textTransform: 'uppercase', color: INK.ink45, ...style }}>{children}</span>
);

const KoLabel = ({ children, style }) => (
  <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: 3,
    color: INK.ink45, ...style }}>{children}</span>
);

// 작은 한자 인장 (붉은 도장 대신 금니 외곽선)
const Seal = ({ ch, size = 34, color = INK.gold }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: size, height: size, borderRadius: 5, flex: '0 0 auto',
    border: `1px solid ${color}55`, color: color,
    fontFamily: '"Noto Serif KR", serif', fontSize: size * 0.52, fontWeight: 500,
  }}>{ch}</span>
);

// 섹션 머리글: 한국어 + 모노 부제 + 얇은 줄
const SectionHead = ({ ko, en, num }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 22 }}>
    {num && <Mono style={{ color: INK.ink28, fontSize: 11 }}>{num}</Mono>}
    <span style={{ fontFamily: '"Noto Serif KR", serif', fontSize: 19, fontWeight: 600,
      color: INK.ink, letterSpacing: 0.5 }}>{ko}</span>
    <Mono style={{ fontSize: 10 }}>{en}</Mono>
    <div style={{ flex: 1, height: 1, background: INK.hair, alignSelf: 'center' }} />
  </div>
);

const Hair = ({ style }) => <div style={{ height: 1, background: INK.hair, ...style }} />;

// ─────────────────────────────────────────────────────────────
// 반응형 훅 + UI 컨텍스트 (모바일 여부 + 상세 시트 열기)
// ─────────────────────────────────────────────────────────────
function useIsMobile(bp = 760) {
  const [m, setM] = React.useState(typeof window !== 'undefined' && window.innerWidth < bp);
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp - 1}px)`);
    const h = () => setM(mq.matches); h();
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [bp]);
  return m;
}
const SajuUI = React.createContext({ m: false, openDetail: () => {} });

Object.assign(window, { INK, OHAENG, OH_ORDER, SAJU, hanjiURL, Mono, KoLabel, Seal, SectionHead, Hair, useIsMobile, SajuUI });
