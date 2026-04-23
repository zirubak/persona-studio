// hifi-home.jsx — 3 Apple-ish hi-fi directions for Home

(function(){
  const { tokens: T, PEOPLE: P, InitialsAv: PhotoAv, IllusAv, AppNav, Browser, Note, Kalam, Mono, Display, Btn, Eyebrow, hueBg, hueSoft } = window.HF;

  // A · QUIET HERO — Apple.com product page. One huge statement + ambient cast.
  function HomeA(){
    return (
      <Browser>
        <AppNav active="home"/>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* soft radial backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 900px 500px at 70% 10%, ${T.accentSoft} 0%, transparent 60%), radial-gradient(ellipse 700px 400px at 15% 90%, ${T.coolSoft} 0%, transparent 55%)`, pointerEvents:'none' }}/>

          <div style={{ position: 'relative', padding: '96px 120px 0', maxWidth: 1100 }}>
            <Eyebrow>Persona Studio · v0.5</Eyebrow>
            <Display size={88} weight={500} style={{ marginTop: 20, marginBottom: 24, letterSpacing: -3.5 }}>
              Rehearse tomorrow's <br/>
              meeting <span style={{ fontFamily: T.fDisplay, fontStyle: 'italic', fontWeight: 300, letterSpacing: -2 }}>today.</span>
            </Display>
            <div style={{ fontSize: 20, color: T.mute, lineHeight: 1.45, maxWidth: 620, marginBottom: 44, letterSpacing: -0.2 }}>
              Build AI avatars of the people who'll be in the room — then listen in as they argue it out.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Btn primary size="lg">Start a simulation  <span style={{ fontSize: 12, opacity:.7 }}>⌘↵</span></Btn>
              <Btn size="lg">Build an avatar →</Btn>
            </div>
          </div>

          {/* Ambient cast strip (fills bottom) */}
          <div style={{ position: 'absolute', bottom: 56, left: 0, right: 0, padding: '28px 120px 24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40 }}>
            <div>
              <Mono size={10} style={{ letterSpacing: 2, textTransform: 'uppercase' }}>YOUR CAST · 7 AVATARS</Mono>
              <div style={{ display: 'flex', marginTop: 16 }}>
                {P.slice(0,6).map((p,i) => (
                  <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -14, zIndex: 10 - i }}>
                    <PhotoAv p={p} size={52} ring/>
                  </div>
                ))}
                <div style={{ marginLeft: -14, width: 52, height: 52, borderRadius: '50%', background: T.paperSoft, border: `2px solid ${T.paper}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: T.mute, fontFamily: T.fMono }}>+1</div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <Mono size={10} style={{ letterSpacing: 2, textTransform: 'uppercase' }}>LAST RUN · 12H AGO</Mono>
              <div style={{ fontSize: 17, marginTop: 8, letterSpacing: -0.2 }}>
                "Should we ship the beta?" <span style={{ color: T.mute }}>— 3 rounds</span>
              </div>
              <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: T.cool }}/>
                <Mono size={11} color={T.cool}>Ralph 8.1 · passed</Mono>
              </div>
            </div>
          </div>

          {/* OSS footer strip — restrained, technical, pinned to bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 120px', borderTop: `1px solid ${T.hair}`, background: 'rgba(251,250,247,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 22, height: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13 }}>★</span>
              <Mono size={11} color={T.ink} style={{ letterSpacing: 0.5 }}>github.com/persona-studio/persona-studio</Mono>
              <Mono size={10} style={{ padding: '2px 7px', background: T.paperSoft, borderRadius: 3 }}>2.4k</Mono>
            </div>
            <div style={{ width: 1, height: 14, background: T.hair }}/>
            <Mono size={10} style={{ letterSpacing: 1.2 }}>ELASTIC LICENSE 2.0</Mono>
            <div style={{ width: 1, height: 14, background: T.hair }}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mono size={10} style={{ letterSpacing: 1.2 }}>CONTRIBUTORS</Mono>
              <div style={{ display: 'flex', marginLeft: 4 }}>
                {P.slice(0,5).map((p,i) => (
                  <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -6, width: 20, height: 20, borderRadius: '50%', background: hueBg(p.hue), border: `1.5px solid ${T.paper}` }}/>
                ))}
                <Mono size={10} style={{ marginLeft: 8, alignSelf: 'center' }}>+38</Mono>
              </div>
            </div>
            <div style={{ flex: 1 }}/>
            <Mono size={11} color={T.inkSoft}>Discord</Mono>
            <Mono size={11} color={T.inkSoft}>Docs</Mono>
            <Mono size={11} color={T.inkSoft}>Changelog</Mono>
            <div style={{ padding: '5px 11px', borderRadius: 6, background: T.ink, color: '#fff', fontSize: 11, fontFamily: T.fMono, letterSpacing: 0.5, cursor: 'pointer' }}>
              pnpm i persona-studio
            </div>
          </div>
        </div>
</Browser>
    );
  }

  // B · ROOM OF FACES — warm, editorial, real-photo avatars front and center
  function HomeB(){
    return (
      <Browser>
        <AppNav active="home"/>
        <div style={{ flex: 1, padding: '56px 80px', overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
            <div>
              <Kalam size={26} color={T.ink} style={{ fontFamily: T.fHand }}>Good afternoon, JH.</Kalam>
              <Display size={48} weight={500} style={{ letterSpacing: -1.5, marginTop: 4 }}>
                Who do you want to <span style={{ fontFamily: T.fDisplay, fontStyle: 'italic', fontWeight: 300 }}>hear from?</span>
              </Display>
            </div>
            <Btn>⌘K</Btn>
          </div>

          {/* Hero cast — 4 big photo cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {P.slice(0,4).map((p,i) => (
              <div key={p.id} style={{
                background: '#fff', borderRadius: 18, padding: 22, border: `1px solid ${T.hair}`,
                position: 'relative', overflow: 'hidden',
              }}>
                <PhotoAv p={p} size={72}/>
                <div style={{ fontSize: 17, fontWeight: 500, marginTop: 14, letterSpacing: -0.3 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: T.mute, marginTop: 2 }}>{p.role}</div>
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.hair}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Mono size={10}>{p.corpus} tokens</Mono>
                  <div style={{ fontSize: 18, color: T.accent }}>→</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
            <div style={{ background: T.ink, color: '#fff', borderRadius: 18, padding: 32, position: 'relative', overflow: 'hidden' }}>
              <Eyebrow color="rgba(255,255,255,0.5)">QUICKSTART</Eyebrow>
              <div style={{ fontFamily: T.fDisplay, fontStyle: 'italic', fontWeight: 300, fontSize: 32, letterSpacing: -1, lineHeight: 1.15, marginTop: 14, maxWidth: 420 }}>
                Start from three thinkers who disagree.
              </div>
              <div style={{ display: 'flex', marginTop: 24, alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex' }}>
                  {P.slice(0,3).map((p,i) => (
                    <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                      <PhotoAv p={p} size={36} ring/>
                    </div>
                  ))}
                </div>
                <Mono size={11} color="rgba(255,255,255,0.6)">pg · naval · dhh</Mono>
                <div style={{ marginLeft: 'auto', padding: '10px 18px', borderRadius: 999, background: '#fff', color: T.ink, fontSize: 13, fontWeight: 500 }}>Begin →</div>
              </div>
            </div>

            <div style={{ background: T.paperSoft, borderRadius: 18, padding: 28 }}>
              <Eyebrow>RECENT SIMULATIONS</Eyebrow>
              {[
                ['Should we ship the beta?', '12h ago · Ralph 8.1'],
                ['Mobile vs web first', '2d ago · Ralph 6.4'],
                ['Panel: hiring round 2', '5d ago · 3 iters'],
              ].map(([t, s], i) => (
                <div key={i} style={{ marginTop: 14, paddingTop: 14, borderTop: i === 0 ? 'none' : `1px solid ${T.hair}` }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t}</div>
                  <Mono size={11} style={{ marginTop: 2 }}>{s}</Mono>
                </div>
              ))}
            </div>
          </div>
        </div>
</Browser>
    );
  }

  // C · DARK COMMAND — keyboard-first, for power users
  function HomeC(){
    return (
      <Browser dark url="localhost:7777 · ⌘K">
        <AppNav active="home" dark/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, background: T.ink, color: '#fff', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 800px 500px at 50% 40%, rgba(201,100,66,0.12) 0%, transparent 60%)`, pointerEvents:'none' }}/>

          <div style={{ position: 'relative', width: 760 }}>
            <Eyebrow color="rgba(255,255,255,0.45)">PERSONA STUDIO · PRESS ⌘K</Eyebrow>
            <Display size={52} weight={400} color="#fff" style={{ marginTop: 18, marginBottom: 40, letterSpacing: -1.8 }}>
              What would you like <br/>
              to <span style={{ fontFamily: T.fDisplay, fontStyle: 'italic', fontWeight: 300, color: T.accent }}>simulate?</span>
            </Display>

            <div style={{
              padding: '18px 22px', borderRadius: 14,
              background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.1)`,
              display: 'flex', alignItems: 'center', gap: 14, backdropFilter: 'blur(8px)',
            }}>
              <span style={{ fontFamily: T.fMono, color: T.accent }}>›</span>
              <div style={{ fontSize: 17, letterSpacing: -0.2 }}>
                Simulate <span style={{ color: 'rgba(255,255,255,0.45)' }}>a meeting with</span>{' '}
                <span style={{ background: T.accent, color: '#fff', padding: '2px 8px', borderRadius: 5, fontSize: 14 }}>paul_graham</span>{' '}
                <span style={{ background: T.accent, color: '#fff', padding: '2px 8px', borderRadius: 5, fontSize: 14 }}>naval</span>{' '}
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>about</span>{' '}
                <span style={{ borderBottom: `1px dashed rgba(255,255,255,0.3)` }}>raising a seed</span>
              </div>
              <div style={{ marginLeft: 'auto', width: 1.5, height: 20, background: T.accent, animation: 'blink 1s infinite' }}/>
            </div>

            <div style={{ marginTop: 32 }}>
              {[
                ['Simulate meeting', 'paul_graham, naval_ravikant, dhh · Should we raise?', '↵', true],
                ['Simulate debate',  'jh-baek, wes-bailey · Monolith vs microservices',     '↑↵'],
                ['Create avatar',    'from podcast + linkedin',                              '⌘N'],
                ['Browse library',   '7 avatars · local',                                    '⌘L'],
              ].map(([t, s, k, active], i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  borderRadius: 10, marginTop: 4,
                  background: active ? 'rgba(201,100,66,0.12)' : 'transparent',
                  border: active ? `1px solid rgba(201,100,66,0.3)` : '1px solid transparent',
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: active ? T.accent : 'rgba(255,255,255,0.08)' }}/>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{t}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s}</div>
                  </div>
                  <Mono size={11} color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto' }}>{k}</Mono>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 40, display: 'flex', gap: 24, alignItems: 'center', color: 'rgba(255,255,255,0.4)' }}>
              <Mono size={10}>7 avatars ready</Mono>
              <Mono size={10}>·</Mono>
              <Mono size={10}>claude-sonnet-4.5</Mono>
              <Mono size={10}>·</Mono>
              <Mono size={10}>last run 12h ago</Mono>
            </div>
          </div>
        </div>
</Browser>
    );
  }

  window.HF_Home = { HomeA, HomeB, HomeC };
})();
