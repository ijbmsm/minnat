// Route-level skeleton for /saju/view/[id] — public share page

const INK = {
  bg:    '#0c0907',
  hair:  'rgba(232,223,200,0.085)',
  ink45: 'rgba(232,223,200,0.42)',
};

function Sk({ w, h, br = 6, style = {} }: { w: number | string; h: number; br?: number; style?: React.CSSProperties }) {
  return (
    <div className="saju-skeleton" style={{ width: w, height: h, borderRadius: br, flexShrink: 0, ...style }} />
  );
}

function SectionSk() {
  return (
    <div style={{
      padding: 20, borderRadius: 8,
      background: 'rgba(250,248,243,0.06)',
      border: '1px solid rgba(232,223,200,0.08)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <Sk w={80} h={10} br={3} />
      <Sk w="100%" h={14} br={4} />
      <Sk w="90%" h={14} br={4} />
      <Sk w="75%" h={14} br={4} />
    </div>
  );
}

export default function Loading() {
  return (
    <div style={{ background: INK.bg, minHeight: '100dvh', color: INK.ink45 }}>
      <div style={{ height: 56, borderBottom: `1px solid ${INK.hair}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <Sk w={80} h={22} br={4} />
        <Sk w={1} h={18} style={{ background: INK.hair }} />
        <Sk w={50} h={18} br={4} />
        <Sk w={50} h={18} br={4} />
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '36px 20px 64px', boxSizing: 'border-box' }}>
        <Sk w={100} h={14} br={4} style={{ marginBottom: 24 }} />
        <Sk w={220} h={44} br={6} style={{ marginBottom: 12 }} />
        <Sk w={280} h={18} br={4} style={{ marginBottom: 40 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => <SectionSk key={i} />)}
        </div>
      </div>
    </div>
  );
}
