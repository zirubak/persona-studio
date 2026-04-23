// hifi-live-animated.jsx — animated Round Table simulation
// Auto-cycles through speakers with typing, ring pulse, and transcript build-up.
// Speech bubbles are rectangular "notecards" that dock around the table,
// with placement/size adaptive to the participant count (2 → 8+).
// Exposes window.HF_LiveAnimated = { LiveBAnimated }

(function(){
  const { tokens: T, PEOPLE: P, InitialsAv: Av, AppNav, Browser, Note, Kalam, Mono, Wave, Btn, Eyebrow, hueBg, hueSoft, hueDeep } = window.HF;
  const { useState, useEffect, useRef } = React;

  // Expanded pool of lines so we can drive any N-person scene. We select by
  // speaker id from this bank and fall back to a generic line for unknown P.
  const LINES_BY_ID = {
    pg:  [
      '"Most of what sounds sophisticated about mobile-first is just imitation. If two of you can\'t ship a web app in a weekend, two of you can\'t ship an iOS app in a month."',
      '"Build where friction is lowest, not where fashion is highest. Default to the web."',
    ],
    nv:  [
      '"But distribution matters. The web compounds — an app store doesn\'t."',
      '"Leverage is the point. Web = broader surface. Easier to find the thing that works."',
    ],
    dhh: [
      '"Monoliths ship. Whatever the form. Start."',
      '"Fine. But ship the boring one. Don\'t pick based on what reads well on Twitter."',
    ],
    jhb: [
      '"On mobile the install step is the tax. Most of our users never pay it."',
    ],
    dv:  [
      '"Push notifications are the only thing I miss on web — and even that\'s partly solved."',
    ],
    wb:  [
      '"From a product angle: faster iteration on web beats a slightly better mobile UX."',
    ],
    sp:  [
      '"내부 툴이면 웹이 맞다. 모바일 먼저는 과하다."',
    ],
  };
  const GENERIC_LINE = '"Agree on the constraint first — then the form follows."';
  const SPEEDS = [24, 28, 30, 32];

  // Build a script for a given roster (array of people). Rotates through
  // speakers and picks the next line from their bank.
  function buildScript(roster, turns){
    const perIdCursor = {};
    const out = [];
    for (let i = 0; i < turns; i++){
      const speaker = i % roster.length;
      const p = roster[speaker];
      const bank = LINES_BY_ID[p.id] || [GENERIC_LINE];
      const c = (perIdCursor[p.id] || 0) % bank.length;
      perIdCursor[p.id] = (perIdCursor[p.id] || 0) + 1;
      out.push({ speaker, text: bank[c], speed: SPEEDS[i % SPEEDS.length] });
    }
    return out;
  }

  const THINKING_MS = 1200;
  const LINGER_MS = 800;

  function useTyped(text, speed, enabled, onDone){
    const [out, setOut] = useState('');
    const doneRef = useRef(false);
    useEffect(() => {
      if (!enabled) { setOut(''); doneRef.current = false; return; }
      setOut('');
      doneRef.current = false;
      let i = 0;
      const tick = () => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length) {
          if (!doneRef.current) { doneRef.current = true; onDone && onDone(); }
          return;
        }
        t = setTimeout(tick, speed);
      };
      let t = setTimeout(tick, speed);
      return () => clearTimeout(t);
    }, [text, enabled]);
    return out;
  }

  // ── Seat geometry ─────────────────────────────────────────────────────────
  // Given N seats, return { seat, bubble } pairs in absolute % coordinates
  // inside the stage. Seats sit on an ellipse around the table; bubbles dock
  // OUTSIDE the seat so they don't collide with the table or each other.
  //
  // Each slot:
  //   seat:   { x, y }                        center of avatar, in %
  //   anchor: 'top'|'bottom'|'left'|'right'   which side the bubble docks to
  //   bubbleW: px                             bubble width, scales with N
  //
  function slotsFor(n){
    // table ellipse — we scale it down as N grows so the ring grows
    // bubbleW also shrinks with N, never below 180px
    const bubbleW = Math.max(180, 340 - (n - 2) * 22);

    // Anchor semantics: which SIDE of the avatar the bubble docks on.
    // Bubbles face INTO the table (toward center), so top-row seats get
    // anchor 'bottom' (bubble below avatar, toward center), and vice versa.

    if (n <= 2) {
      // 1:1 — sit across the table, bubbles float toward the center.
      return [
        { x: 22, y: 50, anchor: 'right',  bubbleW },
        { x: 78, y: 50, anchor: 'left',   bubbleW },
      ].slice(0, n);
    }

    if (n === 3) {
      return [
        { x: 50, y: 20, anchor: 'bottom', bubbleW },
        { x: 22, y: 74, anchor: 'top',    bubbleW },
        { x: 78, y: 74, anchor: 'top',    bubbleW },
      ];
    }

    if (n === 4) {
      return [
        { x: 28, y: 22, anchor: 'bottom', bubbleW },
        { x: 72, y: 22, anchor: 'bottom', bubbleW },
        { x: 28, y: 78, anchor: 'top',    bubbleW },
        { x: 72, y: 78, anchor: 'top',    bubbleW },
      ];
    }

    if (n === 5) {
      return [
        { x: 50, y: 18, anchor: 'bottom', bubbleW },
        { x: 20, y: 42, anchor: 'right',  bubbleW },
        { x: 80, y: 42, anchor: 'left',   bubbleW },
        { x: 30, y: 80, anchor: 'top',    bubbleW },
        { x: 70, y: 80, anchor: 'top',    bubbleW },
      ];
    }
    if (n === 6) {
      return [
        { x: 28, y: 20, anchor: 'bottom', bubbleW },
        { x: 72, y: 20, anchor: 'bottom', bubbleW },
        { x: 16, y: 50, anchor: 'right',  bubbleW },
        { x: 84, y: 50, anchor: 'left',   bubbleW },
        { x: 28, y: 80, anchor: 'top',    bubbleW },
        { x: 72, y: 80, anchor: 'top',    bubbleW },
      ];
    }
    if (n === 7) {
      return [
        { x: 50, y: 20, anchor: 'bottom', bubbleW },
        { x: 22, y: 30, anchor: 'bottom', bubbleW },
        { x: 78, y: 30, anchor: 'bottom', bubbleW },
        { x: 16, y: 60, anchor: 'right',  bubbleW },
        { x: 84, y: 60, anchor: 'left',   bubbleW },
        { x: 32, y: 80, anchor: 'top',    bubbleW },
        { x: 68, y: 80, anchor: 'top',    bubbleW },
      ];
    }
    // 8: balanced oval ring, vertical spread 20–80%, all bubbles face center.
    const slots8 = [
      { x: 28, y: 22, anchor: 'bottom' },
      { x: 50, y: 18, anchor: 'bottom' },
      { x: 72, y: 22, anchor: 'bottom' },
      { x: 14, y: 50, anchor: 'right'  },
      { x: 86, y: 50, anchor: 'left'   },
      { x: 28, y: 78, anchor: 'top'    },
      { x: 50, y: 82, anchor: 'top'    },
      { x: 72, y: 78, anchor: 'top'    },
    ];
    return slots8.slice(0, n).map(s => ({ ...s, bubbleW: Math.max(180, 280 - (n - 8) * 10) }));
  }

  function LiveTopBar({ elapsed, turn, turns, onRestart, paused, onTogglePause, title, nPeople, setNPeople }){
    const min = Math.floor(elapsed / 60);
    const sec = String(Math.floor(elapsed) % 60).padStart(2, '0');
    return (
      <div style={{ padding: '16px 32px', borderBottom: `1px solid ${T.hair}`, display: 'flex', alignItems: 'center', gap: 20, background: T.paper }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2 }}>{title}</div>
          <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.mute, marginTop: 3, letterSpacing: 1 }}>
            MEETING · ITER 1/3 · TURN {turn + 1}/{turns} · {min}:{sec}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Seat-count tweaker lives in the top bar so it never collides
              with on-stage seats/bubbles. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 999, padding: 3 }}>
            <span style={{ padding: '0 8px', fontFamily: T.fMono, fontSize: 9, color: T.mute, letterSpacing: 1.2 }}>SEATS</span>
            {[2,3,4,6,8].map(n => (
              <div key={n} onClick={() => setNPeople(n)} style={{
                padding: '3px 9px', borderRadius: 999, cursor: 'pointer',
                fontFamily: T.fMono, fontSize: 11,
                background: nPeople === n ? T.ink : 'transparent',
                color: nPeople === n ? '#fff' : T.inkSoft,
                fontWeight: nPeople === n ? 500 : 400,
              }}>{n}</div>
            ))}
          </div>
          <div onClick={onTogglePause} style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: 999, fontSize: 12, color: T.mute, fontFamily: T.fMono, letterSpacing: 1 }}>
            {paused ? '▶ RESUME' : '❚❚ PAUSE'}
          </div>
          <div onClick={onRestart} style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontFamily: T.fMono, letterSpacing: 1, color: T.mute }}>
            ↻ REPLAY
          </div>
          <div style={{ padding: '8px 16px', borderRadius: 999, fontSize: 13, background: T.ink, color: '#fff', fontWeight: 500 }}>
            End →
          </div>
        </div>
      </div>
    );
  }

  // ── Rectangular speech notecard ───────────────────────────────────────────
  // Shape: wide rectangle with a slim colored header strip (name + role),
  // a generous body for the quoted line, and a small pointer (triangle or
  // short connector line) aimed at the speaker's avatar. This reads more
  // like a printed attribution card than a chat bubble — which keeps it
  // legible even at small widths when there are many people at the table.
  function SpeechCard({ person, text, anchor, width, active }){
    const hue = hueBg(person.hue);
    const deep = hueDeep(person.hue);
    // Pointer lives on the side facing the avatar.
    const pointerSide = {
      top:    { bottom: -7, left: '50%', mx: '-50%', rot: 45,  borderSides: 'rb' }, // bubble above avatar, pointer below
      bottom: { top: -7,    left: '50%', mx: '-50%', rot: 45,  borderSides: 'lt' }, // bubble below avatar, pointer above
      left:   { right: -7,  top: '50%',  my: '-50%', rot: 45,  borderSides: 'rt' }, // bubble left of avatar, pointer right
      right:  { left: -7,   top: '50%',  my: '-50%', rot: 45,  borderSides: 'lb' }, // bubble right of avatar, pointer left
    }[anchor];
    const bSides = pointerSide.borderSides;
    return (
      <div style={{
        width, background: '#fff',
        border: `1.5px solid ${hue}`, borderRadius: 6,
        boxShadow: active ? `0 14px 36px ${hue}33, 0 2px 6px rgba(0,0,0,0.04)` : `0 4px 14px ${hue}18`,
        position: 'relative',
        animation: 'fadeUp 280ms cubic-bezier(.2,.7,.3,1)',
        overflow: 'visible',
      }}>
        {/* header strip */}
        <div style={{
          padding: '7px 12px', borderBottom: `1px solid ${hue}55`,
          background: hueSoft(person.hue),
          display: 'flex', alignItems: 'center', gap: 8,
          borderRadius: '5px 5px 0 0',
          fontFamily: T.fMono, fontSize: 9, letterSpacing: 1.2, color: deep,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: deep }}/>
          <span style={{ textTransform: 'uppercase', fontWeight: 500 }}>{person.name}</span>
          <span style={{ marginLeft: 'auto', opacity: 0.7 }}>SPEAKING</span>
        </div>
        {/* body — quoted line */}
        <div style={{
          padding: '11px 14px 13px',
          fontFamily: T.fDisplay, fontWeight: 300, fontSize: 14, lineHeight: 1.42,
          letterSpacing: -0.15, color: T.ink,
          textWrap: 'pretty',
        }}>
          {text}
          <span style={{
            display: 'inline-block', width: 2, height: 13, background: deep,
            verticalAlign: '-2px', marginLeft: 2, animation: 'blink .9s infinite',
          }}/>
        </div>
        {/* pointer: a small square rotated 45° that sits on the bubble edge
            closest to the avatar. We hide two of its borders so it reads as
            a triangle continuous with the bubble outline. */}
        <div style={{
          position: 'absolute',
          top: pointerSide.top, bottom: pointerSide.bottom,
          left: pointerSide.left, right: pointerSide.right,
          transform: `translate(${pointerSide.mx || 0}, ${pointerSide.my || 0}) rotate(${pointerSide.rot}deg)`,
          width: 11, height: 11, background: '#fff',
          borderTop: bSides.includes('t') ? `1.5px solid ${hue}` : 'none',
          borderBottom: bSides.includes('b') ? `1.5px solid ${hue}` : 'none',
          borderLeft: bSides.includes('l') ? `1.5px solid ${hue}` : 'none',
          borderRight: bSides.includes('r') ? `1.5px solid ${hue}` : 'none',
        }}/>
      </div>
    );
  }

  // Offset from the avatar center to the bubble edge (in px), so pointer
  // meets the avatar cleanly. We keep a small gap.
  const AVATAR_PAD = 40;

  function LiveBAnimated(){
    // Tweakable roster size so user can see bubble behavior across counts.
    const [nPeople, setNPeople] = useState(() => {
      try { return parseInt(localStorage.getItem('ps_live_n') || '4', 10); } catch { return 4; }
    });
    const roster = P.slice(0, nPeople);
    const script = React.useMemo(() => buildScript(roster, Math.max(6, nPeople * 2)), [nPeople]);

    const [turnIdx, setTurnIdx] = useState(0);
    const [phase, setPhase] = useState('thinking');
    const [elapsed, setElapsed] = useState(0);
    const [paused, setPaused] = useState(false);
    const [transcript, setTranscript] = useState([]);
    const [nonce, setNonce] = useState(0);

    // Reset when roster changes
    useEffect(() => {
      setTurnIdx(0); setPhase('thinking'); setElapsed(0); setTranscript([]); setNonce(n => n + 1);
      try { localStorage.setItem('ps_live_n', String(nPeople)); } catch {}
    }, [nPeople]);

    useEffect(() => {
      if (paused) return;
      const id = setInterval(() => setElapsed(e => e + 0.1), 100);
      return () => clearInterval(id);
    }, [paused]);

    useEffect(() => {
      if (paused) return;
      if (phase === 'thinking') {
        const t = setTimeout(() => setPhase('speaking'), THINKING_MS);
        return () => clearTimeout(t);
      }
      if (phase === 'linger') {
        const t = setTimeout(() => {
          setTranscript(tr => [{ ...script[turnIdx], time: elapsed }, ...tr]);
          setTurnIdx(i => (i + 1) % script.length);
          setPhase('thinking');
        }, LINGER_MS);
        return () => clearTimeout(t);
      }
    }, [phase, paused, turnIdx, script]);

    const current = script[turnIdx] || script[0];
    const speakingPerson = roster[current.speaker];

    const typed = useTyped(
      current.text,
      current.speed,
      phase === 'speaking' && !paused,
      () => setPhase('linger')
    );

    const slots = slotsFor(nPeople);

    const handleRestart = () => {
      setTurnIdx(0); setPhase('thinking'); setElapsed(0); setTranscript([]); setNonce(n => n + 1);
    };

    const ralphDraft = Math.min(7.8, 5.2 + (turnIdx * 0.35) + (phase === 'speaking' ? typed.length / current.text.length * 0.3 : 0.3)).toFixed(1);

    // Stage sizing: table ellipse is now PURELY DECORATIVE — bubbles float
    // above it toward the center. We keep it small-ish so the center has
    // breathing room for the active speaker's card.
    const stageTable = (() => {
      if (nPeople <= 2) return { w: 260, h: 160 };
      if (nPeople <= 3) return { w: 260, h: 160 };
      if (nPeople <= 4) return { w: 300, h: 170 };
      if (nPeople <= 6) return { w: 260, h: 150 };
      if (nPeople <= 7) return { w: 220, h: 130 };
      return { w: 200, h: 120 };
    })();

    // Position the bubble absolute in the stage, offset from the seat by
    // the bubble's own dimensions + avatar pad. We compute CSS positions
    // from the seat's %-coords and the bubble anchor.
    function bubbleStyleFor(slot){
      const base = { position: 'absolute', pointerEvents: 'auto' };
      const gap = AVATAR_PAD; // px from avatar center to bubble edge
      // place bubble relative to seat %. Use calc to combine % with px offsets.
      if (slot.anchor === 'top') {
        return { ...base, left: `${slot.x}%`, bottom: `calc(${100 - slot.y}% + ${gap}px)`, transform: 'translateX(-50%)' };
      }
      if (slot.anchor === 'bottom') {
        return { ...base, left: `${slot.x}%`, top: `calc(${slot.y}% + ${gap}px)`, transform: 'translateX(-50%)' };
      }
      if (slot.anchor === 'left') {
        return { ...base, top: `${slot.y}%`, right: `calc(${100 - slot.x}% + ${gap}px)`, transform: 'translateY(-50%)' };
      }
      return { ...base, top: `${slot.y}%`, left: `calc(${slot.x}% + ${gap}px)`, transform: 'translateY(-50%)' };
    }

    return (
      <Browser>
        <AppNav active="sim"/>
        <LiveTopBar
          elapsed={elapsed}
          turn={turnIdx}
          turns={script.length}
          onRestart={handleRestart}
          paused={paused}
          onTogglePause={() => setPaused(p => !p)}
          nPeople={nPeople}
          setNPeople={setNPeople}
          title={nPeople <= 2 ? '1:1 — Mobile vs web first in 2026'
               : nPeople <= 4 ? 'Mobile vs web first in 2026'
               : 'Roundtable — Mobile vs web first in 2026'}
        />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
          {/* Stage */}
          <div style={{ position: 'relative', padding: 24, background: `radial-gradient(ellipse 800px 500px at 50% 50%, ${T.paperSoft} 0%, ${T.paper} 70%)`, overflow: 'hidden' }}>
            {/* Table ellipse — now sized to leave room for bubbles outside */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: stageTable.w, height: stageTable.h,
              borderRadius: stageTable.h,
              border: `1.5px solid ${T.hair}`, background: '#fff',
              boxShadow: `0 24px 80px ${T.paperDeep}80`,
              transition: 'width 350ms, height 350ms',
            }}>
              <div style={{ position: 'absolute', inset: 14, borderRadius: stageTable.h, border: `1px dashed ${T.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', padding: 12 }}>
                  <Kalam size={12} color={T.mute}>the table</Kalam>
                  <div style={{ fontFamily: T.fDisplay, fontStyle: 'italic', fontWeight: 300, fontSize: nPeople <= 4 ? 18 : 15, letterSpacing: -0.4, marginTop: 2, lineHeight: 1.15 }}>
                    "Mobile vs web,<br/>2026?"
                  </div>
                </div>
              </div>
            </div>

            {/* Seats (avatars) */}
            {slots.map((slot, i) => {
              const p = roster[i];
              if (!p) return null;
              const active = p.id === speakingPerson.id && phase === 'speaking';
              const thinking = p.id === speakingPerson.id && phase === 'thinking';
              const c = hueBg(p.hue);
              const avSize = nPeople <= 3 ? 74 : nPeople <= 5 ? 64 : nPeople <= 6 ? 58 : 50;
              return (
                <div key={p.id} style={{
                  position: 'absolute',
                  left: `${slot.x}%`, top: `${slot.y}%`,
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  transition: 'all 350ms cubic-bezier(.2,.7,.3,1)',
                  zIndex: active ? 10 : 5,
                }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{ transform: active ? 'scale(1.08)' : 'scale(1)', transition: 'transform 400ms cubic-bezier(.2,.7,.3,1)' }}>
                      <Av p={p} size={avSize} ring={active}/>
                    </div>
                    {active && (
                      <>
                        <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `1.5px solid ${c}`, animation: 'ring 1.8s ease-out infinite' }}/>
                        <div style={{ position: 'absolute', inset: -18, borderRadius: '50%', border: `1px solid ${c}66`, animation: 'ring 1.8s ease-out infinite .4s' }}/>
                      </>
                    )}
                    {thinking && (
                      <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 999, padding: '2px 8px', fontFamily: T.fMono, fontSize: 9, color: T.mute, display: 'flex', gap: 3, alignItems: 'center' }}>
                        <span style={{ display: 'inline-block', width: 3, height: 3, borderRadius: '50%', background: T.accent, animation: 'blink 1s infinite' }}/>
                        <span style={{ display: 'inline-block', width: 3, height: 3, borderRadius: '50%', background: T.accent, animation: 'blink 1s infinite .2s' }}/>
                        <span style={{ display: 'inline-block', width: 3, height: 3, borderRadius: '50%', background: T.accent, animation: 'blink 1s infinite .4s' }}/>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: nPeople <= 4 ? 13 : 11, fontWeight: 500, marginTop: 8, opacity: active ? 1 : 0.85 }}>{p.name.split(' ')[0]}{p.name.split(' ')[1] ? ' ' + p.name.split(' ')[1][0] + '.' : ''}</div>
                  {nPeople <= 5 && (
                    <Mono size={9} color={active ? hueDeep(p.hue) : thinking ? T.accent : T.mute}>
                      {active ? '● SPEAKING' : thinking ? '● THINKING' : 'IDLE'}
                    </Mono>
                  )}
                </div>
              );
            })}

            {/* Speech card — rendered only for the currently-speaking seat,
                docked on the side opposite the table center. */}
            {phase === 'speaking' && (() => {
              const idx = current.speaker;
              const slot = slots[idx];
              if (!slot) return null;
              return (
                <div style={{ ...bubbleStyleFor(slot), zIndex: 40 }}>
                  <SpeechCard
                    person={roster[idx]}
                    text={typed}
                    anchor={slot.anchor}
                    width={slot.bubbleW}
                    active
                  />
                </div>
              );
            })()}

            {/* Facilitator chip */}
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 8px 8px', background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 999, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `conic-gradient(from 180deg, ${T.accent}, ${T.cool}, ${T.accent})`, animation: 'spin 8s linear infinite' }}/>
              <Mono size={10}>FACILITATOR · CLAUDE</Mono>
            </div>

            {/* Ralph draft score */}
            <div style={{ position: 'absolute', bottom: 16, left: 16, background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.coolSoft, color: T.cool, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fDisplay, fontSize: 15, fontWeight: 500 }}>
                {ralphDraft}
              </div>
              <div>
                <Mono size={9} color={T.mute}>RALPH · DRAFT</Mono>
                <div style={{ fontSize: 11, color: T.mute, marginTop: 2 }}>target ≥ 7.0</div>
              </div>
            </div>
          </div>

          {/* Transcript rail */}
          <div style={{ borderLeft: `1px solid ${T.hair}`, padding: 24, background: T.paper, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Eyebrow>TRANSCRIPT · LIVE</Eyebrow>
            <div style={{ marginTop: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto' }}>
              {phase === 'speaking' && (
                <div style={{ display: 'flex', gap: 12, animation: 'fadeUp 300ms' }}>
                  <Av p={speakingPerson} size={28}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{speakingPerson.name.split(' ')[0]}</div>
                      <Mono size={9} color={hueDeep(speakingPerson.hue)}>● LIVE</Mono>
                    </div>
                    <div style={{ fontFamily: T.fDisplay, fontWeight: 300, fontSize: 13, lineHeight: 1.5, letterSpacing: -0.1, marginTop: 4, color: T.ink }}>
                      {typed}
                      <span style={{ display: 'inline-block', width: 1.5, height: 12, background: hueBg(speakingPerson.hue), verticalAlign: 'middle', marginLeft: 2, animation: 'blink .9s infinite' }}/>
                    </div>
                  </div>
                </div>
              )}
              {transcript.map((m, i) => {
                const p = roster[m.speaker];
                if (!p) return null;
                const min = Math.floor(m.time / 60);
                const sec = String(Math.floor(m.time) % 60).padStart(2, '0');
                return (
                  <div key={nonce + '-' + i} style={{ display: 'flex', gap: 12, opacity: 1 - Math.min(0.5, i * 0.08), animation: 'fadeUp 300ms' }}>
                    <Av p={p} size={28}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{p.name.split(' ')[0]}</div>
                        <Mono size={9}>{min}:{sec}</Mono>
                      </div>
                      <div style={{ fontFamily: T.fDisplay, fontWeight: 300, fontSize: 13, lineHeight: 1.5, letterSpacing: -0.1, marginTop: 4, color: T.inkSoft }}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              {transcript.length === 0 && phase !== 'speaking' && (
                <div style={{ fontSize: 12, color: T.mute, fontStyle: 'italic', padding: '20px 0' }}>
                  Waiting for first turn…
                </div>
              )}
            </div>
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${T.hair}`, display: 'flex', justifyContent: 'space-between' }}>
              <Mono size={10}>{transcript.length + (phase === 'speaking' ? 1 : 0)} TURNS · {Math.floor(elapsed * 120)} TOK</Mono>
              <Mono size={10} color={T.cool}>RALPH {ralphDraft}</Mono>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
          @keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
          @keyframes ring { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(1.4); opacity: 0; } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        `}</style>
      </Browser>
    );
  }

  window.HF_LiveAnimated = { LiveBAnimated };
})();
