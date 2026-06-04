// panels.jsx — 탭별 콘텐츠. 반응형(m) + 글자/용어 탭 → 상세 시트.

const Panel = ({ children, style }) => (
  <div style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 8, background: INK.card, ...style }}>{children}</div>
);

// 년·월·일·시 순으로 (SAJU.pillars 는 시·일·월·년 순이라 뒤집어 씀)
const ymsPillars = () => [...SAJU.pillars].reverse();

// ── 격국 / 용신 / 신강 3종 ──
function MetaRow({ m }) {
  const M = SAJU.meta;
  const items = [
    { l: '격국', v: M.gyeokguk, s: '추정', c: INK.ink },
    { l: '용신 / 기신', v: `${M.yongsin} / ${M.gisin}`, s: '식상(설기)', c: OHAENG[M.yongsin].color },
    { l: '신강약', v: M.sinkang, s: `자비 ${M.jabi}%`, c: OHAENG['화'].color },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
      {items.map((f, i) => (
        <div key={f.l} style={{ padding: m ? '2px 12px' : '4px 24px', borderLeft: i ? `1px solid ${INK.hair}` : 'none' }}>
          <Term termKey={f.l}><KoLabel style={{ fontSize: m ? 9 : 10, letterSpacing: 1.5, whiteSpace: 'nowrap' }}>{f.l}</KoLabel></Term>
          <div style={{ fontSize: m ? 18 : 26, fontWeight: 600, color: f.c, marginTop: 10, whiteSpace: 'nowrap' }}>{f.v}</div>
          <div style={{ fontSize: m ? 11 : 12, color: INK.ink45, marginTop: 6 }}>{f.s}</div>
        </div>
      ))}
    </div>
  );
}

