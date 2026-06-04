// saju-app.jsx — 탭 셸 + 반응형 + 상세 시트(컨텍스트 제공) + 글자 탭

const TABS = [
  { id: 'ai', ko: 'AI', mark: '✦' },
  { id: 'manse', ko: '사주풀이' },
  { id: 'ohaeng', ko: '오행' },
  { id: 'daeun', ko: '대운' },
  { id: 'olhae', ko: '올해' },
  { id: 'gunghap', ko: '궁합' },
];

// 탭 가능한 글자 (천간/지지) — detail.jsx 의 전역 TapChar 사용

// 원국 — 사주 8자 (시·일·월·년)
function WonGuk({ m }) {
  const { openDetail } = React.useContext(SajuUI);
  const cs = m ? 30 : 42;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: m ? 6 : 10 }}>
      {SAJU.pillars.map((p) => (
        <div key={p.gan} style={{ borderRadius: 6, overflow: 'hidden',
          border: `1px solid ${p.self ? INK.gold + '55' : INK.hair}` }}>
          <div style={{ textAlign: 'center', padding: '9px 0', background: p.self ? 'rgba(194,163,91,0.06)' : 'rgba(232,223,200,0.02)' }}>
            <KoLabel style={{ fontSize: 9.5, letterSpacing: 1.5 }}>{p.gan}</KoLabel>
            {!m && <div style={{ fontSize: 9.5, color: INK.ink28, marginTop: 2 }}>{p.role}</div>}
          </div>
          <div style={{ textAlign: 'center', padding: m ? '8px 0 9px' : '10px 0 12px' }}>
            <div style={{ fontSize: 11, color: INK.ink45 }}>{p.sipGan}</div>
            <TapChar ch={p.gan_ch} oh={p.gan_oh} size={cs} onTap={() => openDetail(buildGan(p))} />
            <div style={{ fontSize: 10, color: INK.ink28 }}>{p.gan_oh}</div>
          </div>
          <Hair />
          <div style={{ textAlign: 'center', padding: m ? '9px 0 8px' : '12px 0 11px' }}>
            <TapChar ch={p.ji_ch} oh={p.ji_oh} size={cs} onTap={() => openDetail(buildJi(p))} />
            <div style={{ fontSize: 10, color: INK.ink28, marginTop: 2 }}>{p.ji_oh} · {p.animal}</div>
            <div style={{ fontSize: 11, color: INK.ink45, marginTop: 4 }}>{p.sipJi}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SajuApp() {
  const m = useIsMobile();
  const [tab, setTab] = React.useState('manse');
  const [detail, setDetail] = React.useState(null);
  const S = SAJU;

  const ctx = React.useMemo(() => ({ m, openDetail: setDetail }), [m]);

  const PANELS = { ai: AiTab, manse: ManseTab, ohaeng: OhaengTab, daeun: DaeunTab, olhae: OlhaeTab, gunghap: GunghapTab };
  const Active = PANELS[tab];
  const pad = m ? '20px 15px 48px' : '40px 44px 64px';

  return (
    <SajuUI.Provider value={ctx}>
      <div style={{ minHeight: '100vh', background: INK.bg, display: 'flex', justifyContent: 'center',
        fontFamily: '"Noto Serif KR", serif', color: INK.ink }}>
        <div style={{ width: '100%', maxWidth: 1180, padding: pad, boxSizing: 'border-box' }}>

          {/* 톱 바 */}
          <div style={{ display: 'flex', alignItems: m ? 'flex-start' : 'center', justifyContent: 'space-between',
            flexDirection: m ? 'column' : 'row', gap: m ? 12 : 0,
            paddingBottom: m ? 18 : 22, borderBottom: `1px solid ${INK.hair}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', minWidth: 0 }}>
              <span style={{ fontSize: m ? 20 : 22, fontWeight: 600, letterSpacing: 1, whiteSpace: 'nowrap' }}>{S.name}</span>
              <Mono style={{ fontSize: m ? 10 : 11, whiteSpace: 'nowrap' }}>{S.sex} · {S.birth} · {S.time}</Mono>
            </div>
            <div style={{ display: 'flex', gap: 8, flex: '0 0 auto', alignSelf: m ? 'stretch' : 'auto' }}>
              {['카드 공유', '다시 입력'].map((t) => (
                <span key={t} style={{ flex: m ? 1 : '0 0 auto', textAlign: 'center',
                  fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, whiteSpace: 'nowrap',
                  letterSpacing: 1, color: INK.ink45, border: `1px solid ${INK.cardLine}`, padding: '7px 13px', borderRadius: 4 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* 원국 — 일간 + 사주 8자 (항상 보임) */}
          <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '380px 1fr',
            gap: m ? 14 : 24, alignItems: 'stretch', marginTop: m ? 18 : 28 }}>
            <Panel style={{ padding: m ? 22 : 26, display: 'flex', flexDirection: 'column' }}>
              <KoLabel style={{ color: INK.ink45 }}>나의 핵심 · 日干</KoLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <span style={{ fontSize: m ? 72 : 88, lineHeight: 0.85, fontWeight: 500, color: OHAENG[S.ilgan.oh].color,
                  textShadow: `0 0 50px ${OHAENG[S.ilgan.oh].soft}` }}>{S.ilgan.char}</span>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 300, color: INK.ink70 }}>{S.ilgan.han}</div>
                  <div style={{ fontSize: 13.5, color: INK.ink70, marginTop: 6 }}>{S.ilgan.title}</div>
                </div>
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.65, margin: '16px 0 10px', color: INK.ink }}>{S.ilgan.line}</p>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 16px', color: INK.ink45, fontStyle: 'italic' }}>“{S.ilgan.sub}”</p>
              <div style={{ display: 'flex', gap: 7, marginTop: 'auto', flexWrap: 'wrap' }}>
                {S.ilgan.keywords.map((k) => (
                  <span key={k} style={{ fontSize: 12.5, color: INK.ink70, border: `1px solid ${INK.cardLine}`,
                    borderRadius: 20, padding: '5px 12px', whiteSpace: 'nowrap' }}>{k}</span>
                ))}
              </div>
            </Panel>
            <Panel style={{ padding: m ? 16 : 22 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
                <KoLabel style={{ color: INK.ink45 }}>사주 여덟 글자 · 命式</KoLabel>
                <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9.5, letterSpacing: 1, color: INK.ink28 }}>
                  글자를 누르면 뜻이 나와 ⓘ</span>
              </div>
              <WonGuk m={m} />
            </Panel>
          </div>

          {/* 탭 바 (모바일: 가로 스크롤) */}
          <div style={{ display: 'flex', gap: 4, marginTop: m ? 22 : 32, padding: 5, borderRadius: 10,
            border: `1px solid ${INK.cardLine}`, background: 'rgba(232,223,200,0.02)',
            overflowX: m ? 'auto' : 'visible', scrollbarWidth: 'none' }}>
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  flex: m ? '0 0 auto' : 1, cursor: 'pointer', border: 'none', borderRadius: 7,
                  padding: m ? '10px 16px' : '12px 8px', whiteSpace: 'nowrap',
                  fontFamily: '"Noto Serif KR", serif', fontSize: m ? 14 : 15, fontWeight: on ? 600 : 400,
                  letterSpacing: 0.5, transition: 'background-color .18s, color .18s',
                  backgroundColor: on ? 'rgba(232,223,200,0.10)' : 'rgba(0,0,0,0)',
                  color: on ? INK.ink : INK.ink45,
                  boxShadow: on ? `inset 0 0 0 1px ${INK.cardLine}` : 'none' }}>
                  {t.mark && <span style={{ color: INK.gold, marginRight: 6, fontSize: 13 }}>{t.mark}</span>}
                  {t.ko}
                </button>
              );
            })}
          </div>

          {/* 탭 콘텐츠 */}
          <div style={{ marginTop: m ? 16 : 24 }}>
            <Active m={m} />
          </div>
        </div>
      </div>

      <DetailSheet data={detail} onClose={() => setDetail(null)} />
    </SajuUI.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SajuApp />);
