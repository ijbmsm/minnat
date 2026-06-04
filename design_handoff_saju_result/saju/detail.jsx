// detail.jsx — 용어 사전 + 탭하면 뜨는 상세 시트(데스크탑 우측 드로어 / 모바일 바텀시트)

// ── 십신 ──
const SIPSIN = {
  비견: '나와 같은 기운. 자존심·독립심·경쟁심. 형제·동료 같은 존재야.',
  겁재: '나와 같지만 음양이 달라. 추진력·승부욕이 세지만 재물은 새기 쉬워.',
  식신: '내가 자연스레 내놓는 기운. 표현·먹을복·꾸준함. 한 우물 파는 재능.',
  상관: '톡톡 튀는 표현력. 재주 많고 비판적이라 틀을 깨는 힘이 있어.',
  편재: '넓게 흐르는 재물. 융통성·사업수완. 큰 돈을 굴려보는 기질.',
  정재: '착실히 모으는 재물. 성실·안정. 내 몫을 지키는 기운.',
  편관: '나를 강하게 누르는 압력. 결단·카리스마가 있지만 스트레스도 커.',
  정관: '책임·명예·규범. 자기를 다스리는 기운. 직장·관직과 인연이 깊어.',
  편인: '독특한 사고와 직관. 학문·기획·창작에서 남다른 관점을 만들어.',
  정인: '배움과 보호받는 기운. 인내·인덕. 꾸준히 받쳐주는 뿌리야.',
  일간: '사주의 주인공, 바로 나 자신. 모든 해석의 기준점이 되는 글자.',
};

