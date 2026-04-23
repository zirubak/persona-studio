// wireframes-screens.jsx — low-fi sketch screens for Persona Studio
// Exposed on window.Screens.

const C_ACCENT = '#c96442';
const C_INK = '#1a1a1a';
const C_PAPER = '#fdfcfa';
const C_SOFT = '#eeeae3';
const C_MUTE = '#8a857c';

const P = [
  { id: 'pg',  name: 'Paul Graham',       role: 'Essayist · YC',     hue: 28  },
  { id: 'nv',  name: 'Naval Ravikant',    role: 'AngelList',         hue: 195 },
  { id: 'dhh', name: 'DHH',               role: 'Rails · Basecamp',  hue: 350 },
  { id: 'jhb', name: 'JH Baek',           role: 'Engineer',          hue: 142 },
  { id: 'dv',  name: 'Devesh Upadhyay',   role: 'Engineer',          hue: 260 },
  { id: 'wb',  name: 'Wes Bailey',        role: 'PM',                hue: 90  },
  { id: 'sp',  name: 'sample_private',    role: 'Fictional · KR',    hue: 322 },
];

const hueBg = (h) => `oklch(0.72 0.10 ${h})`;
const hueBgSoft = (h) => `oklch(0.92 0.05 ${h})`;
const hueInk = (h) => `oklch(0.35 0.10 ${h})`;

// ── Atoms ────────────────────────────────────────────────────────────────
const Av = ({ p, size = 40, ring }) => (
  <div className="av" style={{
    width: size, height: size, borderRadius: '50%',
    background: hueBg(p.hue), color: '#fff',
    fontSize: size * 0.38, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: ring ? `0 0 0 3px ${C_PAPER}, 0 0 0 4.5px ${hueBg(p.hue)}` : 'none',
    flexShrink: 0,
  }}>
    {p.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
  </div>
);

const Line = ({ w = '100%', op = 0.14, h = 8, mb = 8 }) => (
  <div style={{ height: h, width: w, background: C_INK, opacity: op, borderRadius: 2, marginBottom: mb }} />
);

const Lines = ({ n = 3, widths }) => (
  <div>{Array.from({length: n}).map((_,i) => (
    <Line key={i} w={(widths && widths[i]) || (['96%','88%','72%','80%','92%'][i%5])} op={0.12} h={7} mb={8}/>
  ))}</div>
);

const Placeholder = ({ label, w, h, style, heavy }) => (
  <div className={heavy ? 'ph-heavy' : 'ph'} style={{
    width: w, height: h, border: '1.5px dashed #c7c4be', borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#8a857c', fontFamily: 'ui-monospace, monospace', fontSize: 11,
    letterSpacing: 0.5, ...style
  }}>
    {label}
  </div>
);

const Note = ({ children, top, left, right, bottom, w = 180, rot = -2 }) => (
  <div className="note hand" style={{ position: 'absolute', top, left, right, bottom, width: w, transform: `rotate(${rot}deg)` }}>
    {children}
  </div>
);

const Bar = ({ w, h = 4, op = 0.14 }) => (
  <div style={{ width: w, height: h, background: C_INK, opacity: op, borderRadius: 2 }} />
);

// App chrome: top nav seen in all screens
const AppNav = ({ active = 'home' }) => (
  <div style={{
    height: 52, padding: '0 28px', display: 'flex', alignItems: 'center', gap: 28,
    borderBottom: '1px solid #e8e4dd', background: C_PAPER,
  }}>
    <div style={{ fontWeight: 600, letterSpacing: -0.3, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 18, height: 18, background: C_INK, borderRadius: 4 }}/>
      Persona Studio
    </div>
    {[
      ['home','Home'],
      ['library','Library'],
      ['create','New avatar'],
      ['sim','Simulate'],
      ['results','Results'],
    ].map(([k,t]) => (
      <div key={k} style={{
        fontSize: 13,
        color: active === k ? C_INK : C_MUTE,
        fontWeight: active === k ? 600 : 400,
        borderBottom: active === k ? `2px solid ${C_INK}` : '2px solid transparent',
        paddingBottom: 14, marginBottom: -1, marginTop: 14,
      }}>{t}</div>
    ))}
    <div style={{ flex: 1 }}/>
    <div style={{ fontSize: 11, color: C_MUTE, fontFamily: 'ui-monospace, monospace' }}>localhost:7777</div>
    <div style={{ width: 24, height: 24, borderRadius: '50%', background: C_SOFT }}/>
  </div>
);

const Browser = ({ url = 'localhost:7777', children }) => (
  <div style={{ height: '100%', background: C_PAPER, display: 'flex', flexDirection: 'column' }}>
    <div className="chrome-bar">
      <div className="chrome-dot" style={{ background: '#e8ac5f' }}/>
      <div className="chrome-dot" style={{ background: '#d3d0ca' }}/>
      <div className="chrome-dot" style={{ background: '#d3d0ca' }}/>
      <div className="chrome-url">{url}</div>
    </div>
    {children}
  </div>
);

// ── Legend ────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="wf" style={{ padding: 32 }}>
      <div className="hand" style={{ fontSize: 28, marginBottom: 6, color: C_INK }}>How to read these</div>
      <div style={{ fontSize: 13, color: C_MUTE, marginBottom: 24 }}>
        Low-fi on purpose. Pick the structure you like per row; we hi-fi the winning combination next.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
        <div>
          <div className="hand accent" style={{ fontSize: 14, marginBottom: 8 }}>hand-written labels</div>
          <div style={{ fontSize: 12, color: C_MUTE, lineHeight: 1.6 }}>Anything in orange cursive is my margin-note to you, not part of the UI.</div>
        </div>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <Placeholder label="PHOTO" w={60} h={30}/>
            <span style={{ fontSize: 12, color: C_MUTE }}>= image we'll drop in later</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ width: 60, display:'flex', flexDirection:'column', gap: 5 }}><Line w="90%"/><Line w="70%"/></div>
            <span style={{ fontSize: 12, color: C_MUTE }}>= body copy</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: C_MUTE, marginBottom: 6 }}>each avatar gets a hue:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {P.map(p => <Av key={p.id} p={p} size={28}/>)}
          </div>
        </div>
      </div>
      <Note top={170} right={20} rot={-3}>drag cards ·<br/>click label → focus</Note>
    </div>
  );
}

// ── 1. HOME ──────────────────────────────────────────────────────────────
function HomeA() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="home" />
        <div style={{ flex: 1, padding: '120px 140px 0', position: 'relative' }}>
          <div style={{ fontSize: 11, color: C_MUTE, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>Persona Studio · 0.5</div>
          <div style={{ fontSize: 56, lineHeight: 1.05, letterSpacing: -1.5, fontWeight: 600, maxWidth: 820, marginBottom: 18 }}>
            Rehearse tomorrow's meeting today.<br/>
            <span style={{ color: C_MUTE }}>With everyone in the room.</span>
          </div>
          <div style={{ fontSize: 17, color: '#555', maxWidth: 640, lineHeight: 1.5, marginBottom: 40 }}>
            Build AI avatars of real people, then put them in a room together and listen to them argue.
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="btn primary" style={{ padding: '12px 22px', fontSize: 14 }}>Start a simulation →</div>
            <div className="btn" style={{ padding: '12px 22px', fontSize: 14 }}>Build an avatar</div>
          </div>
          <div style={{ position: 'absolute', bottom: 60, left: 140, right: 140, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: C_MUTE, letterSpacing: 1, marginBottom: 10 }}>YOUR CAST · 7 AVATARS</div>
              <div style={{ display: 'flex', gap: -8 }}>
                {P.slice(0,6).map((p,i) => <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -10 }}><Av p={p} size={40} ring /></div>)}
              </div>
            </div>
            <div style={{ fontSize: 12, color: C_MUTE }}>Last run · 12 hours ago · <span className="accent">Should we ship the beta?</span></div>
          </div>
        </div>
      </Browser>
      <Note top={110} right={30} rot={3} w={150}>Apple-style<br/>restraint. Huge<br/>type, tons of air.</Note>
    </div>
  );
}

