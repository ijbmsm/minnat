// Route-level skeleton for /saju/[type] — shown during server auth check

const INK = {
  bg:       '#0c0907',
  card:     'rgba(232,223,200,0.035)',
  cardLine: 'rgba(232,223,200,0.10)',
  hair:     'rgba(232,223,200,0.085)',
  ink45:    'rgba(232,223,200,0.42)',
  ink28:    'rgba(232,223,200,0.26)',
};

function Sk({ w, h, br = 6, style = {} }: { w: number | string; h: number; br?: number; style?: React.CSSProperties }) {
  return (
    <div className="saju-skeleton" style={{ width: w, height: h, borderRadius: br, flexShrink: 0, ...style }} />
  );
}

export default function Loading() {
  return (
    <div style={{ background: INK.bg, minHeight: '100dvh', color: INK.ink45 }}>
      {/* Nav placeholder */}
      <div style={{ height: 56, borderBottom: `1px solid ${INK.hair}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <Sk w={80} h={22} br={4} />
        <Sk w={1} h={18} style={{ background: INK.hair }} />
        <Sk w={50} h={18} br={4} />
        <Sk w={50} h={18} br={4} />
      </div>

      {/* Page body */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '36px 20px 64px', boxSizing: 'border-box' }}>
        {/* Back link */}
        <Sk w={100} h={14} br={4} style={{ marginBottom: 24 }} />

        {/* Title + subtitle */}
        <Sk w={200} h={44} br={6} style={{ marginBottom: 12 }} />
        <Sk w={260} h={18} br={4} style={{ marginBottom: 40 }} />

        {/* Form card */}
        <div style={{ border: `1px solid ${INK.cardLine}`, borderRadius: 16, padding: '28px 28px 24px', background: INK.card }}>
          {/* Two column on desktop */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Left col */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Sk w={80} h={12} br={4} />
              <Sk w="100%" h={48} br={9} />
              <div style={{ display: 'flex', gap: 12 }}>
                <Sk w="50%" h={48} br={9} />
                <Sk w="50%" h={48} br={9} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Sk w="33%" h={44} br={7} />
                <Sk w="33%" h={44} br={7} />
                <Sk w="33%" h={44} br={7} />
              </div>
            </div>
            {/* Right col */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Sk w={80} h={12} br={4} />
              <div style={{ display: 'flex', gap: 12 }}>
                <Sk w="33%" h={48} br={9} />
                <Sk w="33%" h={48} br={9} />
                <Sk w="33%" h={48} br={9} />
              </div>
              <Sk w="100%" h={48} br={9} />
              <Sk w={160} h={18} br={4} />
            </div>
          </div>

          <div style={{ height: 1, background: INK.hair, margin: '24px 0' }} />
          <Sk w="100%" h={52} br={10} />
        </div>
      </div>
    </div>
  );
}