// ── 천간 / 지지 ──
const CHEONGAN = {
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
const JIJI = {
  자: { han: '子', oh: '수', animal: '쥐' }, 축: { han: '丑', oh: '토', animal: '소' },
  인: { han: '寅', oh: '목', animal: '호랑이' }, 묘: { han: '卯', oh: '목', animal: '토끼' },
  진: { han: '辰', oh: '토', animal: '용' }, 사: { han: '巳', oh: '화', animal: '뱀' },
  오: { han: '午', oh: '화', animal: '말' }, 미: { han: '未', oh: '토', animal: '양' },
  신: { han: '申', oh: '금', animal: '원숭이' }, 유: { han: '酉', oh: '금', animal: '닭' },
  술: { han: '戌', oh: '토', animal: '개' }, 해: { han: '亥', oh: '수', animal: '돼지' },
};

// ── 자리(궁) 의미 ──
const ROLE = {
  년주: '뿌리·조상·어린 시절. 내가 자란 큰 배경의 자리.',
  월주: '환경·사회·부모. 직업과 사회생활이 드러나는 자리.',
  일주: '나 자신과 배우자. 사주의 중심이 되는 자리.',
  시주: '활동·미래·자식. 말년과 결실을 보는 자리.',
};

// ── 운성(12운성) · 일반 용어 ──
const UNSEONG = {
  장생: '갓 태어난 기운. 새 출발·성장이 시작되는 자리.',
  병: '기세가 한풀 꺾여 안으로 무르익는 자리.',
};
const GLOSS = {
  격국: { sub: '格局', body: '사주 전체의 짜임새이자 그릇. 어떤 유형의 사람인지를 보는 큰 틀이야.' },
  용신: { sub: '用神', body: '사주의 균형을 잡아주는 약(藥) 같은 오행. 이 기운이 살아야 흐름이 풀려.' },
  '용신 / 기신': { sub: '用神 / 忌神', body: '용신은 나를 돕는 약 같은 오행, 기신은 그 반대로 해치는 오행이야. 용신이 살고 기신이 잠잠하면 흐름이 좋아.' },
  기신: { sub: '忌神', body: '용신을 해치는 오행. 이 기운이 강해지는 시기엔 조심하는 게 좋아.' },
  신강약: { sub: '身强弱', body: '일간(나)의 힘이 센지 약한지를 보는 거야. 신강은 주체가 강한 상태.' },
  지장간: { sub: '支藏干', body: '지지 속에 숨어있는 천간들. 겉으론 안 보여도 속에서 작용해 — 여기·중기·정기 순서야.' },
  통근: { sub: '通根', body: '천간이 지지에 뿌리를 내렸는지 보는 거야. 뿌리가 있으면 그 기운이 든든해져.' },
  운성: { sub: '十二運星', body: '천간이 지지를 만나 갖는 기운의 세기. 사람의 일생처럼 장생→병→사…로 흘러.' },
  사령신: { sub: '司令神', body: '태어난 달, 그 시점에 실제로 힘을 잡고 있는 기운이야.' },
  오행: { sub: '五行', body: '목·화·토·금·수 다섯 기운. 이 다섯의 많고 적음이 사주의 색을 정해.' },
  세운: { sub: '歲運', body: '한 해 한 해의 운. 올해 어떤 기운이 들어오는지 보는 거야.' },
  대운: { sub: '大運', body: '10년 단위로 바뀌는 큰 흐름. 인생의 계절 같은 거야.' },
};

// ── 상세 payload 빌더 ──
function buildGan(p) {
  const c = CHEONGAN[p.gan_ch] || {};
  return {
    head: p.gan_ch, han: c.han, oh: p.gan_oh,
    chips: [`${p.gan_oh} · ${c.yy === '양' ? '양(陽)' : '음(陰)'}`, c.img || p.gan_mean],
    blocks: [
      { label: `십신 — ${p.sipGan}`, text: SIPSIN[p.sipGan] || '' },
      { label: `${p.gan} · 천간`, text: ROLE[p.gan] || '' },
    ],
  };
}
function buildJi(p) {
  const c = JIJI[p.ji_ch] || {};
  return {
    head: p.ji_ch, han: c.han, oh: p.ji_oh,
    chips: [`${p.ji_oh} · 지지`, `${c.animal || p.animal}띠`],
    blocks: [
      { label: `십신 — ${p.sipJi}`, text: SIPSIN[p.sipJi] || '' },
      { label: `${p.gan} · 지지`, text: ROLE[p.gan] || '' },
      { label: '지장간', text: '이 지지 속에 숨은 천간: ' + p.jijang.map((j) => `${j[0]}(${j[1]})`).join(' · ') },
    ],
  };
}
function buildTerm(key, valueOverride) {
  const g = GLOSS[key] || UNSEONG[key] && { sub: '', body: UNSEONG[key] } || { sub: '', body: '' };
  return { head: valueOverride || key, han: g.sub, oh: null, chips: g.sub ? [g.sub] : [], blocks: [{ label: key, text: g.body }] };
}

// ── 탭 가능한 용어 (점선 밑줄 + ⓘ) ──
function Term({ termKey, children, style }) {
  const { openDetail } = React.useContext(SajuUI);
  return (
    <span onClick={(e) => { e.stopPropagation(); openDetail(buildTerm(termKey, typeof children === 'string' ? children : undefined)); }}
      style={{ cursor: 'pointer', borderBottom: `1px dotted ${INK.ink28}`, ...style }}>{children}</span>
  );
}

// ── 상세 시트 ──
function DetailSheet({ data, onClose }) {
  const { m } = React.useContext(SajuUI);
  const [show, setShow] = React.useState(false);
  React.useEffect(() => { if (data) requestAnimationFrame(() => setShow(true)); else setShow(false); }, [data]);
  React.useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  if (!data) return null;
  const accent = data.oh ? OHAENG[data.oh].color : INK.gold;

  const panelBase = {
    position: 'fixed', background: '#100c09', zIndex: 200,
    border: `1px solid ${INK.cardLine}`, boxShadow: '0 -10px 60px rgba(0,0,0,.6), 0 10px 60px rgba(0,0,0,.6)',
    fontFamily: '"Noto Serif KR", serif', color: INK.ink, boxSizing: 'border-box',
    transition: 'transform .26s cubic-bezier(.2,.7,.3,1)',
  };
  const panelStyle = m
    ? { ...panelBase, left: 0, right: 0, bottom: 0, borderRadius: '16px 16px 0 0', padding: '14px 22px 30px',
        maxHeight: '86vh', overflowY: 'auto', transform: show ? 'translateY(0)' : 'translateY(101%)' }
    : { ...panelBase, top: 0, bottom: 0, right: 0, width: 440, borderRadius: '0', padding: '34px 36px',
        overflowY: 'auto', transform: show ? 'translateX(0)' : 'translateX(101%)' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 199,
      background: 'rgba(8,6,4,.62)', backdropFilter: 'blur(3px)',
      opacity: show ? 1 : 0, transition: 'opacity .26s' }}>
      <div onClick={(e) => e.stopPropagation()} style={panelStyle}>
        {m && <div style={{ width: 40, height: 4, borderRadius: 2, background: INK.ink28, margin: '0 auto 18px' }} />}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: m ? 0 : -10 }}>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: INK.ink45,
            fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 4 }}>×</button>
        </div>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ fontSize: 72, lineHeight: 0.9, fontWeight: 500, color: accent,
            textShadow: data.oh ? `0 0 44px ${OHAENG[data.oh].soft}` : 'none' }}>{data.head}</span>
          {data.han && <span style={{ fontSize: 30, fontWeight: 300, color: INK.ink45 }}>{data.han}</span>}
        </div>
        {data.chips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 16 }}>
            {data.chips.map((ch, i) => (
              <span key={i} style={{ fontSize: 12.5, color: INK.ink70, border: `1px solid ${INK.cardLine}`,
                borderRadius: 20, padding: '5px 13px' }}>{ch}</span>
            ))}
          </div>
        )}
        {/* 블록 */}
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {data.blocks.filter((b) => b.text).map((b, i) => (
            <div key={i}>
              <KoLabel style={{ fontSize: 10.5, color: accent }}>{b.label}</KoLabel>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: INK.ink, margin: '8px 0 0', textWrap: 'pretty' }}>{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 탭 가능한 글자 (천간/지지) ──
function TapChar({ ch, oh, size, onTap }) {
  return (
    <span onClick={(e) => { e.stopPropagation(); onTap(); }}
      style={{ display: 'inline-block', cursor: 'pointer', fontSize: size, fontWeight: 500,
        lineHeight: 1.15, color: OHAENG[oh].color, transition: 'text-shadow .15s', borderRadius: 4 }}
      onMouseEnter={(e) => (e.currentTarget.style.textShadow = `0 0 22px ${OHAENG[oh].soft}`)}
      onMouseLeave={(e) => (e.currentTarget.style.textShadow = 'none')}>{ch}</span>
  );
}

Object.assign(window, { SIPSIN, CHEONGAN, JIJI, ROLE, UNSEONG, GLOSS, buildGan, buildJi, buildTerm, Term, TapChar, DetailSheet });
