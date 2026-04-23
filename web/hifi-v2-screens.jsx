// hifi-v2-screens.jsx — missing screens (Detail · Create · Setup · Settings)
// Also re-wraps approved screens so every PhotoAv becomes InitialsAv via HF.Av.

(function(){
  const { tokens: T, PEOPLE: P, InitialsAv: Av, AppNav, Browser, Note, Kalam, Mono, Display, Btn, Eyebrow, hueBg, hueSoft, hueDeep, RalphRing, Wave } = window.HF;

  // ── Avatar Detail ────────────────────────────────────────────
  function DetailScreen({ onNav }){
    const p = P[0];
    return (
      <Browser>
        <AppNav active="library"/>
        <div style={{ flex: 1, overflow: 'auto', padding: '40px 72px' }}>
          <div onClick={() => onNav && onNav('library')} style={{ cursor: 'pointer', display: 'inline-block' }}>
            <Mono color={T.mute}>← Library</Mono>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 60, marginTop: 28 }}>
            <div>
              <Av p={p} size={140}/>
              <Eyebrow style={{ marginTop: 24 }}>AVATAR · PUBLIC</Eyebrow>
              <div style={{ fontFamily: T.fDisplay, fontSize: 40, letterSpacing: -1.3, fontWeight: 400, lineHeight: 1.05, marginTop: 10 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 14, color: T.mute, marginTop: 6 }}>{p.role} · b. {p.born}</div>
              <div style={{ marginTop: 24, fontFamily: T.fMono, fontSize: 11, color: T.mute, lineHeight: 1.8 }}>
                mode · public<br/>
                corpus · {p.corpus} tokens<br/>
                created · 2026-04-19<br/>
                last edit · v7 (2h ago)
              </div>
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Btn accent size="md" style={{ justifyContent: 'center' }} >Start simulation →</Btn>
                <Btn size="md" style={{ justifyContent: 'center' }}>Edit persona</Btn>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', gap: 28, borderBottom: `1px solid ${T.hair}`, marginBottom: 28 }}>
                {['Voice','Experiences','Positions','Corpus','Raw files'].map((t,i) => (
                  <div key={t} style={{ padding: '14px 0', fontSize: 13, fontWeight: i === 0 ? 500 : 400, color: i === 0 ? T.ink : T.mute, borderBottom: i === 0 ? `2px solid ${T.accent}` : 'none', marginBottom: -1 }}>{t}</div>
                ))}
              </div>

              <Eyebrow>SIGNATURE PHRASINGS</Eyebrow>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, marginBottom: 36 }}>
                {['make something people want','default alive or default dead','ramen profitable','schlep blindness','the wave of the future','this is going to sound counterintuitive'].map(t => (
                  <div key={t} style={{ fontSize: 13, padding: '8px 14px', borderRadius: 999, background: '#fff', border: `1px solid ${T.hair}`, fontFamily: T.fDisplay, fontWeight: 300 }}>"{t}"</div>
                ))}
              </div>

              <Eyebrow>RHETORICAL FRAME</Eyebrow>
              <div style={{ fontFamily: T.fDisplay, fontWeight: 300, fontSize: 20, lineHeight: 1.55, letterSpacing: -0.2, marginTop: 14, marginBottom: 36, color: T.inkSoft }}>
                Plain-spoken. Starts small, lands a surprising claim, backs it with a concrete founder he watched. Avoids jargon; treats "monetize" as tell.
              </div>

              <Eyebrow>WHAT HE AVOIDS</Eyebrow>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                {['jargon','decks','"monetize"','frameworks in caps','acronyms'].map(t => (
                  <div key={t} style={{ fontSize: 12, padding: '5px 12px', border: `1px dashed ${T.hair}`, borderRadius: 4, color: T.mute, fontFamily: T.fMono }}>{t}</div>
                ))}
              </div>

              <div style={{ marginTop: 48, padding: '20px 24px', background: T.paperSoft, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13 }}>In <b>4 simulations</b> · avg Ralph 7.6</div>
                <Btn size="sm">History →</Btn>
              </div>
            </div>
          </div>
        </div>
      </Browser>
    );
  }

  // ── Create Avatar ────────────────────────────────────────────
  function CreateScreen({ onNav }){
    return (
      <Browser>
        <AppNav active="create"/>
        <div style={{ flex: 1, overflow: 'auto', padding: '60px 120px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 880 }}>
            <Eyebrow>NEW AVATAR</Eyebrow>
            <div style={{ fontFamily: T.fDisplay, fontSize: 52, letterSpacing: -1.8, fontWeight: 400, lineHeight: 1.05, marginTop: 14, marginBottom: 12 }}>
              Who do you want <span style={{ fontStyle: 'italic', fontWeight: 300 }}>to simulate?</span>
            </div>
            <div style={{ fontSize: 16, color: T.mute, marginBottom: 40, maxWidth: 560, lineHeight: 1.5 }}>
              Choose a starting point. You can always mix both later.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ padding: 32, background: '#fff', border: `1.5px solid ${T.ink}`, borderRadius: 18, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 20, right: 20, width: 10, height: 10, borderRadius: '50%', background: T.accent }}/>
                <Mono size={10} color={T.accent} style={{ letterSpacing: 2 }}>MODE · PRIVATE</Mono>
                <div style={{ fontFamily: T.fDisplay, fontSize: 28, letterSpacing: -0.8, fontWeight: 400, marginTop: 14, marginBottom: 12 }}>
                  Your files.
                </div>
                <div style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.55, marginBottom: 22 }}>
                  Upload PDFs, audio, transcripts, URLs. Stays local. Best for colleagues, interviewers, yourself.
                </div>
                <div style={{ padding: 16, borderRadius: 10, background: T.paperSoft, fontFamily: T.fMono, fontSize: 11, color: T.mute, lineHeight: 1.8, marginBottom: 20 }}>
                  PDF · DOCX · TXT · MP3 · WAV<br/>urls.txt · youtube_urls.txt
                </div>
                <Btn accent size="md" style={{ justifyContent: 'center', width: '100%' }}>Upload files →</Btn>
              </div>
              <div style={{ padding: 32, background: T.paperSoft, border: `1px solid ${T.hair}`, borderRadius: 18 }}>
                <Mono size={10} style={{ letterSpacing: 2 }}>MODE · CELEBRITY</Mono>
                <div style={{ fontFamily: T.fDisplay, fontSize: 28, letterSpacing: -0.8, fontWeight: 400, marginTop: 14, marginBottom: 12 }}>
                  Just a name.
                </div>
                <div style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.55, marginBottom: 22 }}>
                  We harvest public material. Best for public figures — founders, authors, directors.
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: '#fff', border: `1px solid ${T.hair}`, fontFamily: T.fMono, fontSize: 12, color: T.mute, marginBottom: 20 }}>
                  e.g. "Bong Joon-ho · Korean film director"
                </div>
                <Btn size="md" style={{ justifyContent: 'center', width: '100%' }}>Search & build →</Btn>
              </div>
            </div>

            <div style={{ marginTop: 32, padding: '14px 18px', border: `1px solid ${T.hair}`, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13, color: T.mute, lineHeight: 1.5 }}>
              <span style={{ color: T.accent, fontSize: 16 }}>⚠</span>
              <div>Celebrity avatars never impersonate. You'll review and approve the generated profile before it can be used.</div>
            </div>
