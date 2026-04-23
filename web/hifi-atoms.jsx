// hifi-atoms.jsx — design tokens + atoms for Persona Studio hi-fi
// Exposes: window.HF = { tokens, Av, PhotoAv, AppNav, Browser, Note, Mono, Kalam, Wave, RalphRing, ... }

(function () {
  const tokens = {
    // warm paper palette (Apple-ish but slightly warmer)
    paper: '#fbfaf7',
    paperSoft: '#f4f2ed',
    paperDeep: '#eae6dd',
    ink: '#1a1714',
    inkSoft: '#3a342d',
    mute: '#8a857b',
    hair: '#e8e3d9',
    accent: '#c96442',      // terracotta
    accentSoft: '#f6e6dd',
    cool: '#2f6b6b',        // teal for Ralph contrast
    coolSoft: '#dbe9e7',
    green: '#4a7c4e',

    fSans: '"Inter", -apple-system, "SF Pro Display", system-ui, sans-serif',
    fDisplay: '"Fraunces", "New York", Georgia, serif',
    fHand: '"Kalam", cursive',
    fMono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
  };

  const PEOPLE = [
    { id: 'pg',  name: 'Paul Graham',       role: 'Essayist · Y Combinator',  hue: 28,  born: 1964, mode: 'public',  corpus: '84k' },
    { id: 'nv',  name: 'Naval Ravikant',    role: 'AngelList · aphorist',     hue: 195, born: 1974, mode: 'public',  corpus: '61k' },
    { id: 'dhh', name: 'DHH',               role: 'Rails · Basecamp',         hue: 350, born: 1979, mode: 'public',  corpus: '112k' },
    { id: 'jhb', name: 'JH Baek',           role: 'Staff Engineer',           hue: 142, born: 1988, mode: 'private', corpus: '12k' },
    { id: 'dv',  name: 'Devesh Upadhyay',   role: 'Engineer',                 hue: 260, born: 1991, mode: 'private', corpus: '9k' },
    { id: 'wb',  name: 'Wes Bailey',        role: 'Product Manager',          hue: 90,  born: 1987, mode: 'private', corpus: '18k' },
    { id: 'sp',  name: 'sample_private',    role: 'Fictional · KR',           hue: 322, born: 1985, mode: 'private', corpus: '4k' },
  ];

  const hueBg   = (h) => `oklch(0.70 0.11 ${h})`;
  const hueDeep = (h) => `oklch(0.42 0.12 ${h})`;
  const hueSoft = (h) => `oklch(0.93 0.04 ${h})`;

  // Photo-ish avatar: monochrome duotone placeholder made from gradient
  // to stand in for a real portrait — mono caption makes it obvious.
  const PhotoAv = ({ p, size = 64, tone = 'duotone', ring }) => {
    const bg = tone === 'duotone'
      ? `linear-gradient(135deg, ${hueBg(p.hue)} 0%, ${hueDeep(p.hue)} 100%)`
      : `linear-gradient(135deg, ${hueSoft(p.hue)} 0%, ${hueBg(p.hue)} 100%)`;
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: bg,
        boxShadow: ring ? `0 0 0 2px ${tokens.paper}, 0 0 0 3.5px ${hueBg(p.hue)}` : 'inset 0 -8px 18px rgba(0,0,0,0.12)',
        position: 'relative', flexShrink: 0, overflow: 'hidden',
        display: 'inline-flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
        {/* face silhouette hint */}
        <div style={{
          width: size * 0.5, height: size * 0.5, borderRadius: '50%',
          background: `radial-gradient(circle at 50% 40%, rgba(255,255,255,0.25), transparent 60%)`,
          position: 'absolute', top: size * 0.18, left: size * 0.25,
        }}/>
        <div style={{
          width: size * 0.8, height: size * 0.45, borderRadius: '50% 50% 0 0',
          background: `radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.15), transparent 70%)`,
          position: 'absolute', bottom: 0, left: size * 0.1,
        }}/>
      </div>
    );
  };

  // Classic initials avatar (carry-over from wireframes)
  const InitialsAv = ({ p, size = 40, ring }) => (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: hueBg(p.hue), color: '#fff',
      fontSize: size * 0.36, fontWeight: 600, fontFamily: tokens.fSans,
      letterSpacing: -0.5,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: ring ? `0 0 0 2px ${tokens.paper}, 0 0 0 3.5px ${hueBg(p.hue)}` : 'none',
      flexShrink: 0,
    }}>
      {p.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
    </div>
  );

  // Illustrated avatar: soft color block with elegant serif initials
  const IllusAv = ({ p, size = 56 }) => (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: hueSoft(p.hue),
      color: hueDeep(p.hue),
      fontFamily: tokens.fDisplay, fontSize: size * 0.42, fontWeight: 400,
      fontStyle: 'italic',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, border: `1px solid ${hueBg(p.hue)}33`,
    }}>
      {p.name.split(' ').map(w => w[0]).slice(0,2).join('')}
    </div>
  );

  // Default Av is the approved Solid Chip (initials)
  const Av = InitialsAv;

  const Kalam = ({ children, size = 14, color, rot = 0, style }) => (
    <span style={{
      fontFamily: tokens.fHand, fontSize: size, color: color || tokens.accent,
      display: 'inline-block', transform: `rotate(${rot}deg)`, lineHeight: 1.25,
      ...style,
    }}>{children}</span>
  );

  const Mono = ({ children, size = 11, color, style }) => (
    <span style={{
      fontFamily: tokens.fMono, fontSize: size, color: color || tokens.mute,
      letterSpacing: 0.2, ...style,
    }}>{children}</span>
  );

  // Hand-note with optional arrow
  const Note = ({ children, top, left, right, bottom, w = 180, rot = -2, arrow }) => (
    <div style={{
      position: 'absolute', top, left, right, bottom, width: w,
      fontFamily: tokens.fHand, color: tokens.accent, fontSize: 13, lineHeight: 1.3,
      transform: `rotate(${rot}deg)`, zIndex: 5, pointerEvents: 'none',
    }}>
      {children}
      {arrow && (
        <svg width="50" height="28" viewBox="0 0 50 28" style={{ display: 'block', marginTop: 4 }}>
          <path d="M2 4 Q 18 22, 44 22" fill="none" stroke={tokens.accent} strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M38 18 L44 22 L38 26" fill="none" stroke={tokens.accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );

  // App chrome — with language globe + account chip
  const AppNav = ({ active = 'home', dark = false, onNav }) => {
    const fg = dark ? '#fff' : tokens.ink;
    const mu = dark ? 'rgba(255,255,255,0.55)' : tokens.mute;
    const bg = dark ? tokens.ink : tokens.paper;
    const hair = dark ? 'rgba(255,255,255,0.08)' : tokens.hair;
    const [lang, setLang] = (window.HF && window.HF.i18n) ? window.HF.i18n.useLang() : [i18n.get(), i18n.set];
    const t = (k) => i18n.t(k, lang);
    const [globeOpen, setGlobeOpen] = React.useState(false);
    const [acctOpen, setAcctOpen] = React.useState(false);
    return (
      <div style={{
        height: 56, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 28,
        borderBottom: `1px solid ${hair}`, background: bg, color: fg,
        fontFamily: tokens.fSans, position: 'relative',
      }}>
        <div style={{ fontWeight: 600, letterSpacing: -0.3, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 6,
            background: `conic-gradient(from 180deg, ${tokens.accent}, ${tokens.cool}, ${tokens.accent})`,
          }}/>
          Persona Studio
        </div>
        {[
          ['home','nav.home'],
          ['library','nav.library'],
          ['create','nav.new'],
          ['sim','nav.simulate'],
          ['results','nav.results'],
        ].map(([k,tk]) => (
          <div key={k} onClick={() => onNav && onNav(k === 'sim' ? 'live' : k)} style={{
            fontSize: 13, letterSpacing: -0.1, cursor: onNav ? 'pointer' : 'default',
            color: active === k ? fg : mu,
            fontWeight: active === k ? 500 : 400,
            position: 'relative',
          }}>
            {t(tk)}
            {active === k && <div style={{ position: 'absolute', left: '50%', bottom: -19, transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: 4, background: tokens.accent }}/>}
          </div>
        ))}
        <div style={{ flex: 1 }}/>
        <div style={{ fontFamily: tokens.fMono, fontSize: 11, color: mu }}>⌘K</div>

        {/* Language globe */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => { setGlobeOpen(v => !v); setAcctOpen(false); }} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999,
            cursor: 'pointer', border: `1px solid ${hair}`, fontSize: 12, color: fg,
          }}>
            <span style={{ fontSize: 13 }}>🌐</span>
            <span style={{ fontFamily: tokens.fMono, fontSize: 10, letterSpacing: 1 }}>{LANGS.find(l => l.code === lang)?.short}</span>
          </div>
          {globeOpen && (
            <div style={{ position: 'absolute', top: 36, right: 0, background: dark ? '#1f1a15' : '#fff', border: `1px solid ${hair}`, borderRadius: 10, padding: 6, minWidth: 140, boxShadow: '0 12px 28px rgba(0,0,0,0.12)', zIndex: 100 }}>
              {LANGS.map(L => (
                <div key={L.code} onClick={() => { setLang(L.code); setGlobeOpen(false); }} style={{
                  padding: '8px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  background: L.code === lang ? (dark ? 'rgba(255,255,255,0.06)' : tokens.paperSoft) : 'transparent',
                  fontSize: 13, color: fg,
                }}>
                  <span style={{ fontFamily: tokens.fMono, fontSize: 10, color: mu, width: 22 }}>{L.short}</span>
                  <span>{L.name}</span>
                  {L.code === lang && <span style={{ marginLeft: 'auto', color: tokens.accent, fontSize: 11 }}>●</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account chip — guest mode (OSS build) */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => { setAcctOpen(v => !v); setGlobeOpen(false); }} style={{
            width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
            background: dark ? '#333' : tokens.paperDeep,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 500, color: dark ? '#fff' : tokens.ink,
            position: 'relative',
          }}>
            <span>★</span>
            <span style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%', background: tokens.green, border: `2px solid ${bg}` }}/>
          </div>
          {acctOpen && (
            <div style={{ position: 'absolute', top: 36, right: 0, background: dark ? '#1f1a15' : '#fff', border: `1px solid ${hair}`, borderRadius: 10, padding: 6, minWidth: 220, boxShadow: '0 12px 28px rgba(0,0,0,0.12)', zIndex: 100, fontSize: 13, color: fg }}>
              <div style={{ padding: '10px 12px', borderBottom: `1px solid ${hair}` }}>
                <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Guest
                  <span style={{ fontFamily: tokens.fMono, fontSize: 9, letterSpacing: 1, padding: '2px 6px', background: tokens.coolSoft, color: tokens.cool, borderRadius: 3 }}>OSS</span>
                </div>
                <div style={{ fontSize: 11, color: mu, marginTop: 2 }}>Local session · no account</div>
              </div>
              <div onClick={() => onNav && onNav('settings')} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 6 }}>{t('settings.title')}</div>
              <div onClick={() => onNav && onNav('pricing')} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 6 }}>Cloud <span style={{ fontSize: 10, color: mu, marginLeft: 4 }}>· soon</span></div>
              <div style={{ height: 1, background: hair, margin: '4px 0' }}/>
              <div style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>★</span> Star on GitHub
              </div>
              <div style={{ padding: '6px 12px 10px', fontSize: 10, color: mu, fontFamily: tokens.fMono, letterSpacing: 0.5 }}>
                Elastic License 2.0
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Browser chrome (light, restrained)
  const Browser = ({ url = 'localhost:7777', dark = false, children }) => (
    <div style={{
      height: '100%', background: dark ? tokens.ink : tokens.paper,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: tokens.fSans, color: dark ? '#fff' : tokens.ink,
    }}>
      <div style={{
        height: 30, display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px',
        background: dark ? '#0f0d0b' : tokens.paperSoft,
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : tokens.hair}`,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ed6a5e' }}/>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f4bf4f' }}/>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#61c554' }}/>
        <div style={{
          flex: 1, marginLeft: 12, height: 18, borderRadius: 5,
          background: dark ? 'rgba(255,255,255,0.06)' : tokens.paper,
          border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : tokens.hair}`,
          fontFamily: tokens.fMono, fontSize: 10, color: tokens.mute,
          display: 'flex', alignItems: 'center', padding: '0 10px',
        }}>{url}</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );

  // Live waveform
  const Wave = ({ color, bars = 9, height = 20 }) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, height }}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = 4 + Math.abs(Math.sin(i * 1.7)) * (height - 4);
        return <div key={i} style={{ width: 2, height: h, background: color, borderRadius: 1, opacity: 0.4 + (h / height) * 0.6 }}/>;
      })}
    </div>
  );

  // Ralph score ring — circular progress with target tick
  const RalphRing = ({ score = 7.2, target = 7, size = 160, label = true }) => {
    const r = size / 2 - 10;
    const c = 2 * Math.PI * r;
    const pct = Math.min(Math.max(score / 10, 0), 1);
    const targetPct = target / 10;
    const passed = score >= target;
    const fg = passed ? tokens.cool : tokens.accent;
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={tokens.hair} strokeWidth="8"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={fg} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`} />
          {/* Target notch */}
          <circle cx={size/2 + r * Math.cos(targetPct * 2 * Math.PI)} cy={size/2 + r * Math.sin(targetPct * 2 * Math.PI)}
            r="5" fill={tokens.paper} stroke={tokens.ink} strokeWidth="1.5" />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontFamily: tokens.fDisplay, fontSize: size * 0.32, fontWeight: 400, letterSpacing: -1, color: tokens.ink, lineHeight: 1 }}>
            {score.toFixed(1)}
          </div>
          {label && <div style={{ fontFamily: tokens.fMono, fontSize: 10, color: tokens.mute, letterSpacing: 1, marginTop: 4 }}>
            {passed ? 'PASSED' : `TARGET ${target}`}
          </div>}
        </div>
      </div>
    );
  };

  // A typography-only display block (Apple homepage feel)
  const Display = ({ size = 72, lh = 1.02, children, weight = 500, serif = false, color, style }) => (
    <div style={{
      fontFamily: serif ? tokens.fDisplay : tokens.fSans,
      fontSize: size, lineHeight: lh, fontWeight: weight,
      letterSpacing: serif ? -1.2 : -2.2, color: color || tokens.ink,
      textWrap: 'balance', ...style,
    }}>{children}</div>
  );

  // CTA button (Apple pill)
  const Btn = ({ primary, accent, children, dark, size = 'md', style }) => {
    const pad = size === 'lg' ? '14px 26px' : size === 'sm' ? '6px 14px' : '10px 20px';
    const fs = size === 'lg' ? 15 : size === 'sm' ? 12 : 13;
    const base = {
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: pad, borderRadius: 999, fontSize: fs, fontWeight: 500,
      fontFamily: tokens.fSans, cursor: 'pointer', transition: 'all .15s',
      border: '1px solid transparent', letterSpacing: -0.1,
    };
    if (primary) return <div style={{ ...base, background: tokens.ink, color: '#fff', ...style }}>{children}</div>;
    if (accent)  return <div style={{ ...base, background: tokens.accent, color: '#fff', ...style }}>{children}</div>;
    if (dark)    return <div style={{ ...base, background: '#fff', color: tokens.ink, ...style }}>{children}</div>;
    return <div style={{ ...base, background: 'transparent', color: tokens.ink, border: `1px solid ${tokens.ink}`, ...style }}>{children}</div>;
  };

  // Placeholder with mono caption (what we'll drop in later)
  const Slot = ({ label, w, h, style, radius = 10 }) => (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: tokens.paperSoft,
      backgroundImage: `repeating-linear-gradient(135deg, transparent 0 11px, rgba(26,23,20,0.04) 11px 12px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: tokens.fMono, fontSize: 10, color: tokens.mute, letterSpacing: 1,
      textTransform: 'uppercase', ...style,
    }}>{label}</div>
  );

  // Eyebrow (small caps label above a display headline)
  const Eyebrow = ({ children, color, style }) => (
    <div style={{
      fontFamily: tokens.fMono, fontSize: 11, color: color || tokens.accent,
      letterSpacing: 2, textTransform: 'uppercase', fontWeight: 500, ...style,
    }}>{children}</div>
  );

  // ── i18n ──────────────────────────────────────────────────────────────────
  // Tiny translation helper. Ships with ko/en/ja dictionaries; falls back to
  // the key itself if missing. Persists language in localStorage.
  const DICT = {
    ko: {
      'nav.home': '홈', 'nav.library': '라이브러리', 'nav.new': '새로', 'nav.simulate': '시뮬레이트', 'nav.results': '결과',
      'auth.signin': '로그인', 'auth.signup': '가입하기', 'auth.continue': '계속',
      'auth.email': '이메일', 'auth.password': '비밀번호', 'auth.magic': '매직 링크로 로그인',
      'auth.orContinueWith': '또는 다음으로 계속', 'auth.google': 'Google로 계속', 'auth.apple': 'Apple로 계속',
      'auth.noAccount': '계정이 없으신가요?', 'auth.haveAccount': '이미 계정이 있으신가요?',
      'auth.forgot': '비밀번호를 잊으셨나요?', 'auth.terms': '가입하면 이용약관과 개인정보 처리방침에 동의하는 것으로 간주됩니다.',
      'onboard.welcome': '환영합니다', 'onboard.name': '어떻게 불러드릴까요?',
      'onboard.purpose': '어떤 일에 쓰실 건가요?', 'onboard.seed': '첫 페르소나를 골라보세요',
      'onboard.next': '다음', 'onboard.skip': '건너뛰기', 'onboard.finish': '시작하기',
      'pricing.title': '요금제', 'pricing.sub': '먼저 써보고, 필요할 때 업그레이드하세요.',
      'pricing.free': 'Free', 'pricing.pro': 'Pro', 'pricing.month': '/ 월',
      'pricing.cta.free': '현재 요금제', 'pricing.cta.pro': 'Pro 시작하기',
      'upgrade.title': '시뮬레이션 한도에 도달했어요', 'upgrade.body': '무료 요금제는 월 3회까지 시뮬레이션을 저장할 수 있어요. Pro에서는 무제한이에요.',
      'upgrade.cta': 'Pro로 업그레이드', 'upgrade.later': '나중에',
      'settings.title': '설정', 'settings.account': '계정', 'settings.billing': '결제', 'settings.language': '언어',
      'settings.signout': '로그아웃', 'settings.delete': '계정 삭제',
      'lang.current': '현재 언어', 'lang.interface': '인터페이스', 'lang.persona': '페르소나 응답',
    },
    en: {
      'nav.home': 'Home', 'nav.library': 'Library', 'nav.new': 'New', 'nav.simulate': 'Simulate', 'nav.results': 'Results',
      'auth.signin': 'Sign in', 'auth.signup': 'Sign up', 'auth.continue': 'Continue',
      'auth.email': 'Email', 'auth.password': 'Password', 'auth.magic': 'Email me a magic link',
      'auth.orContinueWith': 'or continue with', 'auth.google': 'Continue with Google', 'auth.apple': 'Continue with Apple',
      'auth.noAccount': 'No account yet?', 'auth.haveAccount': 'Already have an account?',
      'auth.forgot': 'Forgot password?', 'auth.terms': 'By signing up, you agree to the Terms and Privacy Policy.',
      'onboard.welcome': 'Welcome', 'onboard.name': 'What should we call you?',
      'onboard.purpose': 'What will you use this for?', 'onboard.seed': 'Pick a persona to start',
      'onboard.next': 'Next', 'onboard.skip': 'Skip', 'onboard.finish': 'Get started',
      'pricing.title': 'Pricing', 'pricing.sub': 'Try it first. Upgrade when you need more.',
      'pricing.free': 'Free', 'pricing.pro': 'Pro', 'pricing.month': '/ month',
      'pricing.cta.free': 'Current plan', 'pricing.cta.pro': 'Start Pro',
      'upgrade.title': "You've hit your simulation limit", 'upgrade.body': 'Free includes 3 saved sims per month. Pro is unlimited.',
      'upgrade.cta': 'Upgrade to Pro', 'upgrade.later': 'Maybe later',
      'settings.title': 'Settings', 'settings.account': 'Account', 'settings.billing': 'Billing', 'settings.language': 'Language',
      'settings.signout': 'Sign out', 'settings.delete': 'Delete account',
      'lang.current': 'Current language', 'lang.interface': 'Interface', 'lang.persona': 'Persona replies',
    },
    es: {
      'nav.home': 'Inicio', 'nav.library': 'Biblioteca', 'nav.new': 'Nuevo', 'nav.simulate': 'Simular', 'nav.results': 'Resultados',
      'auth.signin': 'Iniciar sesión', 'auth.signup': 'Crear cuenta', 'auth.continue': 'Continuar',
      'auth.email': 'Correo', 'auth.password': 'Contraseña', 'auth.magic': 'Envíame un enlace mágico',
      'auth.orContinueWith': 'o continúa con', 'auth.google': 'Continuar con Google', 'auth.apple': 'Continuar con Apple',
      'auth.noAccount': '¿Aún no tienes cuenta?', 'auth.haveAccount': '¿Ya tienes cuenta?',
      'auth.forgot': '¿Olvidaste tu contraseña?', 'auth.terms': 'Al registrarte, aceptas los Términos y la Política de Privacidad.',
      'onboard.welcome': 'Bienvenido', 'onboard.name': '¿Cómo te llamamos?',
      'onboard.purpose': '¿Para qué lo usarás?', 'onboard.seed': 'Elige un persona para empezar',
      'onboard.next': 'Siguiente', 'onboard.skip': 'Omitir', 'onboard.finish': 'Empezar',
      'pricing.title': 'Planes', 'pricing.sub': 'Pruébalo primero. Mejora cuando necesites más.',
      'pricing.free': 'Gratis', 'pricing.pro': 'Pro', 'pricing.month': '/ mes',
      'pricing.cta.free': 'Plan actual', 'pricing.cta.pro': 'Empezar Pro',
      'upgrade.title': 'Alcanzaste tu límite de simulaciones', 'upgrade.body': 'Gratis incluye 3 simulaciones al mes. Pro es ilimitado.',
      'upgrade.cta': 'Mejorar a Pro', 'upgrade.later': 'Quizás después',
      'settings.title': 'Ajustes', 'settings.account': 'Cuenta', 'settings.billing': 'Facturación', 'settings.language': 'Idioma',
      'settings.signout': 'Cerrar sesión', 'settings.delete': 'Eliminar cuenta',
      'lang.current': 'Idioma actual', 'lang.interface': 'Interfaz', 'lang.persona': 'Respuestas de personas',
    },
    ja: {
      'nav.home': 'ホーム', 'nav.library': 'ライブラリ', 'nav.new': '新規', 'nav.simulate': 'シミュレート', 'nav.results': '結果',
      'auth.signin': 'ログイン', 'auth.signup': '登録', 'auth.continue': '続ける',
      'auth.email': 'メールアドレス', 'auth.password': 'パスワード', 'auth.magic': 'マジックリンクでログイン',
      'auth.orContinueWith': 'または次で続ける', 'auth.google': 'Google で続ける', 'auth.apple': 'Apple で続ける',
      'auth.noAccount': 'アカウントがありませんか?', 'auth.haveAccount': 'すでにアカウントをお持ちですか?',
      'auth.forgot': 'パスワードを忘れた?', 'auth.terms': '登録すると利用規約とプライバシーポリシーに同意したことになります。',
      'onboard.welcome': 'ようこそ', 'onboard.name': 'お名前は?',
      'onboard.purpose': '何に使いますか?', 'onboard.seed': '最初のペルソナを選んでください',
      'onboard.next': '次へ', 'onboard.skip': 'スキップ', 'onboard.finish': '始める',
      'pricing.title': '料金', 'pricing.sub': 'まず試してから、必要に応じてアップグレード。',
      'pricing.free': 'Free', 'pricing.pro': 'Pro', 'pricing.month': '/ 月',
      'pricing.cta.free': '現在のプラン', 'pricing.cta.pro': 'Pro を始める',
      'upgrade.title': 'シミュレーションの上限に達しました', 'upgrade.body': '無料プランは月3回まで保存できます。Pro は無制限です。',
      'upgrade.cta': 'Pro にアップグレード', 'upgrade.later': '後で',
      'settings.title': '設定', 'settings.account': 'アカウント', 'settings.billing': '支払い', 'settings.language': '言語',
      'settings.signout': 'ログアウト', 'settings.delete': 'アカウント削除',
      'lang.current': '現在の言語', 'lang.interface': 'インターフェース', 'lang.persona': 'ペルソナの返答',
    },
  };
  const LANGS = [
    { code: 'en', name: 'English', short: 'EN' },
    { code: 'es', name: 'Español', short: 'ES' },
    { code: 'ko', name: '한국어', short: 'KO' },
    { code: 'ja', name: '日本語', short: 'JA' },
  ];
  const i18n = {
    LANGS,
    DICT,
    get: () => { try { return localStorage.getItem('ps_lang') || 'en'; } catch { return 'en'; } },
    set: (l) => { try { localStorage.setItem('ps_lang', l); } catch {} window.dispatchEvent(new CustomEvent('ps_lang_change', { detail: l })); },
    t: (key, lang) => {
      const l = lang || i18n.get();
      return (DICT[l] && DICT[l][key]) || DICT.en[key] || key;
    },
    // Simple hook to re-render on language change
    useLang: () => {
      const [l, setL] = React.useState(i18n.get());
      React.useEffect(() => {
        const on = (e) => setL(e.detail);
        window.addEventListener('ps_lang_change', on);
        return () => window.removeEventListener('ps_lang_change', on);
      }, []);
      return [l, (code) => i18n.set(code)];
    },
  };

  window.HF = { tokens, PEOPLE, hueBg, hueDeep, hueSoft, PhotoAv, InitialsAv, IllusAv, Av, AppNav, Browser, Note, Kalam, Mono, Wave, RalphRing, Display, Btn, Slot, Eyebrow, i18n };
})();