function HomeB() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="home" />
        <div style={{ padding: '48px 80px 0' }}>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.8, marginBottom: 8 }}>Good afternoon.</div>
          <div style={{ fontSize: 15, color: C_MUTE, marginBottom: 40 }}>Who do you want to hear from?</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 48 }}>
            {P.slice(0,4).map(p => (
              <div key={p.id} style={{ padding: 24, borderRadius: 14, border: '1px solid #e6e2db', background: '#fff' }}>
                <Av p={p} size={56}/>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: C_MUTE, marginTop: 2 }}>{p.role}</div>
                <div style={{ marginTop: 14 }}><Line w="90%" op={0.08}/><Line w="62%" op={0.08}/></div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1, padding: 24, borderRadius: 14, background: C_SOFT }}>
              <div className="hand" style={{ fontSize: 18, marginBottom: 8 }}>Recent</div>
              <Lines n={3}/>
            </div>
            <div style={{ flex: 1, padding: 24, borderRadius: 14, background: C_INK, color: '#fff' }}>
              <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 6 }}>QUICKSTART</div>
              <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.25 }}>Start from three thinkers who disagree →</div>
            </div>
          </div>
        </div>
      </Browser>
      <Note top={140} right={30} rot={-2}>warmer,<br/>people-first<br/>landing</Note>
    </div>
  );
}

function HomeC() {
  return (
    <div className="wf" style={{ background: C_PAPER }}>
      <Browser>
        <AppNav active="home" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 60 }}>
          <div style={{ fontSize: 13, color: C_MUTE, letterSpacing: 2, marginBottom: 28, textTransform: 'uppercase' }}>Press ⌘K to begin</div>
          <div style={{
            width: 720, padding: '20px 24px', borderRadius: 14,
            background: '#fff', border: '1.5px solid #1a1a1a',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', color: C_ACCENT, fontSize: 16 }}>›</div>
            <div style={{ fontSize: 17 }}>
              Simulate <span style={{ color: C_MUTE }}>a meeting with</span> <span className="accent">paul_graham</span>, <span className="accent">naval_ravikant</span> <span style={{ color: C_MUTE }}>about</span>…
            </div>
            <div style={{ marginLeft: 'auto', width: 1.5, height: 18, background: C_INK, animation: 'none' }}/>
          </div>

          <div style={{ marginTop: 28, width: 720 }}>
            {[
              ['Simulate meeting', 'paul_graham, naval_ravikant, dhh · Should we raise?'],
              ['Simulate debate',  'jh-baek, wes-bailey · Monolith vs microservices'],
              ['Create avatar',    'from podcast + linkedin'],
              ['Browse library',   '7 avatars · local'],
            ].map(([t, s], i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                borderBottom: '1px solid #efece5',
                background: i === 0 ? C_SOFT : 'transparent',
              }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: i === 0 ? C_INK : 'transparent', border: i === 0 ? 'none' : '1px solid #d8d3cb' }}/>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t}</div>
                  <div style={{ fontSize: 12, color: C_MUTE, marginTop: 2 }}>{s}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontFamily: 'ui-monospace, monospace', fontSize: 11, color: C_MUTE }}>↵</div>
              </div>
            ))}
          </div>
        </div>
      </Browser>
      <Note top={120} right={30} rot={2}>keyboard-first.<br/>powerful users<br/>will love this</Note>
    </div>
  );
}

// ── 2. LIBRARY ──────────────────────────────────────────────────────────
function LibraryA() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="library" />
        <div style={{ padding: '40px 56px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.7 }}>Library</div>
              <div style={{ fontSize: 13, color: C_MUTE, marginTop: 4 }}>7 avatars · 4 local · 3 global</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ padding: '8px 14px', borderRadius: 999, background: C_SOFT, fontSize: 12 }}>All</div>
              <div style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, color: C_MUTE }}>Local</div>
              <div style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, color: C_MUTE }}>Global</div>
              <div style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, color: C_MUTE }}>Private</div>
              <div className="btn primary" style={{ marginLeft: 12 }}>+ New avatar</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {P.map(p => (
              <div key={p.id} style={{ padding: 22, borderRadius: 12, border: '1px solid #e6e2db', background: '#fff', position: 'relative' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 14 }}>
                  <Av p={p} size={52}/>
                  <div style={{ fontSize: 10, color: C_MUTE, fontFamily: 'ui-monospace, monospace', padding: '3px 7px', border: '1px solid #e6e2db', borderRadius: 4 }}>
                    {p.id === 'sp' ? 'PRIVATE' : 'PUBLIC'}
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: C_MUTE, marginTop: 2, marginBottom: 14 }}>{p.role}</div>
                <Lines n={2}/>
                <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 10, color: C_MUTE, padding: '2px 7px', border: '1px solid #eee', borderRadius: 4 }}>essay</div>
                  <div style={{ fontSize: 10, color: C_MUTE, padding: '2px 7px', border: '1px solid #eee', borderRadius: 4 }}>founder</div>
                </div>
              </div>
            ))}
            <div style={{ padding: 22, borderRadius: 12, border: '1.5px dashed #c7c4be', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, color: C_MUTE, fontSize: 13 }}>
              +  Add avatar
            </div>
          </div>
        </div>
      </Browser>
    </div>
  );
}

function LibraryB() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="library" />
        <div style={{ padding: '40px 56px' }}>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.7, marginBottom: 24 }}>Library</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, padding: '10px 14px', border: '1px solid #e6e2db', borderRadius: 8, fontSize: 13, color: C_MUTE, fontFamily: 'ui-monospace, monospace' }}>
              ⌕  Filter by name, tag, mode…
            </div>
            <div className="btn primary">+ New avatar</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e6e2db', borderRadius: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 140px 120px 120px 120px', padding: '10px 16px', fontSize: 11, color: C_MUTE, letterSpacing: 1, borderBottom: '1px solid #efece5', textTransform: 'uppercase' }}>
              <div/>
              <div>Name</div>
              <div>Role</div>
              <div>Mode</div>
              <div>Scope</div>
              <div>Last used</div>
            </div>
            {P.map((p,i) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 140px 120px 120px 120px', padding: '14px 16px', alignItems: 'center', borderBottom: i < P.length-1 ? '1px solid #efece5' : 'none', fontSize: 13 }}>
                <Av p={p} size={28}/>
                <div>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C_MUTE, fontFamily: 'ui-monospace, monospace' }}>{p.id}</div>
                </div>
                <div style={{ color: C_MUTE }}>{p.role}</div>
                <div>{p.id === 'sp' ? 'Private' : 'Celebrity'}</div>
                <div style={{ color: C_MUTE }}>{i % 2 ? 'global' : 'local'}</div>
                <div style={{ color: C_MUTE, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{['2h','1d','3d','5d','1w','2w','—'][i]}</div>
              </div>
            ))}
          </div>
        </div>
      </Browser>
      <Note top={50} right={40} rot={-2}>for power<br/>users with<br/>30+ avatars</Note>
    </div>
  );
}