// ── 오행 가로 균형 막대 ──
function OhaengBar({ m }) {
  const O = SAJU.ohaeng;
  return (
    <div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', border: `1px solid ${INK.cardLine}` }}>
        {OH_ORDER.map((oh) => <div key={oh} style={{ width: `${O[oh]}%`, background: OHAENG[oh].color, opacity: 0.85 }} />)}
      </div>
      <div style={{ display: 'flex', marginTop: 12 }}>
        {OH_ORDER.map((oh) => (
          <div key={oh} style={{ width: `${O[oh]}%`, minWidth: m ? 38 : 46 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: OHAENG[oh].color, display: 'inline-block' }} />
              <span style={{ fontSize: m ? 13 : 14, fontWeight: 600 }}>{oh}</span>
              {!m && <span style={{ fontSize: 11, color: INK.ink45, fontFamily: '"IBM Plex Mono",monospace' }}>{O[oh]}%</span>}
            </div>
            {m && <div style={{ fontSize: 10, color: INK.ink45, fontFamily: '"IBM Plex Mono",monospace', marginLeft: 12 }}>{O[oh]}%</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 사주풀이 = 만세력 풀 테이블 ──
function ManseTab({ m }) {
  const { openDetail } = React.useContext(SajuUI);
  const P = ymsPillars();
  const gutter = m ? 52 : 86;
  const cs = m ? 30 : 46;
  const rowGrid = { display: 'grid', gridTemplateColumns: `${gutter}px repeat(4,1fr)` };
  const Cell = ({ children, style }) => (
    <div style={{ padding: m ? '10px 4px' : '12px 8px', textAlign: 'center', borderLeft: `1px solid ${INK.hair}`, ...style }}>{children}</div>
  );
  const GutterTerm = ({ children }) => (
    <div style={{ padding: m ? '10px 8px' : '12px 18px', display: 'flex', alignItems: 'center' }}>
      <Term termKey={children}><KoLabel style={{ fontSize: m ? 9.5 : 10.5 }}>{children}</KoLabel></Term></div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 14 : 20 }}>
      <Panel style={{ padding: m ? '18px 0' : '22px 0' }}><MetaRow m={m} /></Panel>

      <Panel style={{ padding: m ? 18 : 24 }}>
        <Term termKey="오행"><KoLabel style={{ color: INK.ink45 }}>오행 분포 · 五行</KoLabel></Term>
        <div style={{ marginTop: 16 }}><OhaengBar m={m} /></div>
      </Panel>

      <Panel style={{ overflow: 'hidden' }}>
        {/* 기둥 라벨 */}
        <div style={{ ...rowGrid, borderBottom: `1px solid ${INK.hair}` }}>
          <div />
          {P.map((p) => (
            <div key={p.gan} style={{ padding: '11px 0', textAlign: 'center', borderLeft: `1px solid ${INK.hair}`,
              background: p.self ? 'rgba(194,163,91,0.05)' : 'transparent' }}>
              <KoLabel style={{ fontSize: 10, letterSpacing: 1.5 }}>{p.gan}</KoLabel>
              {!m && <div style={{ fontSize: 10, color: INK.ink28, marginTop: 2 }}>{p.role}</div>}
            </div>
          ))}
        </div>
        {/* 천간 */}
        <div style={{ ...rowGrid, borderBottom: `1px solid ${INK.hair}` }}>
          <GutterTerm>천간</GutterTerm>
          {P.map((p) => (
            <Cell key={p.gan} style={{ background: p.self ? 'rgba(194,163,91,0.04)' : 'transparent' }}>
              <div style={{ fontSize: m ? 10 : 11, color: INK.ink45 }}>{p.sipGan}</div>
              <TapChar ch={p.gan_ch} oh={p.gan_oh} size={cs} onTap={() => openDetail(buildGan(p))} />
              {!m && <div style={{ fontSize: 10, color: INK.ink28 }}>{p.gan_oh} · {p.gan_mean}</div>}
            </Cell>
          ))}
        </div>
        {/* 지지 */}
        <div style={{ ...rowGrid, borderBottom: `1px solid ${INK.hair}` }}>
          <GutterTerm>지지</GutterTerm>
          {P.map((p) => (
            <Cell key={p.gan} style={{ background: p.self ? 'rgba(194,163,91,0.04)' : 'transparent' }}>
              <TapChar ch={p.ji_ch} oh={p.ji_oh} size={cs} onTap={() => openDetail(buildJi(p))} />
              <div style={{ fontSize: 10, color: INK.ink28, marginTop: 2 }}>{p.ji_oh} · {p.animal}</div>
              <div style={{ fontSize: m ? 10 : 11, color: INK.ink45, marginTop: 3 }}>{p.sipJi}</div>
            </Cell>
          ))}
        </div>
        {/* 운성 */}
        <div style={{ ...rowGrid, borderBottom: `1px solid ${INK.hair}` }}>
          <GutterTerm>운성</GutterTerm>
          {P.map((p) => (
            <Cell key={p.gan}><span style={{ fontSize: m ? 13 : 15, color: p.unseong === '장생' ? OHAENG['목'].color : INK.ink70 }}>{p.unseong}</span></Cell>
          ))}
        </div>
        {/* 지장간 */}
        <div style={{ ...rowGrid, borderBottom: `1px solid ${INK.hair}` }}>
          <GutterTerm>지장간</GutterTerm>
          {P.map((p) => (
            <Cell key={p.gan} style={{ padding: m ? '11px 4px' : '14px 8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                {p.jijang.map((j, k) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: m ? 14 : 17, fontWeight: 500, color: INK.ink }}>{j[0]}</span>
                    <span style={{ fontSize: 10, color: INK.ink28, fontFamily: '"IBM Plex Mono",monospace' }}>{j[1]}</span>
                  </div>
                ))}
              </div>
            </Cell>
          ))}
        </div>
        {/* 통근 */}
        <div style={rowGrid}>
          <GutterTerm>통근</GutterTerm>
          {P.map((p) => (
            <Cell key={p.gan}><span style={{ fontSize: m ? 12 : 14, color: p.tonggeun === '—' ? INK.ink28 : INK.ink70 }}>{p.tonggeun}</span></Cell>
          ))}
        </div>
        {/* 사령신 메타 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: m ? 10 : 16, padding: m ? '13px 16px' : '15px 18px',
          borderTop: `1px solid ${INK.hair}`, fontSize: m ? 11.5 : 12.5, color: INK.ink45, alignItems: 'baseline' }}>
          <span><Term termKey="사령신">사령신</Term> <b style={{ color: OHAENG['목'].color }}>{SAJU.detail.saryeong}</b></span>
          {SAJU.detail.hap.map((h) => <span key={h}>· {h}</span>)}
          <span>· 공망 {SAJU.detail.gongmang}</span>
          <span>· 신살 {SAJU.detail.sinsal}</span>
        </div>
      </Panel>

      {/* 강점 / 주의 */}
      <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: m ? 12 : 16 }}>
        <Panel style={{ padding: 22, borderLeft: `2px solid ${OHAENG['목'].color}` }}>
          <KoLabel style={{ fontSize: 10, color: OHAENG['목'].color }}>강점</KoLabel>
          <div style={{ fontSize: 15, lineHeight: 1.65, color: INK.ink, marginTop: 8 }}>{SAJU.trait.strong}</div>
        </Panel>
        <Panel style={{ padding: 22, borderLeft: `2px solid ${OHAENG['화'].color}` }}>
          <KoLabel style={{ fontSize: 10, color: OHAENG['화'].color }}>주의</KoLabel>
          <div style={{ fontSize: 15, lineHeight: 1.65, color: INK.ink, marginTop: 8 }}>{SAJU.trait.weak}</div>
        </Panel>
      </div>
    </div>
  );
}

// ── AI 탭 ──
function AiTab({ m }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 12 : 16 }}>
      {SAJU.ai.map((a) => (
        <Panel key={a.no} style={{ padding: m ? 20 : 28, display: 'flex', gap: m ? 14 : 22 }}>
          <Mono style={{ color: INK.gold, fontSize: 13, flex: '0 0 auto', paddingTop: 4 }}>{a.no}</Mono>
          <div>
            <div style={{ fontSize: m ? 16 : 18, fontWeight: 600, color: INK.ink, marginBottom: 10 }}>{a.tag}</div>
            <div style={{ fontSize: m ? 14.5 : 15.5, lineHeight: 1.8, color: INK.ink70 }}>{a.body}</div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

// ── 오행 탭 ──
const OH_MEAN = {
  목: '배움·성장·확장의 기운. 나무처럼 위로 뻗으려 해.',
  화: '표현·열정·예의 기운. 등불처럼 주변을 밝혀.',
  토: '안정·중재·신뢰의 기운. 흩어진 걸 모아 현실로 굳혀.',
  금: '결단·정리·원칙의 기운. 쇠처럼 끊고 다듬어.',
  수: '지혜·유연·소통의 기운. 물처럼 낮은 곳으로 흘러.',
};
function OhaengTab({ m }) {
  const O = SAJU.ohaeng;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 12 : 16 }}>
      <Panel style={{ padding: m ? 20 : 28 }}>
        <KoLabel style={{ color: INK.ink45 }}>오행의 균형 · 五行</KoLabel>
        <div style={{ marginTop: 20 }}><OhaengBar m={m} /></div>
        <p style={{ marginTop: 22, fontSize: m ? 14 : 15, lineHeight: 1.75, color: INK.ink70, textWrap: 'pretty' }}>
          <span style={{ color: OHAENG['목'].color, fontWeight: 600 }}>목(나무)</span>이 절반을 넘어 압도적이야 —
          끊임없이 배우고 사색하려는 기운. 용신인 <span style={{ color: OHAENG['토'].color, fontWeight: 600 }}>토(흙)</span>가
          6%로 약해서, 생각을 현실로 착지시키는 덴 의식적인 노력이 필요해.
        </p>
      </Panel>
      <Panel style={{ overflow: 'hidden' }}>
        {OH_ORDER.map((oh, i) => (
          <div key={oh} style={{ display: 'flex', alignItems: 'center', gap: m ? 14 : 20, padding: m ? '15px 18px' : '18px 26px',
            borderTop: i ? `1px solid ${INK.hair}` : 'none' }}>
            <div style={{ width: m ? 40 : 52, textAlign: 'center', flex: '0 0 auto' }}>
              <div style={{ fontSize: m ? 24 : 28, fontWeight: 600, color: OHAENG[oh].color, lineHeight: 1 }}>{oh}</div>
              <div style={{ fontSize: 11, color: INK.ink28, fontFamily: '"IBM Plex Mono",monospace', marginTop: 3 }}>{OHAENG[oh].han}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(232,223,200,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${O[oh]}%`, height: '100%', background: OHAENG[oh].color, opacity: 0.85, borderRadius: 4 }} />
                </div>
                <span style={{ width: 40, textAlign: 'right', fontSize: 14, fontFamily: '"IBM Plex Mono",monospace',
                  color: O[oh] >= 40 ? OHAENG[oh].color : INK.ink45 }}>{O[oh]}%</span>
              </div>
              <div style={{ fontSize: m ? 12.5 : 13.5, color: INK.ink70, marginTop: 8 }}>{OH_MEAN[oh]}</div>
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}

// ── 대운 탭 ──
function DaeunTab({ m }) {
  const { openDetail } = React.useContext(SajuUI);
  const D = SAJU.daeun, meta = SAJU.daeunMeta;
  return (
    <Panel style={{ padding: m ? 20 : 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22, gap: 8, flexWrap: 'wrap' }}>
        <Term termKey="대운"><KoLabel style={{ color: INK.ink45, whiteSpace: 'nowrap' }}>대운 · 大運 — 10년의 흐름</KoLabel></Term>
        <Mono style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{meta.dir} · 대운수 {meta.su} · {meta.note}</Mono>
      </div>
      <div style={{ display: m ? 'flex' : 'grid', gridTemplateColumns: `repeat(${D.length},1fr)`, gap: 10,
        overflowX: m ? 'auto' : 'visible', scrollbarWidth: 'none', paddingBottom: m ? 4 : 0 }}>
        {D.map((d) => {
          const cur = d.age === meta.currentAge;
          return (
            <div key={d.age} onClick={() => openDetail({
              head: `${d.gan}${d.ji}`, han: null, oh: d.gan_oh, chips: [`${d.age}세 ~ ${d.age + 9}세`, cur ? '현재 대운' : '대운'],
              blocks: [{ label: `천간 ${d.gan} — ${d.sipGan}`, text: SIPSIN[d.sipGan] || '' }, { label: `지지 ${d.ji} — ${d.sipJi}`, text: SIPSIN[d.sipJi] || '' }] })}
              style={{ borderRadius: 6, overflow: 'hidden', textAlign: 'center', cursor: 'pointer',
                flex: m ? '0 0 96px' : 'auto',
                border: `1px solid ${cur ? INK.gold + '88' : INK.hair}`,
                background: cur ? 'rgba(194,163,91,0.07)' : 'transparent' }}>
              <div style={{ padding: '8px 0', borderBottom: `1px solid ${INK.hair}` }}>
                <span style={{ fontSize: 13, fontFamily: '"IBM Plex Mono",monospace', color: cur ? INK.gold : INK.ink45 }}>{d.age}세</span>
                {cur && <div style={{ fontSize: 9, color: INK.gold, letterSpacing: 1, marginTop: 1 }}>현재</div>}
              </div>
              <div style={{ padding: '12px 0 6px' }}>
                <div style={{ fontSize: 12, color: INK.ink45 }}>{d.sipGan}</div>
                <div style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.2, color: OHAENG[d.gan_oh].color }}>{d.gan}</div>
                <div style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.2, color: OHAENG[d.ji_oh].color }}>{d.ji}</div>
                <div style={{ fontSize: 12, color: INK.ink45, margin: '4px 0 12px' }}>{d.sipJi}</div>
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ marginTop: 22, fontSize: m ? 14 : 14.5, lineHeight: 1.75, color: INK.ink70 }}>
        지금은 <b style={{ color: INK.gold }}>28세 갑자(甲子) 대운</b> 한가운데 —
        정인 기운이 강하게 들어와 배우고 깊이 파고드는 시기야. 자수(子水) 편관이 함께라
        책임과 압박도 같이 커지니, 벌이기보다 <b>한 우물을 깊게 파는 선택</b>이 잘 맞아.
      </p>
    </Panel>
  );
}

// ── 올해 탭 ──
function OlhaeTab({ m }) {
  const y = SAJU.seun[0], next = SAJU.seun[1];
  const flow = SAJU.ai.find((a) => a.no === '04');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 12 : 16 }}>
      <Panel style={{ padding: m ? 22 : 28, display: 'flex', flexDirection: m ? 'column' : 'row',
        gap: m ? 20 : 30, alignItems: m ? 'stretch' : 'center' }}>
        <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontFamily: '"IBM Plex Mono",monospace', color: INK.ink70 }}>{y.year}</span>
            <span style={{ fontSize: 11, color: INK.gold, letterSpacing: 1 }}>올해</span>
          </div>
          <div style={{ fontSize: 64, fontWeight: 500, lineHeight: 1.1, marginTop: 6 }}>
            <span style={{ color: OHAENG['화'].color }}>{y.gan}</span><span style={{ color: OHAENG['화'].color }}>{y.ji}</span>
          </div>
          <div style={{ fontSize: 13, color: INK.ink45, marginTop: 4 }}>{y.sipGan} · {y.sipJi}</div>
        </div>
        <div style={{ width: m ? '100%' : 1, height: m ? 1 : 'auto', alignSelf: 'stretch', background: INK.hair }} />
        <div>
          <div style={{ fontSize: m ? 16 : 18, fontWeight: 600, marginBottom: 10 }}>{flow.tag}</div>
          <p style={{ fontSize: m ? 14.5 : 15.5, lineHeight: 1.8, color: INK.ink70, margin: 0, textWrap: 'pretty' }}>{flow.body}</p>
        </div>
      </Panel>
      <Panel style={{ padding: m ? '18px 22px' : '20px 28px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <KoLabel style={{ fontSize: 10 }}>다음 해 미리보기</KoLabel>
          <div style={{ fontSize: 13, color: INK.ink45, marginTop: 6 }}>{next.sipGan} · {next.sipJi} — 한결 차분해지는 흐름</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 13, fontFamily: '"IBM Plex Mono",monospace', color: INK.ink45 }}>{next.year}</span>
          <span style={{ fontSize: 30, fontWeight: 500, whiteSpace: 'nowrap' }}>
            <span style={{ color: OHAENG['화'].color }}>{next.gan}</span> {next.ji}</span>
        </div>
      </Panel>
    </div>
  );
}

// ── 궁합 탭 (입력 유도 빈 상태) ──
function GunghapTab({ m }) {
  return (
    <Panel style={{ padding: m ? '48px 22px' : '64px 28px', textAlign: 'center' }}>
      <Seal ch="合" size={52} />
      <div style={{ fontSize: m ? 18 : 20, fontWeight: 600, marginTop: 22 }}>궁합 볼 상대를 더해줘</div>
      <p style={{ fontSize: m ? 14 : 15, lineHeight: 1.75, color: INK.ink70, maxWidth: 420, margin: '12px auto 28px' }}>
        상대의 생년월일과 태어난 시를 입력하면, 두 사람의 오행이 어떻게 만나고 부딪히는지 읽어줄게.
      </p>
      <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 12, letterSpacing: 1, color: INK.ink45, whiteSpace: 'nowrap',
          border: `1px solid ${INK.cardLine}`, borderRadius: 6, padding: '12px 20px' }}>생년월일 · 시 입력</span>
        <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 12, letterSpacing: 1, color: INK.bg, whiteSpace: 'nowrap',
          background: INK.gold, borderRadius: 6, padding: '12px 22px', fontWeight: 600 }}>궁합 보기</span>
      </div>
    </Panel>
  );
}

Object.assign(window, { Panel, MetaRow, OhaengBar, ManseTab, AiTab, OhaengTab, DaeunTab, OlhaeTab, GunghapTab });
