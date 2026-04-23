// hifi-results.jsx — 3 takes on simulation results, with playful Ralph score viz

(function(){
  const { tokens: T, PEOPLE: P, InitialsAv: PhotoAv, AppNav, Browser, Note, Kalam, Mono, RalphRing, Btn, Eyebrow, hueBg, hueSoft, hueDeep } = window.HF;
  const { useState, useEffect } = React;

  // Ralph trajectory — shows iteration-over-iteration improvement
  const RalphTrajectory = ({ scores = [5.2, 6.4, 8.1], target = 7, width = 420, height = 140 }) => {
    const pad = 20;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const points = scores.map((s, i) => ({
      x: pad + (i / Math.max(scores.length - 1, 1)) * w,
      y: pad + (1 - s / 10) * h,
      s,
    }));
    const targetY = pad + (1 - target / 10) * h;
    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        {/* grid */}
        {[0, 2.5, 5, 7.5, 10].map(v => {
          const y = pad + (1 - v / 10) * h;
          return <line key={v} x1={pad} y1={y} x2={pad + w} y2={y} stroke={T.hair} strokeWidth="1"/>;
        })}
        {/* target line */}
        <line x1={pad} y1={targetY} x2={pad + w} y2={targetY} stroke={T.accent} strokeWidth="1.5" strokeDasharray="4 3"/>
        <text x={pad + w - 4} y={targetY - 4} textAnchor="end" fontSize="10" fontFamily={T.fMono} fill={T.accent}>TARGET {target}</text>
        {/* path */}
        <path d={`M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`} fill="none" stroke={T.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={p.s >= target ? 8 : 6} fill={p.s >= target ? T.cool : T.ink}/>
            <circle cx={p.x} cy={p.y} r={p.s >= target ? 8 : 6} fill="none" stroke="#fff" strokeWidth="2"/>
            <text x={p.x} y={p.y + 24} textAnchor="middle" fontSize="11" fontFamily={T.fMono} fill={T.mute}>iter {i+1}</text>
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="13" fontWeight="500" fontFamily={T.fSans} fill={T.ink}>{p.s.toFixed(1)}</text>
          </g>
        ))}
      </svg>
    );
  };

  // Per-criterion bars
  const CriteriaBars = ({ data }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((d, i) => {
        const passed = d.score >= d.target;
        const c = passed ? T.cool : T.accent;
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 44px', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: T.inkSoft }}>{d.label}</div>
            <div style={{ height: 6, background: T.paperSoft, borderRadius: 3, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${d.score * 10}%`, background: c, borderRadius: 3 }}/>
              <div style={{ position: 'absolute', left: `${d.target * 10}%`, top: -3, height: 12, width: 1.5, background: T.ink }}/>
            </div>
            <Mono size={11} color={c} style={{ textAlign: 'right', fontWeight: 500 }}>{d.score.toFixed(1)}</Mono>
          </div>
        );
      })}
    </div>
  );

  // A · SCORECARD HERO — celebrate the result
  function ResultsA(){
    // Phase 1 wiring: fetch the list of past simulations and overlay
    // the newest one's topic + score onto the hero. The criteria /
    // trajectory / transcript preview below stay mock for this phase —
    // per-simulation detail needs /api/simulations/{id} which lands in
    // Phase 2. On empty library or fetch failure we fall through to
    // the original "Mobile vs web first" mock so offline viewers still
    // see a complete-looking screen.
    const [latest, setLatest] = useState(null);  // null = not-yet-fetched
    useEffect(() => {
      fetch('/api/simulations')
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(data => setLatest(Array.isArray(data) && data.length > 0 ? data[0] : null))
        .catch(() => setLatest(null));
    }, []);

    const mockCriteria = [
      { label: 'Clarity',          score: 8.4, target: 7 },
      { label: 'Disagreement',     score: 8.9, target: 7 },
      { label: 'Evidence cited',   score: 7.6, target: 7 },
      { label: 'Resolution',       score: 7.2, target: 7 },
      { label: 'Voice fidelity',   score: 8.8, target: 7 },
    ];
    const criteria = mockCriteria;  // real criteria arrive in Phase 2

    const title = latest?.topic ?? 'Mobile vs web first';
    const subtitle = latest ? '' : 'in 2026?';
    const heroScore = (latest && typeof latest.score === 'number') ? latest.score : 8.1;
    const heroEyebrow = latest
      ? `● ${String(latest.kind || 'simulation').toUpperCase()} · ${latest.participants?.length || 0} VOICES`
      : '● RALPH PASSED · ITER 3 OF 3';

    return (
      <Browser url="localhost:7777/sim/20260421T1404.../results">
        <AppNav active="results"/>
        <div style={{ flex: 1, overflow: 'auto', padding: '48px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 6 }}>
            <Mono color={T.mute}>← simulation · {latest?.id || '20260421T1404'}</Mono>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 48, alignItems: 'flex-end', marginBottom: 40 }}>
            <div>
              <Eyebrow color={T.cool}>{heroEyebrow}</Eyebrow>
              <div style={{ fontFamily: T.fDisplay, fontWeight: 400, fontSize: 56, letterSpacing: -1.8, lineHeight: 1.05, marginTop: 14 }}>
                {title}{subtitle && <><br/><span style={{ fontStyle: 'italic', fontWeight: 300 }}>{subtitle}</span></>}
              </div>
              <div style={{ fontSize: 15, color: T.mute, marginTop: 14, maxWidth: 560, lineHeight: 1.5 }}>
                Three rounds. One conclusion: start with the web because distribution compounds and friction is lowest — unless your specific user's touchpoint is mobile-only.
              </div>
            </div>
            <RalphRing score={heroScore} target={7} size={180}/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 40 }}>
            {/* Trajectory */}
            <div style={{ padding: 28, background: '#fff', borderRadius: 18, border: `1px solid ${T.hair}` }}>
              <Eyebrow>SCORE OVER ITERATIONS</Eyebrow>
              <div style={{ marginTop: 14 }}>
                <RalphTrajectory scores={[5.2, 6.4, 8.1]} target={7} width={460} height={170}/>
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: T.mute, lineHeight: 1.5 }}>
                <Kalam size={14} color={T.accent}>jumped after dhh stopped hedging →</Kalam>
              </div>
            </div>

            {/* Criteria bars */}
            <div style={{ padding: 28, background: '#fff', borderRadius: 18, border: `1px solid ${T.hair}` }}>
              <Eyebrow>CRITERIA</Eyebrow>
              <div style={{ marginTop: 18 }}>
                <CriteriaBars data={criteria}/>
              </div>
            </div>
          </div>

          {/* Participants + downloads */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
            <div style={{ padding: 28, background: T.paperSoft, borderRadius: 18 }}>
              <Eyebrow>WHO SPOKE</Eyebrow>
              <div style={{ marginTop: 18, display: 'flex', gap: 24 }}>
                {P.slice(0,3).map((p, i) => {
                  const pct = [38, 34, 28][i];
                  return (
                    <div key={p.id} style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <PhotoAv p={p} size={36}/>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name.split(' ')[0]}</div>
                          <Mono size={10}>{pct}% · {[12,10,9][i]} turns</Mono>
                        </div>
                      </div>
                      <div style={{ height: 4, background: T.hair, borderRadius: 2 }}>
                        <div style={{ width: `${pct * 1.5}%`, height: '100%', background: hueBg(p.hue), borderRadius: 2 }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: 28, background: T.ink, color: '#fff', borderRadius: 18 }}>
              <Eyebrow color="rgba(255,255,255,0.5)">DOWNLOAD</Eyebrow>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['transcript.md','22 KB'],['results.docx','184 KB'],['summary.pptx','1.2 MB']].map(([f,s],i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 10 }}>
                    <div style={{ fontSize: 14 }}>↓</div>
                    <div style={{ fontFamily: T.fMono, fontSize: 12, flex: 1 }}>{f}</div>
                    <Mono size={10} color="rgba(255,255,255,0.5)">{s}</Mono>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Note top={80} right={40} rot={3} w={140}>
          score ring →<br/>celebratory, like<br/>closing rings.
        </Note>
      </Browser>
    );
  }

  // B · TRANSCRIPT-FIRST — the words matter most
  function ResultsB(){
    return (
      <Browser>
        <AppNav active="results"/>
        <div style={{ flex: 1, overflow: 'auto', padding: '60px 120px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
          <Mono color={T.mute}>← results · 20260421T1404</Mono>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 20, marginBottom: 32, gap: 40 }}>
            <div style={{ flex: 1 }}>
              <Eyebrow color={T.cool}>RALPH 8.1 · PASSED IN 3</Eyebrow>
              <div style={{ fontFamily: T.fDisplay, fontWeight: 400, fontSize: 44, letterSpacing: -1.4, lineHeight: 1.1, marginTop: 10 }}>
                Mobile vs web first <span style={{ fontStyle: 'italic', fontWeight: 300 }}>in 2026?</span>
              </div>
            </div>
            <RalphRing score={8.1} target={7} size={110}/>
          </div>

          {/* KEY TAKEAWAY */}
          <div style={{ padding: '28px 32px', background: T.accentSoft, borderRadius: 16, marginBottom: 40 }}>
            <Eyebrow>THE ROOM AGREED</Eyebrow>
            <div style={{ fontFamily: T.fDisplay, fontStyle: 'italic', fontWeight: 300, fontSize: 24, lineHeight: 1.4, letterSpacing: -0.4, marginTop: 10 }}>
              "Web first, unless the user's only touchpoint is mobile. Distribution compounds faster than app-store installs; ship by Friday, not by quarter-end."
            </div>
          </div>

          {/* Transcript */}
          <Eyebrow>TRANSCRIPT · ITER 3</Eyebrow>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 32 }}>
            {[
              { p: P[0], time: '00:04:12', t: 'Most of what sounds sophisticated about mobile-first is just imitation. If two of you can\'t ship a web app in a weekend, two of you can\'t ship an iOS app in a month.', hl: true },
              { p: P[1], time: '00:04:39', t: 'Distribution compounds. A web URL is a tweet you send tomorrow; an App Store listing is a cold start you earn over months. Leverage sits where friction is lowest.' },
              { p: P[2], time: '00:05:08', t: 'Monoliths ship. So do web apps. Put it in someone\'s hands this week. Whatever argument you\'re having about "the future of the form factor" is an argument you\'re not having with a user.' },
              { p: P[0], time: '00:05:42', t: 'The only case for mobile-first is if your user only exists on mobile — drivers, field workers, kids on parents\' hand-me-downs. Otherwise: web, Friday, go.', hl: true },
            ].map((m, i) => {
              const c = hueBg(m.p.hue);
              return (
                <div key={i} style={{ display: 'flex', gap: 24 }}>
                  <div style={{ width: 110, flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                      <PhotoAv p={m.p} size={42}/>
                      <div style={{ fontSize: 12, fontWeight: 500, marginTop: 8 }}>{m.p.name.split(' ')[0]}</div>
                      <Mono size={9}>{m.time}</Mono>
                    </div>
                  </div>
                  <div style={{ flex: 1, paddingLeft: 20, borderLeft: `2px solid ${m.hl ? c : T.hair}`, fontFamily: T.fDisplay, fontWeight: 300, fontSize: 19, lineHeight: 1.55, letterSpacing: -0.3 }}>
                    {m.hl && <span style={{ background: hueSoft(m.p.hue), padding: '0 4px', borderRadius: 3 }}>"{m.t}"</span>}
                    {!m.hl && <>"{m.t}"</>}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 56, padding: '20px 24px', background: T.paperSoft, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Mono color={T.mute}>22 KB · 847 words · 3 iters</Mono>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn size="sm">↓ .md</Btn>
              <Btn size="sm">↓ .docx</Btn>
              <Btn size="sm" primary>↓ .pptx</Btn>
            </div>
          </div>
        </div>
        <Note top={80} right={40} rot={-3} w={130}>
          reads like a<br/>New Yorker profile<br/>of the argument.
        </Note>
      </Browser>
    );
  }

  // C · ITERATIONS TIMELINE — all 3 iterations side-by-side, showing the climb
  function ResultsC(){
    const iters = [
      { n: 1, score: 5.2, note: 'Everyone hedged. PG quoted himself. Naval spoke in koans. DHH was polite.', key: 'too agreeable' },
      { n: 2, score: 6.4, note: 'Facilitator pushed. Real disagreement surfaced around distribution.', key: 'distribution fight' },
      { n: 3, score: 8.1, note: 'DHH stopped hedging. PG narrowed the claim. Conclusion emerged.', key: 'passed', passed: true },
    ];
    return (
      <Browser>
        <AppNav active="results"/>
        <div style={{ flex: 1, overflow: 'auto', padding: '48px 72px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 8 }}>
            <Mono color={T.mute}>← 20260421T1404</Mono>
          </div>
          <div style={{ fontFamily: T.fDisplay, fontWeight: 400, fontSize: 44, letterSpacing: -1.3, lineHeight: 1.05, marginBottom: 10 }}>
            The climb to <span style={{ fontStyle: 'italic', fontWeight: 300 }}>clarity.</span>
          </div>
          <div style={{ fontSize: 15, color: T.mute, marginBottom: 40, maxWidth: 560 }}>
            Three iterations of the same meeting. Watch the score rise as the room stops hedging.
          </div>

          {/* Big trajectory */}
          <div style={{ padding: 32, background: '#fff', borderRadius: 20, border: `1px solid ${T.hair}`, marginBottom: 24 }}>
            <RalphTrajectory scores={[5.2, 6.4, 8.1]} target={7} width={880} height={200}/>
          </div>

          {/* Three iteration cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {iters.map(it => {
              const c = it.passed ? T.cool : (it.score >= 6 ? T.accent : T.mute);
              return (
                <div key={it.n} style={{
                  padding: 24, borderRadius: 16,
                  background: it.passed ? '#fff' : T.paperSoft,
                  border: `1.5px solid ${it.passed ? T.cool : T.hair}`,
                  position: 'relative',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Eyebrow color={c}>ITERATION {it.n}</Eyebrow>
                    {it.passed && <Mono size={10} color={T.cool} style={{ padding: '3px 8px', background: T.coolSoft, borderRadius: 4 }}>● PASSED</Mono>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
                    <div style={{ fontFamily: T.fDisplay, fontSize: 48, fontWeight: 400, letterSpacing: -1.5, color: c, lineHeight: 1 }}>{it.score.toFixed(1)}</div>
                    <Mono color={T.mute}>/ 10</Mono>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: T.inkSoft, marginBottom: 16 }}>
                    {it.note}
                  </div>
                  <Kalam size={14} color={T.accent}>→ {it.key}</Kalam>
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div style={{ marginTop: 32, display: 'flex', gap: 12, alignItems: 'center' }}>
            <Btn primary size="md">Open transcript →</Btn>
            <Btn size="md">Run again</Btn>
            <Btn size="md">Tune criteria</Btn>
            <div style={{ marginLeft: 'auto' }}>
              <Mono>3 DOWNLOADS · md · docx · pptx</Mono>
            </div>
          </div>
        </div>
        <Note top={40} right={30} rot={2} w={150} arrow>
          the "climb" is<br/>the story. frame<br/>it that way.
        </Note>
      </Browser>
    );
  }

  window.HF_Results = { ResultsA, ResultsB, ResultsC };
})();