function LibraryC() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="library" />
        <div style={{ padding: '60px 80px' }}>
          <div style={{ fontSize: 14, color: C_MUTE, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>THE CAST</div>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1, marginBottom: 40 }}>7 voices, ready to argue.</div>

          <div style={{ display: 'flex', gap: 32, overflow: 'hidden', alignItems: 'flex-end' }}>
            {P.map((p, i) => (
              <div key={p.id} style={{ flex: '0 0 auto', width: 180, textAlign: 'center' }}>
                <div style={{
                  width: 180, height: 240, borderRadius: 8, background: hueBgSoft(p.hue),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: `rotate(${(i % 2 ? 1 : -1) * (0.5 + (i%3)*0.3)}deg)`,
                }}>
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: hueBg(p.hue), color: '#fff', display: 'flex', alignItems:'center', justifyContent:'center', fontSize: 36, fontWeight: 600 }}>
                    {p.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 14 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C_MUTE, marginTop: 2 }}>{p.role}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 60, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="btn primary" style={{ padding: '12px 22px', fontSize: 14 }}>+ Add new voice</div>
            <div style={{ fontSize: 12, color: C_MUTE }}>or drag a folder here to build one automatically</div>
          </div>
        </div>
      </Browser>
      <Note top={60} right={30} rot={3}>editorial / museum<br/>vibe. risky but<br/>memorable.</Note>
    </div>
  );
}

// ── 3. AVATAR DETAIL ────────────────────────────────────────────────────
function DetailA() {
  const p = P[0];
  return (
    <div className="wf">
      <Browser>
        <AppNav active="library" />
        <div style={{ padding: '32px 56px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: 40 }}>
          <div>
            <div style={{ fontSize: 11, color: C_MUTE, marginBottom: 12 }}>← Library</div>
            <Av p={p} size={120}/>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, marginTop: 18 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: C_MUTE, marginTop: 4 }}>{p.role}</div>
            <div style={{ marginTop: 18, fontFamily: 'ui-monospace, monospace', fontSize: 11, color: C_MUTE, lineHeight: 1.7 }}>
              born_year: 1964<br/>
              mode: public<br/>
              created: 2026-04-19<br/>
              corpus: 84k tokens
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="btn primary">Start simulation →</div>
              <div className="btn">Edit persona</div>
              <div className="btn ghost" style={{ color: C_MUTE, fontSize: 11 }}>↗ open personas/paul_graham.md</div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #e6e2db', marginBottom: 24 }}>
              {['Voice','Experiences','Positions','Corpus','Raw files'].map((t,i) => (
                <div key={t} style={{ padding: '12px 0', fontSize: 13, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? C_INK : C_MUTE, borderBottom: i === 0 ? `2px solid ${C_INK}` : 'none', marginBottom: -1 }}>{t}</div>
              ))}
            </div>

            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Signature phrasings</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28 }}>
              {['make something people want','default alive or default dead','ramen profitable','schlep blindness','the wave of the future','this is going to sound counterintuitive'].map(t => (
                <div key={t} style={{ fontSize: 12, padding: '6px 10px', border: '1px solid #e6e2db', borderRadius: 999, background: '#fff' }}>"{t}"</div>
              ))}
            </div>

            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Rhetorical frame</div>
            <Lines n={4}/>

            <div style={{ fontSize: 16, fontWeight: 600, margin: '28px 0 10px' }}>What he avoids</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['jargon','decks','"monetize"','frameworks w/ caps'].map(t => (
                <div key={t} style={{ fontSize: 11, padding: '4px 10px', border: '1px dashed #c7c4be', borderRadius: 4, color: C_MUTE }}>{t}</div>
              ))}
            </div>
          </div>
        </div>
      </Browser>
    </div>
  );
}

