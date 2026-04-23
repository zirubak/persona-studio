// hifi-library.jsx — 2 takes on the Library/Cast

(function(){
  const { tokens: T, PEOPLE: P, InitialsAv: PhotoAv, AppNav, Browser, Note, Kalam, Mono, Display, Btn, Eyebrow, hueBg, hueSoft, hueDeep } = window.HF;
  const { useState, useEffect } = React;

  // ── Import modal ──────────────────────────────────────────────────────────
  // Three ingestion paths: URL (blogs, feeds), File (txt/md/pdf/chat export),
  // Clipboard (paste raw text). Same detection/preview steps for all.
  function ImportModal({ onClose }){
    const [tab, setTab] = useState('url');
    const [url, setUrl] = useState('https://paulgraham.com/articles.html');
    const [stage, setStage] = useState('input'); // input | detecting | preview
    const detect = () => {
      setStage('detecting');
      setTimeout(() => setStage('preview'), 1200);
    };
    const tabs = [
      ['url',  'URL / RSS',       '🔗'],
      ['file', 'Files',           '↑'],
      ['clip', 'Paste text',      '⌘V'],
    ];
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(26,23,20,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 720, maxHeight: '90%', background: '#fff', borderRadius: 18, boxShadow: '0 30px 80px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: T.fSans }}>
          {/* Header */}
          <div style={{ padding: '20px 28px', borderBottom: `1px solid ${T.hair}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Eyebrow>IMPORT AVATAR</Eyebrow>
            <div style={{ flex: 1 }}/>
            <Mono size={10} style={{ padding: '3px 8px', background: T.paperSoft, borderRadius: 4 }}>LOCAL · NEVER UPLOADED</Mono>
            <div onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, color: T.mute }}>×</div>
          </div>

          {/* Tabs */}
          <div style={{ padding: '0 28px', display: 'flex', gap: 2, borderBottom: `1px solid ${T.hair}` }}>
            {tabs.map(([k, l, i]) => (
              <div key={k} onClick={() => { setTab(k); setStage('input'); }} style={{
                padding: '14px 18px', fontSize: 13, cursor: 'pointer',
                borderBottom: tab === k ? `2px solid ${T.ink}` : '2px solid transparent',
                color: tab === k ? T.ink : T.mute,
                fontWeight: tab === k ? 500 : 400,
                marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontFamily: T.fMono, fontSize: 11 }}>{i}</span>
                {l}
              </div>
            ))}
          </div>

          {/* Body */}
          <div style={{ padding: 28, flex: 1, overflow: 'auto' }}>
            {stage === 'input' && tab === 'url' && (
              <div>
                <div style={{ fontFamily: T.fDisplay, fontSize: 22, letterSpacing: -0.5 }}>Paste a URL or RSS feed</div>
                <div style={{ fontSize: 13, color: T.mute, marginTop: 6, lineHeight: 1.5 }}>
                  We'll crawl the site, parse essays, and build a persona from the writing. Works with blogs, Substack, Medium exports, RSS/Atom.
                </div>
                <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, padding: '12px 14px', border: `1px solid ${T.hair}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, background: T.paperSoft }}>
                    <span style={{ fontFamily: T.fMono, color: T.mute }}>🔗</span>
                    <input value={url} onChange={e => setUrl(e.target.value)} style={{ flex: 1, border: 0, background: 'transparent', fontSize: 14, color: T.ink, outline: 'none', fontFamily: T.fMono }}/>
                  </div>
                  <div onClick={detect}>
                    <Btn primary style={{ cursor: 'pointer', padding: '12px 20px' }}>Detect →</Btn>
                  </div>
                </div>
                <div style={{ marginTop: 20 }}>
                  <Mono size={10}>TRY THESE</Mono>
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      'paulgraham.com/articles.html',
                      'nav.al/rss',
                      'world.hey.com/dhh',
                      'stratechery.com/feed',
                    ].map(s => (
                      <div key={s} onClick={() => setUrl('https://' + s)} style={{ padding: '6px 11px', borderRadius: 999, border: `1px solid ${T.hair}`, fontFamily: T.fMono, fontSize: 11, color: T.inkSoft, cursor: 'pointer', background: '#fff' }}>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {stage === 'input' && tab === 'file' && (
              <div>
                <div style={{ fontFamily: T.fDisplay, fontSize: 22, letterSpacing: -0.5 }}>Drop files or a folder</div>
                <div style={{ fontSize: 13, color: T.mute, marginTop: 6, lineHeight: 1.5 }}>
                  Markdown, plain text, PDF, or chat exports (Slack, iMessage, WhatsApp JSON). Everything is parsed locally.
                </div>
                <div style={{ marginTop: 18, padding: 40, border: `2px dashed ${T.hair}`, borderRadius: 14, textAlign: 'center', background: T.paperSoft }}>
                  <div style={{ fontSize: 36, color: T.accent, lineHeight: 1 }}>↑</div>
                  <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500 }}>Drop files here</div>
                  <Mono size={11} style={{ marginTop: 6 }}>OR CLICK TO BROWSE · .MD .TXT .PDF .JSON .ZIP</Mono>
                  <div onClick={detect} style={{ marginTop: 18, display: 'inline-block' }}>
                    <Btn primary style={{ cursor: 'pointer' }}>Choose files</Btn>
                  </div>
                </div>
                <div style={{ marginTop: 16, fontSize: 12, color: T.mute, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: T.green }}/>
                  Files stay on your machine. Parsing happens in your browser.
                </div>
              </div>
            )}

            {stage === 'input' && tab === 'clip' && (
              <div>
                <div style={{ fontFamily: T.fDisplay, fontSize: 22, letterSpacing: -0.5 }}>Paste raw text</div>
                <div style={{ fontSize: 13, color: T.mute, marginTop: 6, lineHeight: 1.5 }}>
                  Tweets, transcripts, notes, a single great email. Good for quick one-off personas.
                </div>
                <textarea placeholder="Paste anything here — essays, tweets, transcripts, chat logs…" style={{
                  width: '100%', marginTop: 14, minHeight: 180, padding: 14, borderRadius: 10,
                  border: `1px solid ${T.hair}`, background: T.paperSoft, resize: 'vertical',
                  fontFamily: T.fMono, fontSize: 12.5, color: T.ink, outline: 'none', lineHeight: 1.5,
                }}/>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Mono size={10}>0 WORDS · 0 TOKENS</Mono>
                  <div style={{ flex: 1 }}/>
                  <div onClick={detect}>
                    <Btn primary style={{ cursor: 'pointer' }}>Build avatar →</Btn>
                  </div>
                </div>
              </div>
            )}

            {stage === 'detecting' && (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Mono size={11} color={T.accent}>ANALYZING</Mono>
                <div style={{ fontFamily: T.fDisplay, fontSize: 26, letterSpacing: -0.6, marginTop: 10 }}>
                  Reading the writing…
                </div>
                <div style={{ marginTop: 28, maxWidth: 360, margin: '28px auto 0' }}>
                  {[
                    ['Fetching source',    'done'],
                    ['Parsing 184 essays', 'done'],
                    ['Extracting voice',   'running'],
                    ['Building corpus',    'queued'],
                  ].map(([l, s], i) => (
                    <div key={i} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i === 3 ? 'none' : `1px solid ${T.hair}`, fontSize: 13 }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%',
                        background: s === 'done' ? T.cool : s === 'running' ? T.accent : T.paperSoft,
                        border: s === 'queued' ? `1px solid ${T.hair}` : 'none',
                      }}/>
                      <div style={{ flex: 1, textAlign: 'left', color: s === 'queued' ? T.mute : T.ink }}>{l}</div>
                      <Mono size={10} color={s === 'done' ? T.cool : T.mute}>{s.toUpperCase()}</Mono>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stage === 'preview' && (
              <div>
                <Mono size={10} color={T.cool}>READY TO ADD</Mono>
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '140px 1fr', gap: 24, alignItems: 'center' }}>
                  <div style={{ width: 140, height: 140, borderRadius: 16, background: `linear-gradient(180deg, ${hueSoft(28)} 0%, ${hueBg(28)}33 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PhotoAv p={{ id: 'pg', name: 'Paul Graham', hue: 28 }} size={90}/>
                  </div>
                  <div>
                    <div style={{ fontFamily: T.fDisplay, fontSize: 30, letterSpacing: -0.8 }}>Paul Graham</div>
                    <div style={{ fontSize: 13, color: T.mute, marginTop: 4 }}>Essayist · Y Combinator · paulgraham.com</div>
                    <div style={{ marginTop: 14, display: 'flex', gap: 18 }}>
                      {[
                        ['184', 'essays'],
                        ['84k', 'tokens'],
                        ['2004–2025', 'span'],
                      ].map(([n, l]) => (
                        <div key={l}>
                          <div style={{ fontFamily: T.fDisplay, fontSize: 22 }}>{n}</div>
                          <Mono size={10}>{l.toUpperCase()}</Mono>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 22, padding: 14, background: T.paperSoft, borderRadius: 10 }}>
                  <Mono size={10}>VOICE SAMPLE (FIRST 20 WORDS)</Mono>
                  <div style={{ fontFamily: T.fDisplay, fontStyle: 'italic', fontSize: 16, color: T.ink, marginTop: 6, lineHeight: 1.4 }}>
                    "The essays on this site try to figure out things that I didn't already know. That's what essays are for…"
                  </div>
                </div>
                <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.inkSoft, cursor: 'pointer' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${T.ink}`, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>✓</div>
                    Public persona
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.inkSoft, cursor: 'pointer' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${T.hair}` }}/>
                    Share with my library
                  </label>
                  <div style={{ flex: 1 }}/>
                  <Btn style={{ cursor: 'pointer' }} onClick={() => setStage('input')}>← Back</Btn>
                  <div onClick={onClose}>
                    <Btn accent style={{ cursor: 'pointer' }}>Add to library →</Btn>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // A · EDITORIAL GRID — feels like a masthead of contributors
  function LibraryA(){
    const [importOpen, setImportOpen] = useState(false);
    // Phase 1 wiring: fetch real personas from the local backend. On
    // failure (server not running, fetch blocked, etc.) we fall through
    // to `P` (window.HF.PEOPLE mock) so the screen still renders —
    // offline viewers and the static prototype preview keep working.
    const [people, setPeople] = useState(null);
    useEffect(() => {
      fetch('/api/personas')
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(data => Array.isArray(data) ? setPeople(data) : setPeople([]))
        .catch(() => setPeople(null));
    }, []);
    const list = (people !== null && people.length > 0) ? people : P;
    return (
      <Browser>
        <AppNav active="library"/>
        <div style={{ flex: 1, overflow: 'auto', padding: '48px 72px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
            <div>
              <Eyebrow>THE CAST · 7</Eyebrow>
              <div style={{ fontFamily: T.fDisplay, fontWeight: 400, fontSize: 56, letterSpacing: -2, lineHeight: 1, marginTop: 10 }}>
                Seven voices, <span style={{ fontStyle: 'italic', fontWeight: 300 }}>ready.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['All','Local 4','Global 3','Private'].map((t,i) => (
                <div key={t} style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, background: i === 0 ? T.ink : 'transparent', color: i === 0 ? '#fff' : T.inkSoft, border: i === 0 ? 'none' : `1px solid ${T.hair}` }}>{t}</div>
              ))}
              <div onClick={() => setImportOpen(true)} style={{ cursor: 'pointer', marginLeft: 12 }}>
                <Btn primary>+ New avatar</Btn>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {list.map((p, i) => (
              <div key={p.id || p.name} style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', border: `1px solid ${T.hair}` }}>
                {/* Portrait header */}
                <div style={{ position: 'relative', height: 220, background: `linear-gradient(180deg, ${hueSoft(p.hue)} 0%, ${hueBg(p.hue)}33 100%)`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 16 }}>
                  <PhotoAv p={p} size={130}/>
                  <div style={{ position: 'absolute', top: 14, left: 14 }}>
                    <Mono size={9} color={hueDeep(p.hue)} style={{ padding: '3px 8px', background: '#fff', borderRadius: 4, letterSpacing: 1.5 }}>
                      {p.mode === 'private' ? '· PRIVATE' : '· PUBLIC'}
                    </Mono>
                  </div>
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ fontFamily: T.fDisplay, fontSize: 22, fontWeight: 400, letterSpacing: -0.5, lineHeight: 1.1 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: T.mute, marginTop: 4 }}>{p.role}</div>
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.hair}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Mono size={10}>{p.born ? `b.${p.born}` : ''}{p.born && p.corpus ? ' · ' : ''}{p.corpus || ''}</Mono>
                    <div style={{ fontSize: 13, color: T.accent }}>→</div>
                  </div>
                </div>
              </div>
            ))}
            {/* Add card */}
            <div onClick={() => setImportOpen(true)} style={{ borderRadius: 18, border: `1.5px dashed ${T.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 340, color: T.mute, fontSize: 13, background: 'transparent', cursor: 'pointer' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8, color: T.accent }}>+</div>
                <Kalam size={14} color={T.mute}>add a voice</Kalam>
              </div>
            </div>
          </div>
          {importOpen && <ImportModal onClose={() => setImportOpen(false)}/>}
        </div>
        <Note top={70} right={40} rot={3} w={140} arrow>
          portraits as<br/>big as the names.<br/>people first.
        </Note>
      </Browser>
    );
  }

  // B · MUSEUM ROW — editorial horizontal scroll
  function LibraryB(){
    return (
      <Browser>
        <AppNav active="library"/>
        <div style={{ flex: 1, overflow: 'hidden', padding: '60px 72px 0' }}>
          <Eyebrow>THE CAST</Eyebrow>
          <div style={{ fontFamily: T.fDisplay, fontWeight: 400, fontSize: 64, letterSpacing: -2.2, lineHeight: 1, marginTop: 14, marginBottom: 40 }}>
            Seven voices, <span style={{ fontStyle: 'italic', fontWeight: 300 }}>ready to argue.</span>
          </div>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end', overflowX: 'auto', paddingBottom: 32 }}>
            {P.map((p, i) => {
              const rot = (i % 2 ? 1 : -1) * (0.4 + (i % 3) * 0.3);
              return (
                <div key={p.id} style={{ flex: '0 0 auto', width: 200, textAlign: 'center' }}>
                  <div style={{
                    width: 200, height: 280, borderRadius: 10,
                    background: `linear-gradient(180deg, ${hueSoft(p.hue)} 0%, ${hueBg(p.hue)}22 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: `rotate(${rot}deg)`,
                    boxShadow: `0 20px 40px ${T.paperDeep}40`,
                  }}>
                    <PhotoAv p={p} size={140}/>
                  </div>
                  <div style={{ fontFamily: T.fDisplay, fontSize: 18, fontWeight: 400, letterSpacing: -0.4, marginTop: 18 }}>{p.name}</div>
                  <Mono size={10} style={{ marginTop: 4 }}>{p.role}</Mono>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
            <Btn primary size="lg">+ Add new voice</Btn>
            <Kalam size={14} color={T.mute}>or drag a folder here to build one automatically</Kalam>
          </div>
        </div>
        <Note top={50} right={40} rot={-3} w={150}>
          editorial / museum.<br/>risky. memorable.
        </Note>
      </Browser>
    );
  }

  window.HF_Library = { LibraryA, LibraryB };
})();