</div>
        </div>
      </Browser>
    );
  }

  // ── Simulation Setup ────────────────────────────────────────
  function SetupScreen({ onNav }){
    return (
      <Browser>
        <AppNav active="sim"/>
        <div style={{ flex: 1, overflow: 'auto', padding: '48px 80px' }}>
          <Eyebrow>NEW SIMULATION</Eyebrow>
          <div style={{ fontFamily: T.fDisplay, fontSize: 48, letterSpacing: -1.6, fontWeight: 400, lineHeight: 1.05, marginTop: 12, marginBottom: 40 }}>
            Seat the <span style={{ fontStyle: 'italic', fontWeight: 300 }}>room.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 48 }}>
            <div>
              <Eyebrow style={{ color: T.mute }}>TOPIC</Eyebrow>
              <div style={{ padding: 22, border: `1.5px solid ${T.ink}`, borderRadius: 14, fontFamily: T.fDisplay, fontSize: 22, fontWeight: 300, letterSpacing: -0.4, lineHeight: 1.3, marginTop: 10 }}>
                Should a two-person team build mobile or web first in 2026?
              </div>
              <div style={{ fontSize: 12, color: T.mute, marginTop: 8, marginBottom: 32 }}>A clear question produces a better simulation.</div>

              <Eyebrow style={{ color: T.mute }}>PARTICIPANTS · 3</Eyebrow>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14, marginBottom: 32 }}>
                {P.slice(0,3).map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 6px 6px', background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 999 }}>
                    <Av p={p} size={28}/>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <span style={{ color: T.mute, fontSize: 16, cursor: 'pointer' }}>×</span>
                  </div>
                ))}
                <div style={{ padding: '10px 16px', border: `1.5px dashed ${T.hair}`, borderRadius: 999, fontSize: 13, color: T.mute }}>+ Add</div>
              </div>

              <Eyebrow style={{ color: T.mute }}>FORMAT</Eyebrow>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, marginBottom: 32 }}>
                <div style={{ padding: 18, border: `1.5px solid ${T.ink}`, borderRadius: 12, background: '#fff', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 14, right: 14, width: 16, height: 16, borderRadius: '50%', border: `2px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: T.ink }}/></div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>Meeting</div>
                  <div style={{ fontSize: 12, color: T.mute, marginTop: 4 }}>Facilitator leads. Agenda-driven.</div>
                </div>
                <div style={{ padding: 18, border: `1px solid ${T.hair}`, borderRadius: 12, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 14, right: 14, width: 16, height: 16, borderRadius: '50%', border: `2px solid ${T.hair}` }}/>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>Debate</div>
                  <div style={{ fontSize: 12, color: T.mute, marginTop: 4 }}>Round-robin. Everyone weighs in.</div>
                </div>
              </div>

              <Eyebrow style={{ color: T.mute }}>RALPH LOOP</Eyebrow>
              <div style={{ marginTop: 14, padding: 18, background: T.paperSoft, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 22, borderRadius: 999, background: T.ink, position: 'relative' }}>
                  <div style={{ position: 'absolute', right: 2, top: 2, width: 18, height: 18, borderRadius: '50%', background: '#fff' }}/>
                </div>
                <div style={{ fontSize: 14 }}>Retry until <b>Ralph ≥ 7</b>, max <b>3</b> iterations</div>
                <Mono style={{ marginLeft: 'auto' }}>edit criteria</Mono>
              </div>
            </div>

            <div>
              <div style={{ position: 'sticky', top: 0, padding: 24, background: T.ink, color: '#fff', borderRadius: 18 }}>
                <Eyebrow color="rgba(255,255,255,0.5)">SUMMARY</Eyebrow>
                <div style={{ fontFamily: T.fDisplay, fontWeight: 300, fontSize: 20, letterSpacing: -0.3, lineHeight: 1.4, marginTop: 14, marginBottom: 22 }}>
                  A meeting with 3 people about mobile vs web in 2026. Up to 3 rounds.
                </div>
                <div style={{ display: 'flex', marginBottom: 20 }}>
                  {P.slice(0,3).map((p,i) => (
                    <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                      <Av p={p} size={36} ring/>
                    </div>
                  ))}
                </div>
                <div onClick={() => onNav && onNav('live')} style={{ cursor: 'pointer', padding: '14px 20px', borderRadius: 999, background: '#fff', color: T.ink, fontSize: 14, fontWeight: 500, textAlign: 'center' }}>
                  Start simulation →
                </div>
                <div style={{ fontFamily: T.fMono, fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 10 }}>⌘↵</div>
              </div>
            </div>
          </div>
        </div>
      </Browser>
    );
  }

  // ── Settings ────────────────────────────────────────────────
  function SettingsScreen(){
    return (
      <Browser>
        <AppNav/>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr', overflow: 'hidden' }}>
          <div style={{ borderRight: `1px solid ${T.hair}`, padding: '32px 20px' }}>
            <Eyebrow>SETTINGS</Eyebrow>
            <div style={{ marginTop: 20 }}>
              {['Model','Library location','Transcripts','Appearance','Keyboard','About'].map((s, i) => (
                <div key={s} style={{ padding: '10px 12px', fontSize: 13, borderRadius: 8, background: i === 0 ? T.paperSoft : 'transparent', fontWeight: i === 0 ? 500 : 400, marginBottom: 2, color: i === 0 ? T.ink : T.inkSoft }}>{s}</div>
              ))}
            </div>
          </div>

          <div style={{ overflow: 'auto', padding: '48px 64px', maxWidth: 720 }}>
            <div style={{ fontFamily: T.fDisplay, fontSize: 36, letterSpacing: -1, fontWeight: 400, marginBottom: 8 }}>Model</div>
            <div style={{ fontSize: 14, color: T.mute, marginBottom: 32 }}>Which Claude powers your avatars.</div>

            {[
              ['claude-sonnet-4.5','Default · balanced · fast','selected'],
              ['claude-opus-4.1','Slower · deepest reasoning',''],
              ['claude-haiku-4.5','Fastest · draft mode',''],
            ].map(([n, s, sel], i) => (
              <div key={i} style={{ padding: 20, border: sel ? `1.5px solid ${T.ink}` : `1px solid ${T.hair}`, borderRadius: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16, background: sel ? '#fff' : 'transparent' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${sel ? T.ink : T.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.ink }}/>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.fMono, fontSize: 13 }}>{n}</div>
                  <div style={{ fontSize: 12, color: T.mute, marginTop: 2 }}>{s}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 48, fontFamily: T.fDisplay, fontSize: 22, letterSpacing: -0.5, fontWeight: 400, marginBottom: 16 }}>Library location</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['Local','~/persona-studio/data','selected'],['Global','~/.claude/personas','']].map(([t,p,sel]) => (
                <div key={t} style={{ padding: 18, border: sel ? `1.5px solid ${T.ink}` : `1px solid ${T.hair}`, borderRadius: 12, background: sel ? '#fff' : 'transparent' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t}</div>
                  <Mono size={11} style={{ marginTop: 4, display: 'block' }}>{p}</Mono>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Browser>
    );
  }

  window.HF_V2 = { DetailScreen, CreateScreen, SetupScreen, SettingsScreen };
})();
