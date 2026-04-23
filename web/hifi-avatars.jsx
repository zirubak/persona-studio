// hifi-avatars.jsx — exploration of 3 avatar treatments side-by-side

(function(){
  const { tokens: T, PEOPLE: P, PhotoAv, InitialsAv, IllusAv, Kalam, Mono, Eyebrow, hueBg, hueSoft, hueDeep } = window.HF;

  function AvatarExplorations(){
    const people = P.slice(0, 4);
    return (
      <div style={{ padding: 48, background: T.paper, height: '100%', fontFamily: T.fSans, color: T.ink }}>
        <Eyebrow>AVATAR TREATMENT · 3 DIRECTIONS</Eyebrow>
        <div style={{ fontFamily: T.fDisplay, fontSize: 38, letterSpacing: -1.2, fontWeight: 400, marginTop: 10, marginBottom: 8 }}>
          How should faces <span style={{ fontStyle: 'italic', fontWeight: 300 }}>feel?</span>
        </div>
        <div style={{ fontSize: 14, color: T.mute, marginBottom: 36, maxWidth: 560, lineHeight: 1.5 }}>
          Placeholders below — real photos drop into the same slots. The choice sets the whole product's temperature.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {/* A · Duotone photo placeholder */}
          <div style={{ padding: 28, background: '#fff', borderRadius: 18, border: `1.5px solid ${T.ink}` }}>
            <Mono size={10} color={T.accent} style={{ letterSpacing: 2 }}>A · DUOTONE PHOTO</Mono>
            <div style={{ fontFamily: T.fDisplay, fontSize: 24, letterSpacing: -0.6, marginTop: 8, marginBottom: 20 }}>Cinematic. Moody.</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {people.map(p => (
                <div key={p.id} style={{ textAlign: 'center' }}>
                  <PhotoAv p={p} size={84}/>
                  <Mono size={10} style={{ marginTop: 8, display: 'block' }}>{p.name.split(' ')[0]}</Mono>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: T.mute, marginTop: 20, lineHeight: 1.5 }}>
              Per-person hue as the mid-tone. Real headshots drop in at publication time; same mask applied for consistency.
            </div>
            <Kalam size={13} style={{ marginTop: 14, display: 'block' }}>← recommended</Kalam>
          </div>

          {/* B · Soft watercolor illustrated */}
          <div style={{ padding: 28, background: '#fff', borderRadius: 18, border: `1px solid ${T.hair}` }}>
            <Mono size={10} style={{ letterSpacing: 2 }}>B · ILLUSTRATED INITIAL</Mono>
            <div style={{ fontFamily: T.fDisplay, fontSize: 24, letterSpacing: -0.6, marginTop: 8, marginBottom: 20 }}>Editorial. Calm.</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {people.map(p => (
                <div key={p.id} style={{ textAlign: 'center' }}>
                  <IllusAv p={p} size={84}/>
                  <Mono size={10} style={{ marginTop: 8, display: 'block' }}>{p.name.split(' ')[0]}</Mono>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: T.mute, marginTop: 20, lineHeight: 1.5 }}>
              Serif italic initials on a pale wash. Good for product without any photos; feels like a book title page.
            </div>
          </div>

          {/* C · Solid chip initials */}
          <div style={{ padding: 28, background: '#fff', borderRadius: 18, border: `1px solid ${T.hair}` }}>
            <Mono size={10} style={{ letterSpacing: 2 }}>C · SOLID CHIP</Mono>
            <div style={{ fontFamily: T.fDisplay, fontSize: 24, letterSpacing: -0.6, marginTop: 8, marginBottom: 20 }}>Utility. Snappy.</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {people.map(p => (
                <div key={p.id} style={{ textAlign: 'center' }}>
                  <InitialsAv p={p} size={84}/>
                  <Mono size={10} style={{ marginTop: 8, display: 'block' }}>{p.name.split(' ')[0]}</Mono>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: T.mute, marginTop: 20, lineHeight: 1.5 }}>
              Today's wireframe default. Honest, fast, no pretension — but fights the premium typography.
            </div>
          </div>
        </div>

        {/* Size ladder */}
        <div style={{ marginTop: 40, padding: 28, background: T.paperSoft, borderRadius: 18 }}>
          <Eyebrow>SIZE LADDER · DUOTONE (A)</Eyebrow>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
            {[28, 40, 56, 80, 120, 180].map(s => (
              <div key={s} style={{ textAlign: 'center' }}>
                <PhotoAv p={P[0]} size={s}/>
                <Mono size={9} style={{ marginTop: 8, display: 'block' }}>{s}px</Mono>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  window.HF_Avatars = { AvatarExplorations };
})();