function DetailB() {
  const p = P[1];
  return (
    <div className="wf">
      <Browser>
        <AppNav active="library" />
        <div style={{ padding: '60px 140px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: C_MUTE, marginBottom: 24 }}>← Library</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
            <Av p={p} size={80}/>
            <div>
              <div style={{ fontSize: 11, color: C_MUTE, letterSpacing: 2, textTransform: 'uppercase' }}>AVATAR · PUBLIC</div>
              <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: -0.8 }}>{p.name}</div>
              <div style={{ fontSize: 14, color: C_MUTE, marginTop: 4 }}>{p.role} · b. 1974</div>
            </div>
          </div>

          <div style={{ fontSize: 22, lineHeight: 1.55, color: '#2c2822', marginBottom: 28 }}>
            Near-monk-like aphorist of leverage, judgment, and long-term games. Emphasizes being "unmistakable" over being "heard."
          </div>

          <div style={{ fontSize: 13, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>SIGNATURE EXPERIENCES</div>
          <Lines n={3}/>
          <div style={{ marginTop: 6, fontSize: 13, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase' }}>POSITIONS</div>
          <Lines n={4}/>

          <div style={{ marginTop: 40, padding: '20px 24px', background: C_SOFT, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: C_MUTE }}>This persona has been in <b style={{ color: C_INK }}>4 simulations</b></div>
            <div className="btn">See history →</div>
          </div>
        </div>
      </Browser>
      <Note top={70} right={30} rot={-2}>reads like<br/>New Yorker<br/>profile</Note>
    </div>
  );
}

function DetailC() {
  const p = P[2];
  return (
    <div className="wf">
      <Browser>
        <AppNav active="library" />
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 320px', height: 'calc(100% - 80px)' }}>
          <div style={{ borderRight: '1px solid #e6e2db', padding: 20 }}>
            <div style={{ fontSize: 11, color: C_MUTE, marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' }}>SECTIONS</div>
            {['Background','Signature experiences','Vocabulary','Positions (5)','Red flags','Relationships'].map((t,i) => (
              <div key={t} style={{ fontSize: 13, padding: '8px 10px', borderRadius: 6, marginBottom: 2, background: i === 2 ? C_SOFT : 'transparent', fontWeight: i === 2 ? 500 : 400 }}>{t}</div>
            ))}
          </div>

          <div style={{ padding: 32, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Av p={p} size={36}/>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 10, color: C_ACCENT, background: '#fcece6', padding: '3px 8px', borderRadius: 4 }}>EDITING</div>
            </div>
            <div style={{ fontSize: 13, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>VOCABULARY & RHETORICAL PATTERNS</div>
            <div style={{ border: '1px solid #e6e2db', borderRadius: 8, background: '#fff', padding: 20, fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.8, color: '#2c2822' }}>
              <div><span style={{ color: C_ACCENT }}>**Signature phrasings**:</span> "make it boring", "REST done right", "type system as vibes", "majestic monolith"…</div>
              <div style={{ marginTop: 14 }}><span style={{ color: C_ACCENT }}>**Frame**:</span> combative, blog-post voice. Drops Latinate when angry.</div>
              <div style={{ marginTop: 14 }}><span style={{ color: C_ACCENT }}>**Avoids**:</span> microservices zealotry, AWS worship, TypeScript supremacy</div>
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: C_MUTE }}>Tip: edit directly. Claude will refine prose & re-validate schema on save.</div>
          </div>

          <div style={{ borderLeft: '1px solid #e6e2db', padding: 20, background: C_SOFT }}>
            <div style={{ fontSize: 11, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>RAW FILES · 12</div>
            {[
              ['hh-interview-2024.mp3', '47 min'],
              ['rework-book-ch1.pdf', '18 pg'],
              ['dhh-blog-2020..txt', '48 posts'],
              ['twitter-dump.json', '8.2k lines'],
            ].map(([n, s]) => (
              <div key={n} style={{ padding: '10px 0', borderBottom: '1px solid #e0dbd4', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{n}</div>
                <div style={{ fontSize: 11, color: C_MUTE }}>{s}</div>
              </div>
            ))}
            <div className="btn" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>+ Add material</div>
            <div style={{ marginTop: 20, padding: 12, background: '#fff', borderRadius: 8, fontSize: 11, color: C_MUTE, lineHeight: 1.5 }}>
              💡 Re-ingest will rebuild the persona from current files. Current version saved as <span className="mono">v7</span>.
            </div>
          </div>
        </div>
      </Browser>
      <Note top={80} right={30} rot={2}>editor-first.<br/>for power-users<br/>who tune often.</Note>
    </div>
  );
}

// ── 4. CREATE AVATAR ────────────────────────────────────────────────────
function CreateA() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="create" />
        <div style={{ padding: '48px 140px' }}>
          <div style={{ fontSize: 11, color: C_MUTE, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>STEP 2 OF 4</div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6, marginBottom: 32 }}>Drop in their material.</div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
            {['Mode','Material','Review','Build'].map((s, i) => (
              <div key={s} style={{ flex: 1, paddingTop: 8, borderTop: `3px solid ${i <= 1 ? C_INK : '#e6e2db'}`, fontSize: 12, color: i <= 1 ? C_INK : C_MUTE, fontWeight: i === 1 ? 600 : 400 }}>
                {String(i+1).padStart(2, '0')} · {s}
              </div>
            ))}
          </div>

          <div style={{ border: '2px dashed #c7c4be', borderRadius: 14, padding: 60, textAlign: 'center', background: C_SOFT }}>
            <div style={{ fontSize: 40, marginBottom: 12, color: C_MUTE }}>⤓</div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>Drop PDFs, audio, transcripts, or URLs</div>
            <div style={{ fontSize: 13, color: C_MUTE, marginTop: 6 }}>or <span className="accent" style={{ textDecoration: 'underline' }}>browse files</span> · paste URLs one per line</div>
          </div>

          <div style={{ marginTop: 24, fontSize: 12, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>QUEUED · 3</div>
          {[
            ['lex-fridman-episode-412.mp3', 'audio · transcribing…', 0.4],
            ['linkedin-profile.html', 'web · done', 1],
            ['urls.txt', 'web · 7 articles done', 1],
          ].map(([n, s, p]) => (
            <div key={n} style={{ padding: '10px 0', borderBottom: '1px solid #efece5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{n}</div>
                <div style={{ fontSize: 11, color: C_MUTE }}>{s}</div>
              </div>
              <div style={{ height: 3, background: '#efece5', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${p*100}%`, background: p === 1 ? C_INK : C_ACCENT, borderRadius: 2 }}/>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
            <div className="btn ghost" style={{ color: C_MUTE }}>← Back</div>
            <div className="btn primary">Continue →</div>
          </div>
        </div>
      </Browser>
    </div>
  );
}

function CreateB() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="create" />
        <div style={{ height: 'calc(100% - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: '100%', maxWidth: 720, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: -0.8, marginBottom: 12 }}>Who do you want to simulate?</div>
            <div style={{ fontSize: 15, color: C_MUTE, marginBottom: 40 }}>Drop anything. We figure out the rest.</div>

            <div style={{
              border: '2px dashed #c7c4be', borderRadius: 20, padding: '80px 40px',
              background: '#fff', position: 'relative',
            }}>
              <Placeholder label="FACE / AVATAR PLACEHOLDER" w={120} h={120} style={{ margin: '0 auto 24px', borderRadius: '50%' }}/>
              <div style={{ fontSize: 18 }}>Drop <span style={{ fontFamily: 'ui-monospace, monospace', color: C_ACCENT }}>PDF · MP3 · DOCX · URLs</span> here</div>
              <div style={{ fontSize: 13, color: C_MUTE, marginTop: 10 }}>or type a public figure's name</div>
              <div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 18px', border: `1.5px solid ${C_INK}`, borderRadius: 999, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
                <span style={{ color: C_MUTE }}>⌕</span>  type a name…
              </div>
            </div>
          </div>
        </div>
      </Browser>
      <Note top={60} right={30} rot={-3}>one surface,<br/>no modes.<br/>Jony-Ive pure.</Note>
    </div>
  );
}

function CreateC() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="create" />
        <div style={{ padding: '60px 100px' }}>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6, marginBottom: 10 }}>New avatar</div>
          <div style={{ fontSize: 14, color: C_MUTE, marginBottom: 40 }}>Choose a starting point.</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ padding: 32, border: '1.5px solid #1a1a1a', borderRadius: 14, background: '#fff' }}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: C_MUTE, marginBottom: 14 }}>MODE A</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 10 }}>Private</div>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.55, marginBottom: 24 }}>
                Your files. Your colleague, your interviewer, yourself. Stays local.
              </div>
              <div style={{ fontSize: 12, color: C_MUTE, fontFamily: 'ui-monospace, monospace', lineHeight: 1.8 }}>
                PDF · DOCX · TXT · MP3 · WAV<br/>
                urls.txt · youtube_urls.txt
              </div>
              <div className="btn primary" style={{ marginTop: 24 }}>Upload files →</div>
            </div>
            <div style={{ padding: 32, border: '1.5px solid #e6e2db', borderRadius: 14, background: C_SOFT }}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: C_MUTE, marginBottom: 14 }}>MODE B</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 10 }}>Celebrity</div>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.55, marginBottom: 24 }}>
                Just a name and a hint. We harvest public material.
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 8, background: '#fff', fontSize: 13, fontFamily: 'ui-monospace, monospace', color: C_MUTE }}>
                e.g. "Bong Joon-ho · Korean film director"
              </div>
              <div className="btn" style={{ marginTop: 24 }}>Search & build →</div>
            </div>
          </div>

          <div style={{ marginTop: 40, padding: 18, border: '1px solid #e6e2db', borderRadius: 10, fontSize: 12, color: C_MUTE, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: C_ACCENT }}>⚠</span> Celebrity avatars never impersonate; review the generated profile before using.
          </div>
        </div>
      </Browser>
    </div>
  );
}

// ── 5. SIMULATION SETUP ─────────────────────────────────────────────────
function SetupA() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="sim" />
        <div style={{ padding: '40px 80px' }}>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6, marginBottom: 28 }}>New simulation</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40 }}>
            <div>
              <div style={{ fontSize: 12, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>TOPIC</div>
              <div style={{ padding: 18, border: '1.5px solid #1a1a1a', borderRadius: 10, fontSize: 18, marginBottom: 4 }}>
                Should a two-person team build mobile or web first in 2026?
              </div>
              <div style={{ fontSize: 11, color: C_MUTE, marginBottom: 28 }}>A clear question produces a better simulation.</div>

              <div style={{ fontSize: 12, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>PARTICIPANTS · 3</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                {P.slice(0,3).map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 6px', background: '#fff', border: '1px solid #e6e2db', borderRadius: 999 }}>
                    <Av p={p} size={28}/>
                    <div style={{ fontSize: 13 }}>{p.name}</div>
                    <span style={{ color: C_MUTE, fontSize: 14, cursor: 'pointer' }}>×</span>
                  </div>
                ))}
                <div style={{ padding: '8px 14px', border: '1.5px dashed #c7c4be', borderRadius: 999, fontSize: 13, color: C_MUTE }}>+ Add</div>
              </div>

              <div style={{ fontSize: 12, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>FORMAT</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
                <div style={{ flex: 1, padding: 16, border: '1.5px solid #1a1a1a', borderRadius: 10, background: '#fff' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Meeting</div>
                  <div style={{ fontSize: 12, color: C_MUTE, marginTop: 4 }}>Facilitator leads. Agenda-driven.</div>
                </div>
                <div style={{ flex: 1, padding: 16, border: '1px solid #e6e2db', borderRadius: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Debate</div>
                  <div style={{ fontSize: 12, color: C_MUTE, marginTop: 4 }}>Round-robin. Everyone weighs in.</div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>RALPH LOOP</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 14, background: C_SOFT, borderRadius: 10 }}>
                <div style={{ width: 36, height: 20, borderRadius: 999, background: C_INK, position: 'relative' }}>
                  <div style={{ position: 'absolute', right: 2, top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff' }}/>
                </div>
                <div style={{ fontSize: 13 }}>Retry until score ≥ <b>7</b>, max <b>3</b> iterations</div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: C_MUTE, fontFamily: 'ui-monospace, monospace' }}>edit criteria</div>
              </div>
            </div>

            <div>
              <div style={{ padding: 20, background: C_INK, color: '#fff', borderRadius: 14 }}>
                <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>PREVIEW</div>
                <div style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 16 }}>A meeting with 3 people about mobile vs web in 2026. Up to 3 rounds.</div>
                <div className="btn primary" style={{ width: '100%', justifyContent: 'center', background: '#fff', color: C_INK, borderColor: '#fff' }}>Start simulation →</div>
                <div style={{ fontSize: 10, opacity: 0.5, marginTop: 8, textAlign: 'center' }}>⌘↵</div>
              </div>
            </div>
          </div>
        </div>
      </Browser>
    </div>
  );
}

function SetupB() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="sim" />
        <div style={{ padding: '40px 80px' }}>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6, marginBottom: 8 }}>Seat the room</div>
          <div style={{ fontSize: 14, color: C_MUTE, marginBottom: 36 }}>Drag avatars onto the table. Leave empty seats if you want.</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 40 }}>
            <div>
              <div style={{ position: 'relative', padding: 40, background: C_SOFT, borderRadius: 20, minHeight: 420 }}>
                <div style={{ width: 280, height: 180, margin: '80px auto', border: '2px solid #1a1a1a', borderRadius: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Kalam', color: C_MUTE, fontSize: 16 }}>
                  the table
                </div>
                {[
                  { p: P[0], top: 20, left: '30%' },
                  { p: P[1], top: 20, right: '30%' },
                  { p: P[2], bottom: 40, left: '30%' },
                  { p: null, bottom: 40, right: '30%' },
                ].map(({p, ...pos}, i) => (
                  <div key={i} style={{ position: 'absolute', ...pos, textAlign: 'center' }}>
                    {p ? (
                      <><Av p={p} size={60}/><div style={{ fontSize: 11, marginTop: 4, color: C_MUTE }}>{p.name}</div></>
                    ) : (
                      <div style={{ width: 60, height: 60, borderRadius: '50%', border: '1.5px dashed #c7c4be', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C_MUTE, fontSize: 20 }}>+</div>
                    )}
                  </div>
                ))}
                <div style={{ position: 'absolute', top: 40, left: 40, fontSize: 11, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase' }}>FACILITATOR</div>
                <div style={{ position: 'absolute', top: 60, left: 40, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>claude-opus</div>
              </div>

              <div style={{ marginTop: 24, padding: 18, border: '1.5px solid #1a1a1a', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: C_MUTE, letterSpacing: 1, marginBottom: 8 }}>ON THE AGENDA</div>
                <div style={{ fontSize: 16 }}>Should we ship the beta this quarter?</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>BENCH · 7 AVAILABLE</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {P.map(p => (
                  <div key={p.id} style={{ width: 80, textAlign: 'center' }}>
                    <Av p={p} size={46}/>
                    <div style={{ fontSize: 10, color: C_MUTE, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 30, padding: 18, background: C_INK, color: '#fff', borderRadius: 12 }}>
                <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1, marginBottom: 6 }}>FORMAT</div>
                <div style={{ fontSize: 14, marginBottom: 14 }}>Meeting · Ralph ≥ 7 · max 3 iterations</div>
                <div className="btn primary" style={{ width: '100%', justifyContent: 'center', background: '#fff', color: C_INK }}>Begin →</div>
              </div>
            </div>
          </div>
        </div>
      </Browser>
      <Note top={80} right={20} rot={3}>spatial metaphor,<br/>drag-drop.<br/>playful.</Note>
    </div>
  );
}

function SetupC() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="sim" />
        <div style={{ padding: '60px 100px', maxWidth: 780, margin: '0 auto' }}>
          <div style={{ fontSize: 13, color: C_MUTE, marginBottom: 36 }}>Step by step. Press ↵ after each line.</div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: C_MUTE, marginBottom: 6 }}>What's the meeting about?</div>
            <div style={{ fontSize: 22, lineHeight: 1.4, color: C_INK }}>
              Should we raise a seed round or bootstrap?
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: C_MUTE, marginBottom: 6 }}>Who should be in the room?</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Av p={P[0]} size={36}/>
              <Av p={P[1]} size={36}/>
              <Av p={P[2]} size={36}/>
              <div style={{ fontSize: 22, color: C_INK, marginLeft: 6 }}>paul, naval, dhh</div>
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: C_MUTE, marginBottom: 6 }}>Debate or meeting?</div>
            <div style={{ fontSize: 22, color: C_INK }}>meeting <span style={{ color: C_MUTE }}>· agenda-driven</span></div>
          </div>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 13, color: C_MUTE, marginBottom: 6 }}>Retry until satisfied?</div>
            <div style={{ fontSize: 22, color: C_INK }}>yes, <span className="accent">score ≥ 7</span>, up to 3 times.</div>
          </div>

          <div style={{ padding: 20, border: '1.5px solid #1a1a1a', borderRadius: 12, display: 'flex', alignItems: 'center' }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', color: C_ACCENT, marginRight: 12 }}>›</div>
            <div style={{ fontSize: 14, color: C_MUTE }}>anything else to set?</div>
            <div style={{ marginLeft: 'auto' }} className="btn primary">Start →</div>
          </div>
        </div>
      </Browser>
      <Note top={80} right={30} rot={-2}>feels like<br/>iMessage with<br/>a robot host.</Note>
    </div>
  );
}

// ── 6. LIVE VIEW (the core new experience) ──────────────────────────────
function LivePane({ p, active, text, pending }) {
  return (
    <div style={{
      padding: 20, borderRadius: 12, background: '#fff',
      border: active ? `2px solid ${hueBg(p.hue)}` : '1px solid #e6e2db',
      height: '100%', display: 'flex', flexDirection: 'column',
      boxShadow: active ? `0 0 0 4px ${hueBgSoft(p.hue)}` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Av p={p} size={32}/>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
          <div style={{ fontSize: 10, color: active ? hueInk(p.hue) : C_MUTE, fontFamily: 'ui-monospace, monospace' }}>
            {active ? '● speaking' : pending ? 'thinking…' : 'idle'}
          </div>
        </div>
        {active && (
          <div className="wav" style={{ marginLeft: 'auto', color: hueBg(p.hue) }}>
            {[5,9,14,7,11,5,13,8].map((h,i) => <b key={i} style={{ height: h }}/>)}
          </div>
        )}
      </div>
      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.55, color: active ? C_INK : '#555', overflow: 'hidden' }}>
        {text}
        {active && <span style={{ display: 'inline-block', width: 1.5, height: 14, background: hueBg(p.hue), verticalAlign: 'middle', marginLeft: 2 }}/>}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 6, fontSize: 10, color: C_MUTE }}>
        <div style={{ padding: '3px 8px', border: '1px solid #efece5', borderRadius: 4, fontFamily: 'ui-monospace, monospace' }}>turn 3</div>
        <div style={{ padding: '3px 8px', border: '1px solid #efece5', borderRadius: 4, fontFamily: 'ui-monospace, monospace' }}>iter 1/3</div>
      </div>
    </div>
  );
}

function LiveA() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="sim" />
        <div style={{ padding: '20px 32px 28px', display: 'flex', flexDirection: 'column', height: 'calc(100% - 52px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Mobile vs web first in 2026</div>
              <div style={{ fontSize: 11, color: C_MUTE, marginTop: 2 }}>Meeting · iter 1/3 · turn 3 of 8 · 00:04:12</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <div className="btn ghost" style={{ color: C_MUTE, fontSize: 12 }}>▣ pause</div>
              <div className="btn">interrupt</div>
              <div className="btn primary">stop</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, flex: 1 }}>
            <LivePane p={P[0]} active text={'"Most of what sounds sophisticated about mobile-first is just imitation. If two of you can\'t ship a web app in a weekend, two of you can\'t ship an iOS app in a month."'} />
            <LivePane p={P[1]} pending text={'(drafting a reply — leverage angle)'} />
            <LivePane p={P[2]} text={'"Monoliths ship. Whatever form. Next."'} />
          </div>

          <div style={{ marginTop: 14, padding: '12px 16px', background: C_SOFT, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: C_MUTE }}>
            <div className="mono" style={{ color: C_INK }}>Facilitator</div>
            <div>calling on Naval next · topic depth · OK to go long</div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
              <div>avg response <span className="mono" style={{ color: C_INK }}>7.2s</span></div>
              <div>tokens <span className="mono" style={{ color: C_INK }}>4.1k</span></div>
            </div>
          </div>
        </div>
      </Browser>
      <Note top={60} right={20} rot={2}>closest<br/>to tmux —<br/>still legible.</Note>
    </div>
  );
}

function LiveB() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="sim" />
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', height: 'calc(100% - 52px)' }}>
          <div style={{ borderRight: '1px solid #e6e2db', padding: 20 }}>
            <div style={{ fontSize: 11, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>ROOM</div>
            {P.slice(0,3).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                <Av p={p} size={36}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: C_MUTE, fontFamily: 'ui-monospace, monospace' }}>
                    {p.id === 'nv' ? '● speaking' : 'idle'}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 20, padding: 12, background: C_SOFT, borderRadius: 8, fontSize: 11, color: C_MUTE, lineHeight: 1.5 }}>
              Click a name to mute<br/>that voice mid-flight.
            </div>
          </div>

          <div style={{ padding: '20px 40px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { p: P[0], text: '"Make something people want" is the test. Not platform, not modality.', done: true },
              { p: P[2], text: 'Ship whatever the hell gets used. Stop theorizing.', done: true },
              { p: P[1], text: 'Consider leverage. Web ships to every phone already — why not start there and let the winners demand native?', done: true },
              { p: P[0], text: 'And web is the ramen-profitable version. You can go from zero to users in a day…', active: true },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, opacity: m.done ? 0.85 : 1 }}>
                <Av p={m.p} size={32}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: hueInk(m.p.hue), fontWeight: 600, marginBottom: 4 }}>{m.p.name}</div>
                  <div style={{ fontSize: 15, lineHeight: 1.55 }}>
                    {m.text}
                    {m.active && <span style={{ display: 'inline-block', width: 1.5, height: 14, background: C_INK, verticalAlign: 'middle', marginLeft: 2 }}/>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderLeft: '1px solid #e6e2db', padding: 20, background: C_SOFT }}>
            <div style={{ fontSize: 11, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>FACILITATOR</div>
            <Lines n={3}/>
            <div style={{ marginTop: 24, fontSize: 11, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>AGENDA · 3/8</div>
            {['Cost & staffing','Distribution reality','User expectations'].map((t, i) => (
              <div key={t} style={{ fontSize: 12, padding: '6px 0', color: i < 2 ? C_MUTE : C_INK }}>
                {i < 2 ? '✓' : '○'} {t}
              </div>
            ))}
          </div>
        </div>
      </Browser>
      <Note top={60} right={20} rot={-2}>Slack-like.<br/>linear flow,<br/>less chaotic.</Note>
    </div>
  );
}

function LiveC() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="sim" />
        <div style={{ padding: '30px 40px', display: 'flex', flexDirection: 'column', height: 'calc(100% - 52px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Mobile vs web first in 2026</div>
            <div style={{ fontSize: 11, color: C_MUTE, fontFamily: 'ui-monospace, monospace' }}>iter 1/3 · 00:04:12</div>
          </div>

          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Spotlight speaker */}
            <div style={{ textAlign: 'center', maxWidth: 600 }}>
              <Av p={P[0]} size={140} ring/>
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 18, marginBottom: 2 }}>{P[0].name}</div>
              <div className="wav" style={{ color: hueBg(P[0].hue), marginBottom: 20, justifyContent: 'center' }}>
                {[6,12,18,8,14,7,16,11,20,9,15,6].map((h,i) => <b key={i} style={{ height: h, width: 3 }}/>)}
              </div>
              <div style={{ fontSize: 22, lineHeight: 1.4, color: C_INK, fontWeight: 400 }}>
                "Most sophisticated-sounding advice about mobile-first is imitation. If you can't ship web in a weekend, you can't ship iOS in a month."
              </div>
            </div>

            {/* Side presence: other participants */}
            <div style={{ position: 'absolute', left: 40, top: '50%', transform: 'translateY(-50%)', textAlign: 'center', opacity: 0.5 }}>
              <Av p={P[1]} size={64}/>
              <div style={{ fontSize: 11, color: C_MUTE, marginTop: 6, fontFamily: 'ui-monospace, monospace' }}>thinking…</div>
            </div>
            <div style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', textAlign: 'center', opacity: 0.5 }}>
              <Av p={P[2]} size={64}/>
              <div style={{ fontSize: 11, color: C_MUTE, marginTop: 6, fontFamily: 'ui-monospace, monospace' }}>idle</div>
            </div>
          </div>

          <div style={{ padding: '12px 20px', background: C_SOFT, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: C_MUTE }}>
            <div className="mono" style={{ color: C_INK }}>‹ turn 3 / 8 ›</div>
            <div style={{ flex: 1 }}>Facilitator: agenda item "cost & staffing" done, moving to distribution reality.</div>
            <div className="btn">interrupt</div>
            <div className="btn primary">stop</div>
          </div>
        </div>
      </Browser>
      <Note top={60} right={30} rot={3}>Apple Keynote<br/>stage energy.<br/>one voice at a time.</Note>
    </div>
  );
}

function LiveD() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="sim" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', height: 'calc(100% - 52px)' }}>
          <div style={{ padding: '20px 32px' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Room · 3 speakers</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {[
                { p: P[0], active: true,  text: '"If you can\'t ship web in a weekend you can\'t ship mobile in a month."' },
                { p: P[1], pending: true, text: '(drafting · leverage framing)' },
                { p: P[2], text: '"Monoliths ship. Whatever form. Next."' },
                { p: P[3], text: '(muted for this topic)' },
              ].map(({p,...r}) => (
                <div key={p.id} style={{ height: 180 }}>
                  <LivePane p={p} {...r}/>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: 12, background: C_SOFT, borderRadius: 10, fontSize: 12, color: C_MUTE, display: 'flex', gap: 20 }}>
              <div>agenda <b style={{ color: C_INK }}>3/8</b></div>
              <div>tokens <b style={{ color: C_INK }}>4.1k</b></div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <div className="btn">interrupt</div>
                <div className="btn primary">stop</div>
              </div>
            </div>
          </div>

          <div style={{ borderLeft: '1px solid #e6e2db', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #efece5', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase' }}>TRANSCRIPT</div>
              <div style={{ fontSize: 11, color: C_MUTE, fontFamily: 'ui-monospace, monospace' }}>auto-scroll</div>
            </div>
            <div style={{ flex: 1, padding: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { p: P[0], t: '"Make something people want." is the test. Not modality.' },
                { p: P[2], t: 'Ship whatever the hell gets used. Stop theorizing.' },
                { p: P[1], t: 'Web ships to every phone already — let the winners demand native.' },
                { p: P[0], t: 'And web is ramen-profitable. Zero to users in a day.' },
              ].map((m,i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <Av p={m.p} size={22}/>
                  <div style={{ flex: 1, fontSize: 12, lineHeight: 1.55 }}>
                    <b style={{ color: hueInk(m.p.hue) }}>{m.p.name.split(' ')[0]}</b> {m.t}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Browser>
      <Note top={60} right={30} rot={-2}>combo mode.<br/>probably the<br/>right default?</Note>
    </div>
  );
}

// ── 7. RESULTS ──────────────────────────────────────────────────────────
function ResultsA() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="results" />
        <div style={{ padding: '40px 80px' }}>
          <div style={{ fontSize: 11, color: C_MUTE, marginBottom: 8 }}>simulations / mobile-vs-web-2026 / 2026-04-21_18-42</div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6, marginBottom: 6 }}>Mobile or web first in 2026?</div>
          <div style={{ fontSize: 14, color: C_MUTE, marginBottom: 32 }}>Meeting · 3 participants · 2 iterations · 11min 34s</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 36 }}>
            <div style={{ padding: 20, background: C_INK, color: '#fff', borderRadius: 12 }}>
              <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 1 }}>SATISFACTION</div>
              <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: -2, marginTop: 2, lineHeight: 1 }}>7.8</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>goal ≥ 7 · reached at iter 2</div>
            </div>
            <div style={{ padding: 20, border: '1px solid #e6e2db', borderRadius: 12, background: '#fff' }}>
              <div style={{ fontSize: 10, color: C_MUTE, letterSpacing: 1 }}>CONCLUSION</div>
              <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>Ship web first, port native once retention demands it. 2 of 3 aligned.</div>
            </div>
            <div style={{ padding: 20, border: '1px solid #e6e2db', borderRadius: 12, background: '#fff' }}>
              <div style={{ fontSize: 10, color: C_MUTE, letterSpacing: 1 }}>ACTION ITEMS</div>
              <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
                <div>□ Ship MVP in 2w · @you</div>
                <div>□ Rev revisit in 8w · @you</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>CRITERIA</div>
          {[
            ['Realistic pushback',            8.5],
            ['Characters stay in voice',      9.0],
            ['Concrete action items',         6.5],
            ['Dissent is genuine, not staged', 7.0],
          ].map(([t, v]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{ width: 220, fontSize: 13 }}>{t}</div>
              <div style={{ flex: 1, height: 6, background: '#efece5', borderRadius: 3 }}>
                <div style={{ width: `${v*10}%`, height: '100%', background: C_INK, borderRadius: 3 }}/>
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, width: 36, textAlign: 'right' }}>{v.toFixed(1)}</div>
            </div>
          ))}

          <div style={{ marginTop: 32, display: 'flex', gap: 10 }}>
            <div className="btn primary">Read transcript →</div>
            <div className="btn">↓ Word</div>
            <div className="btn">↓ PowerPoint</div>
            <div className="btn">↓ Markdown</div>
            <div className="btn ghost" style={{ marginLeft: 'auto', color: C_MUTE }}>Re-run with feedback</div>
          </div>
        </div>
      </Browser>
    </div>
  );
}

function ResultsB() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="results" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: 'calc(100% - 52px)' }}>
          <div style={{ padding: '32px 60px', overflow: 'hidden' }}>
            <div style={{ fontSize: 11, color: C_MUTE, marginBottom: 4 }}>2026-04-21 · 11min 34s</div>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, marginBottom: 24 }}>Mobile or web first in 2026?</div>

            {[
              { p: P[0], t: 'Let me start with the simple version: make something people want. The mobile-vs-web question is almost always downstream of that.' },
              { p: P[2], t: 'Correct. And "downstream" is a polite word for "irrelevant for 90% of you."' },
              { p: P[1], t: 'I\'d frame it as leverage. Code runs on every browser already; you spend your scarce hours on product, not on App Store review.' },
              { p: P[0], t: 'There\'s a second-order thing, too. Web gets you embarrassing-fast. Your first users won\'t mind, and they\'ll tell you what to build next.' },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                <Av p={m.p} size={30}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: hueInk(m.p.hue), fontWeight: 600, marginBottom: 4 }}>{m.p.name}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: '#222' }}>{m.t}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderLeft: '1px solid #e6e2db', padding: 24, background: C_SOFT }}>
            <div style={{ fontSize: 11, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>SCORE</div>
            <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1 }}>7.8</div>
            <div style={{ fontSize: 11, color: C_MUTE }}>goal ≥ 7 · reached iter 2/3</div>

            <div style={{ marginTop: 28, fontSize: 11, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>DOWNLOAD</div>
            {[
              ['conversation.md', '48kb'],
              ['conversation.docx', '220kb'],
              ['summary.pptx', '1.4mb'],
            ].map(([n, s]) => (
              <div key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e0dbd4', fontSize: 12 }}>
                <span className="mono">{n}</span>
                <span style={{ color: C_MUTE }}>{s}</span>
              </div>
            ))}

            <div style={{ marginTop: 28, padding: 14, background: '#fff', borderRadius: 8, fontSize: 12, lineHeight: 1.5 }}>
              <b>Jump to:</b><br/>
              <span className="accent">Conclusion</span> · Satisfaction · System feedback
            </div>
          </div>
        </div>
      </Browser>
      <Note top={60} right={30} rot={2}>reading mode<br/>centric. best for<br/>post-mortem.</Note>
    </div>
  );
}

function ResultsC() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="results" />
        <div style={{ padding: '40px 60px' }}>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, marginBottom: 4 }}>Iterations · 3 runs</div>
          <div style={{ fontSize: 13, color: C_MUTE, marginBottom: 32 }}>Mobile or web first in 2026 · Ralph loop</div>

          <div style={{ position: 'relative', paddingLeft: 32, borderLeft: '2px solid #e6e2db' }}>
            {[
              { v: 5.4, note: 'Weak on concrete action items. Auto-feedback: "demand owner + deadline for each take-away."', t: '18:12', iter: 'iter 1', done: true },
              { v: 7.8, note: 'Goal reached. Paul anchored action items with deadlines; Naval added a probe.', t: '18:28', iter: 'iter 2', done: true, reached: true },
              { v: null, note: 'Idle · you can still re-run with a new criterion', t: '—', iter: 'iter 3', done: false },
            ].map((r, i) => (
              <div key={i} style={{ position: 'relative', paddingBottom: 34 }}>
                <div style={{ position: 'absolute', left: -41, top: 4, width: 18, height: 18, borderRadius: '50%', background: r.reached ? C_ACCENT : (r.done ? C_INK : '#fff'), border: r.done ? 'none' : '2px dashed #c7c4be' }}/>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>{r.iter}</div>
                  <div style={{ fontSize: 11, color: C_MUTE, fontFamily: 'ui-monospace, monospace' }}>{r.t}</div>
                  {r.v !== null && <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, marginLeft: 'auto', color: r.reached ? C_ACCENT : C_INK }}>{r.v.toFixed(1)}</div>}
                </div>
                <div style={{ fontSize: 13, color: '#444', marginTop: 6, maxWidth: 640 }}>{r.note}</div>
                {r.done && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <div className="btn" style={{ fontSize: 11 }}>Read transcript</div>
                    <div className="btn ghost" style={{ fontSize: 11, color: C_MUTE }}>diff vs prev</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: 20, background: C_SOFT, borderRadius: 12, display: 'flex', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Re-run with new feedback</div>
              <div style={{ fontSize: 12, color: C_MUTE, marginTop: 3 }}>Add a criterion or raise the score bar.</div>
            </div>
            <div className="btn primary" style={{ marginLeft: 'auto' }}>Configure →</div>
          </div>
        </div>
      </Browser>
      <Note top={80} right={30} rot={-2}>emphasizes<br/>the Ralph loop —<br/>this is the differentiator.</Note>
    </div>
  );
}

// ── 8. SETTINGS ─────────────────────────────────────────────────────────
function SettingsA() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="settings" />
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', height: 'calc(100% - 52px)' }}>
          <div style={{ borderRight: '1px solid #e6e2db', padding: 24 }}>
            <div style={{ fontSize: 11, color: C_MUTE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>SETTINGS</div>
            {['General','Model','Library paths','Theme','Tmux','About'].map((t, i) => (
              <div key={t} style={{ padding: '8px 12px', borderRadius: 6, background: i === 2 ? C_SOFT : 'transparent', fontSize: 13, fontWeight: i === 2 ? 500 : 400, marginBottom: 2 }}>{t}</div>
            ))}
          </div>
          <div style={{ padding: 40, maxWidth: 640 }}>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.4, marginBottom: 6 }}>Library paths</div>
            <div style={{ fontSize: 13, color: C_MUTE, marginBottom: 32 }}>Where your avatars and simulations live.</div>

            {[
              ['Project-local', '~/code/persona-studio', '4 avatars'],
              ['Global', '~/.persona-studio', '3 avatars'],
              ['Simulations', '~/code/persona-studio/simulations', '12 runs'],
            ].map(([l, path, meta]) => (
              <div key={l} style={{ padding: 16, border: '1px solid #e6e2db', borderRadius: 10, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{l}</div>
                  <div style={{ fontSize: 12, color: C_MUTE, fontFamily: 'ui-monospace, monospace', marginTop: 3 }}>{path}</div>
                </div>
                <div style={{ fontSize: 11, color: C_MUTE }}>{meta}</div>
                <div className="btn ghost" style={{ color: C_MUTE, fontSize: 12 }}>change</div>
              </div>
            ))}

            <div style={{ marginTop: 28, padding: 14, background: C_SOFT, borderRadius: 10, fontSize: 12, color: C_MUTE, lineHeight: 1.6 }}>
              Celebrity avatars default to the global library so they travel between projects. Private avatars stay project-local.
            </div>
          </div>
        </div>
      </Browser>
    </div>
  );
}

function SettingsB() {
  return (
    <div className="wf">
      <Browser>
        <AppNav active="settings" />
        <div style={{ padding: '48px 140px', maxWidth: 820, margin: '0 auto' }}>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.7, marginBottom: 8 }}>Settings</div>
          <div style={{ fontSize: 13, color: C_MUTE, marginBottom: 40 }}>All the knobs. Scroll through.</div>

          {[
            ['Theme', 'Light · Dark · System', 'tabs'],
            ['Model', 'claude-opus-4 · claude-sonnet-4 · claude-haiku-4', 'tabs'],
            ['Library location', '~/.persona-studio', 'path'],
            ['Tmux integration', 'Mirror panes to tmux when available', 'toggle'],
            ['Telemetry', 'Off — stays local', 'toggle'],
          ].map(([l, v, kind]) => (
            <div key={l} style={{ padding: '22px 0', borderBottom: '1px solid #efece5', display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{l}</div>
                <div style={{ fontSize: 12, color: C_MUTE, marginTop: 3, fontFamily: kind === 'path' ? 'ui-monospace, monospace' : 'inherit' }}>{v}</div>
              </div>
              {kind === 'toggle' && (
                <div style={{ width: 36, height: 20, borderRadius: 999, background: l === 'Telemetry' ? '#d8d3cb' : C_INK, position: 'relative' }}>
                  <div style={{ position: 'absolute', [l === 'Telemetry' ? 'left' : 'right']: 2, top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff' }}/>
                </div>
              )}
              {kind === 'tabs' && <div className="btn ghost" style={{ color: C_MUTE, fontSize: 12 }}>change</div>}
              {kind === 'path' && <div className="btn ghost" style={{ color: C_MUTE, fontSize: 12 }}>browse</div>}
            </div>
          ))}
        </div>
      </Browser>
      <Note top={60} right={30} rot={2}>minimal, Apple<br/>System Prefs feel.</Note>
    </div>
  );
}

window.Screens = {
  Legend,
  HomeA, HomeB, HomeC,
  LibraryA, LibraryB, LibraryC,
  DetailA, DetailB, DetailC,
  CreateA, CreateB, CreateC,
  SetupA, SetupB, SetupC,
  LiveA, LiveB, LiveC, LiveD,
  ResultsA, ResultsB, ResultsC,
  SettingsA, SettingsB,
};
