// hifi-live.jsx — The core experience: 3 takes on parallel-speaking avatars

(function(){
  const { tokens: T, PEOPLE: P, InitialsAv: PhotoAv, AppNav, Browser, Note, Kalam, Mono, Wave, Btn, Eyebrow, hueBg, hueSoft, hueDeep } = window.HF;

  // Shared: top bar for live view
  const LiveTopBar = ({ dark, elapsed = '00:04:12' }) => (
    <div style={{
      padding: '18px 32px', display: 'flex', alignItems: 'center', gap: 20,
      borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : T.hair}`,
      background: dark ? T.ink : T.paper, color: dark ? '#fff' : T.ink,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent, boxShadow: `0 0 0 4px ${T.accent}33` }}/>
        <Mono size={11} color={T.accent} style={{ letterSpacing: 2 }}>LIVE</Mono>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2 }}>Mobile vs web first in 2026</div>
        <div style={{ display: 'flex', gap: 14, marginTop: 2 }}>
          <Mono size={10} color={dark ? 'rgba(255,255,255,0.5)' : T.mute}>MEETING</Mono>
          <Mono size={10} color={dark ? 'rgba(255,255,255,0.5)' : T.mute}>ITER 1/3</Mono>
          <Mono size={10} color={dark ? 'rgba(255,255,255,0.5)' : T.mute}>TURN 3/8</Mono>
          <Mono size={10} color={dark ? 'rgba(255,255,255,0.5)' : T.mute}>{elapsed}</Mono>
        </div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <div style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, color: dark ? 'rgba(255,255,255,0.7)' : T.mute, border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : T.hair}` }}>Pause</div>
        <div style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, color: dark ? '#fff' : T.ink, border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : T.ink}` }}>Interrupt</div>
        <div style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, color: '#fff', background: T.accent }}>End</div>
      </div>
    </div>
  );

  // Pane: one avatar's live box
  const LivePane = ({ p, state, text, round = 3, dark }) => {
    const active = state === 'speaking';
    const pending = state === 'thinking';
    const c = hueBg(p.hue);
    const deep = hueDeep(p.hue);

    return (
      <div style={{
        position: 'relative', padding: 24, borderRadius: 16,
        background: dark ? (active ? `linear-gradient(180deg, ${c}22 0%, rgba(255,255,255,0.02) 100%)` : 'rgba(255,255,255,0.03)') : (active ? '#fff' : T.paperSoft),
        border: `1.5px solid ${active ? c : (dark ? 'rgba(255,255,255,0.08)' : T.hair)}`,
        boxShadow: active ? `0 8px 40px ${c}22, 0 0 0 4px ${dark ? c + '18' : c + '18'}` : 'none',
        display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden',
        transition: 'all .2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <PhotoAv p={p} size={44} ring={active}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: dark ? '#fff' : T.ink, letterSpacing: -0.2 }}>{p.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? c : (pending ? T.accent : (dark ? 'rgba(255,255,255,0.3)' : T.mute)) }}/>
              <Mono size={10} color={active ? deep : (dark ? 'rgba(255,255,255,0.5)' : T.mute)}>
                {active ? 'SPEAKING' : pending ? 'THINKING' : 'IDLE'}
              </Mono>
            </div>
          </div>
          {active && <Wave color={c} height={22}/>}
        </div>

        <div style={{ flex: 1, fontSize: 15, lineHeight: 1.55, color: dark ? (active ? '#fff' : 'rgba(255,255,255,0.55)') : (active ? T.ink : T.mute), fontFamily: T.fDisplay, fontWeight: 300, letterSpacing: -0.2, minHeight: 0, overflow: 'hidden' }}>
          {text}
          {active && <span style={{ display: 'inline-block', width: 2, height: 16, background: c, verticalAlign: 'middle', marginLeft: 3 }}/>}
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : T.hair}`, display: 'flex', gap: 14, alignItems: 'center' }}>
          <Mono size={10} color={dark ? 'rgba(255,255,255,0.4)' : T.mute}>R{round}</Mono>
          <div style={{ flex: 1, height: 2, background: dark ? 'rgba(255,255,255,0.06)' : T.hair, borderRadius: 1, overflow: 'hidden' }}>
            {active && <div style={{ width: '34%', height: '100%', background: c }}/>}
          </div>
          <Mono size={10} color={dark ? 'rgba(255,255,255,0.4)' : T.mute}>{active ? '12s' : pending ? '—' : '1m 40s'}</Mono>
        </div>
      </div>
    );
  };

  // A · PANEL GRID (tmux-like, dark, for developers)
  function LiveA(){
    return (
      <Browser dark url="localhost:7777 · simulation/20260421T140412">
        <AppNav active="sim" dark/>
        <LiveTopBar dark/>
        <div style={{ flex: 1, padding: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, background: T.ink, minHeight: 0 }}>
          <LivePane p={P[0]} state="speaking" dark
            text={'"Most of what sounds sophisticated about mobile-first is just imitation. If two of you can\'t ship a web app in a weekend, two of you can\'t ship an iOS app in a month. Start where friction is lowest."'} />
          <LivePane p={P[1]} state="thinking" dark
            text={'(drafting — leverage angle, compounding returns of web distribution…)'} />
          <LivePane p={P[2]} state="idle" dark
            text={'"Monoliths ship. Whatever the form. Next."'} />
        </div>

        {/* Facilitator bar */}
        <div style={{ padding: '14px 32px', background: '#0f0d0b', borderTop: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', gap: 20, color: 'rgba(255,255,255,0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: `conic-gradient(from 180deg, ${T.accent}, ${T.cool}, ${T.accent})` }}/>
            <Mono size={11} color="#fff">FACILITATOR</Mono>
          </div>
          <div style={{ fontSize: 12 }}>calling on Naval next · OK to go long on the leverage angle</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 18 }}>
            <div><Mono size={10}>AVG LATENCY</Mono> <Mono size={11} color="#fff">7.2s</Mono></div>
            <div><Mono size={10}>TOKENS</Mono> <Mono size={11} color="#fff">4.1k</Mono></div>
            <div><Mono size={10}>MODEL</Mono> <Mono size={11} color="#fff">sonnet-4.5</Mono></div>
          </div>
        </div>
        <Note top={18} right={40} rot={2} w={150} arrow>
          closest to tmux.<br/>still legible on<br/>a laptop screen.
        </Note>
      </Browser>
    );
  }

  // B · ROUND TABLE — spatial metaphor, spotlight moves to speaker
  function LiveB(){
    const order = [0, 1, 2, 3]; // 4 seats
    const speakingIdx = 0;
    return (
      <Browser>
        <AppNav active="sim"/>
        <LiveTopBar/>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
          {/* Stage */}
          <div style={{ position: 'relative', padding: 40, background: `radial-gradient(ellipse 800px 500px at 50% 50%, ${T.paperSoft} 0%, ${T.paper} 70%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* the table ellipse */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 440, height: 240, borderRadius: 220, border: `1.5px solid ${T.hair}`, background: '#fff', boxShadow: `0 24px 80px ${T.paperDeep}80` }}>
              <div style={{ position: 'absolute', inset: 20, borderRadius: 200, border: `1px dashed ${T.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <Kalam size={15} color={T.mute}>the table</Kalam>
                  <div style={{ fontFamily: T.fDisplay, fontStyle: 'italic', fontWeight: 300, fontSize: 22, letterSpacing: -0.5, marginTop: 4 }}>
                    "Mobile vs web <br/>first, 2026?"
                  </div>
                </div>
              </div>
            </div>

            {/* Seats */}
            {[
              { p: P[0], top: '10%', left: '35%', state: 'speaking' },
              { p: P[1], top: '10%', right: '35%', state: 'thinking' },
              { p: P[2], bottom: '10%', left: '35%', state: 'idle' },
              { p: P[3], bottom: '10%', right: '35%', state: 'idle' },
            ].map(({ p, state, ...pos }, i) => {
              const active = state === 'speaking';
              return (
                <div key={i} style={{ position: 'absolute', ...pos, transform: 'translate(-50%, 0)', textAlign: 'center', width: 140 }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <PhotoAv p={p} size={active ? 88 : 68} ring={active}/>
                    {active && (
                      <>
                        <div style={{ position: 'absolute', inset: -14, borderRadius: '50%', border: `1.5px solid ${hueBg(p.hue)}`, animation: 'ring 2s ease-out infinite' }}/>
                        <div style={{ position: 'absolute', inset: -22, borderRadius: '50%', border: `1px solid ${hueBg(p.hue)}66` }}/>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 10 }}>{p.name}</div>
                  <Mono size={9} color={active ? hueDeep(p.hue) : T.mute}>
                    {active ? '● SPEAKING' : state.toUpperCase()}
                  </Mono>
                  {active && (
                    <div style={{ marginTop: 10, padding: 12, background: '#fff', borderRadius: 12, border: `1.5px solid ${hueBg(p.hue)}`, fontFamily: T.fDisplay, fontWeight: 300, fontSize: 13, lineHeight: 1.5, letterSpacing: -0.2, textAlign: 'left' }}>
                      "Ship where friction is lowest. If you can't put a web app on a laptop by Friday, you won't ship an iOS app in a month."
                    </div>
                  )}
                </div>
              );
            })}

            {/* Facilitator chip */}
            <div style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 8px 8px', background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 999 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `conic-gradient(from 180deg, ${T.accent}, ${T.cool}, ${T.accent})` }}/>
              <Mono size={10}>FACILITATOR · claude</Mono>
            </div>
          </div>

          {/* Transcript rail */}
          <div style={{ borderLeft: `1px solid ${T.hair}`, padding: 24, background: T.paper, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <Eyebrow>TRANSCRIPT · LIVE</Eyebrow>
            <div style={{ marginTop: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { p: P[2], t: '"Monoliths ship. Whatever the form. Start."', time: '04:08' },
                { p: P[1], t: '"But distribution matters. The web compounds — an app store doesn\'t."', time: '04:02' },
                { p: P[0], t: '"Build where friction is lowest. Mobile-first is often just imitation."', time: '03:48', active: true },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, opacity: m.active ? 1 : 0.55 }}>
                  <PhotoAv p={m.p} size={28}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{m.p.name.split(' ')[0]}</div>
                      <Mono size={9}>{m.time}</Mono>
                    </div>
                    <div style={{ fontFamily: T.fDisplay, fontWeight: 300, fontSize: 14, lineHeight: 1.5, letterSpacing: -0.1, marginTop: 4 }}>{m.t}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${T.hair}`, display: 'flex', justifyContent: 'space-between' }}>
              <Mono size={10}>3 TURNS · 4.1K TOK</Mono>
              <Mono size={10} color={T.cool}>RALPH DRAFT 6.8</Mono>
            </div>
          </div>
        </div>
        <Note top={90} right={410} rot={-3} w={140} arrow>
          spatial metaphor.<br/>you feel who's<br/>talking to whom.
        </Note>
      </Browser>
    );
  }

  // C · CARDS + TRANSCRIPT RIVER — everyone visible, transcript scrolls below
  function LiveC(){
    const pane = P.slice(0,3);
    return (
      <Browser>
        <AppNav active="sim"/>
        <LiveTopBar/>
        <div style={{ flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0, overflow: 'hidden', background: T.paper }}>
          {/* Top: horizontal cast strip with live states */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pane.length}, 1fr)`, gap: 16 }}>
            {[
              { p: P[0], state: 'speaking' },
              { p: P[1], state: 'thinking' },
              { p: P[2], state: 'idle' },
            ].map(({ p, state }, i) => {
              const active = state === 'speaking';
              const pending = state === 'thinking';
              const c = hueBg(p.hue);
              return (
                <div key={i} style={{
                  padding: 20, background: '#fff', borderRadius: 16,
                  border: `1.5px solid ${active ? c : T.hair}`,
                  boxShadow: active ? `0 0 0 4px ${c}20` : 'none',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <PhotoAv p={p} size={56} ring={active}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: T.mute, marginTop: 1 }}>{p.role}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? c : (pending ? T.accent : T.mute) }}/>
                      <Mono size={9} color={active ? hueDeep(p.hue) : T.mute}>
                        {active ? 'SPEAKING · 0:12' : pending ? 'DRAFTING REPLY' : 'HAS SPOKEN'}
                      </Mono>
                    </div>
                  </div>
                  {active && <Wave color={c} height={26} bars={11}/>}
                </div>
              );
            })}
          </div>

          {/* Transcript river */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 16, border: `1px solid ${T.hair}`, padding: '28px 36px', overflow: 'auto', minHeight: 0 }}>
            <Eyebrow>TRANSCRIPT</Eyebrow>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 22 }}>
              {[
                { p: P[2], time: '00:03:48', t: 'Monoliths ship. Mobile vs web, whatever — pick the one you can ship by Friday. The conversation is always which one is "the future" but the actual question is which one you can put in a user\'s hands in a week.' },
                { p: P[1], time: '00:04:02', t: 'Distribution compounds. An App Store listing is a cold start; a web URL you can put in a tweet tomorrow. Early on, you want the shortest path between an idea and a first hundred users.' },
                { p: P[0], time: '00:04:12', active: true, t: 'Most of what sounds sophisticated about mobile-first is just imitation. If two of you can\'t ship a web app in a weekend, two of you can\'t ship an iOS app in a month. Start where friction is lowest, not where fashion is highest.' },
              ].map((m, i) => {
                const c = hueBg(m.p.hue);
                return (
                  <div key={i} style={{ display: 'flex', gap: 18, opacity: m.active ? 1 : 0.72 }}>
                    <div style={{ width: 80, flexShrink: 0 }}>
                      <PhotoAv p={m.p} size={40} ring={m.active}/>
                      <div style={{ fontSize: 12, fontWeight: 500, marginTop: 8 }}>{m.p.name.split(' ')[0]}</div>
                      <Mono size={9}>{m.time}</Mono>
                    </div>
                    <div style={{ flex: 1, borderLeft: `2px solid ${m.active ? c : T.hair}`, paddingLeft: 20, fontFamily: T.fDisplay, fontWeight: 300, fontSize: 18, lineHeight: 1.55, letterSpacing: -0.3, color: m.active ? T.ink : T.inkSoft }}>
                      "{m.t}"
                      {m.active && <span style={{ display: 'inline-block', width: 2, height: 18, background: c, verticalAlign: 'middle', marginLeft: 4 }}/>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Facilitator */}
          <div style={{ padding: '14px 20px', background: T.paperSoft, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: `conic-gradient(from 180deg, ${T.accent}, ${T.cool}, ${T.accent})` }}/>
            <div style={{ fontSize: 13 }}>Facilitator <span style={{ color: T.mute }}>· next: Naval · probe leverage</span></div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
              <Mono size={10}>TURN 3 / 8</Mono>
              <Mono size={10} color={T.cool}>RALPH DRAFT 6.8</Mono>
            </div>
          </div>
        </div>
        <Note top={120} right={28} rot={3} w={150}>
          readable,<br/>quotable.<br/>feels editorial.
        </Note>
      </Browser>
    );
  }

  window.HF_Live = { LiveA, LiveB, LiveC };
})();
