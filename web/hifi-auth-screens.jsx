// hifi-auth-screens.jsx — Auth, Onboarding, Pricing, Upgrade, Settings
// Exposes window.HF_Auth = { SignInScreen, SignUpScreen, OnboardScreen, PricingScreen, UpgradeModal, SettingsScreen }

(function(){
  const { tokens: T, i18n, Btn, Mono, Eyebrow, Display, AppNav, Browser, PEOPLE: P, InitialsAv: Av, hueBg, hueSoft, hueDeep } = window.HF;
  const { useState } = React;

  // Shared auth page frame: left = brand/marquee, right = form
  function AuthFrame({ children, eyebrow, title, sub }){
    return (
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', background: T.paper, fontFamily: T.fSans }}>
        {/* Left panel — atmospheric */}
        <div style={{ background: T.paperSoft, padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', borderRight: `1px solid ${T.hair}` }}>
          <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: `conic-gradient(from 180deg, ${T.accent}, ${T.cool}, ${T.accent})` }}/>
            Persona Studio
          </div>
          <div>
            <div style={{ fontFamily: T.fDisplay, fontStyle: 'italic', fontWeight: 300, fontSize: 42, lineHeight: 1.1, letterSpacing: -1, color: T.ink }}>
              "Talk to the<br/>people you<br/>wish you could."
            </div>
            <div style={{ marginTop: 14, fontFamily: T.fMono, fontSize: 10, color: T.mute, letterSpacing: 1.5 }}>PERSONA STUDIO · ROUNDTABLE</div>
          </div>
          <div style={{ display: 'flex', gap: -8 }}>
            {P.slice(0, 5).map((p, i) => (
              <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -10, border: `2px solid ${T.paperSoft}`, borderRadius: '50%' }}>
                <Av p={p} size={36}/>
              </div>
            ))}
            <div style={{ marginLeft: 14, alignSelf: 'center', fontFamily: T.fMono, fontSize: 10, color: T.mute, letterSpacing: 1.2 }}>7 PERSONAS AVAILABLE</div>
          </div>
        </div>
        {/* Right — form */}
        <div style={{ padding: '56px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 520, width: '100%' }}>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <div style={{ fontFamily: T.fDisplay, fontWeight: 400, fontSize: 34, letterSpacing: -0.8, marginTop: 8, color: T.ink }}>{title}</div>
          {sub && <div style={{ fontSize: 14, color: T.mute, marginTop: 6 }}>{sub}</div>}
          <div style={{ marginTop: 28 }}>{children}</div>
        </div>
      </div>
    );
  }

  // Text field
  function Field({ label, type = 'text', placeholder, value, trailing }){
    return (
      <label style={{ display: 'block', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: T.mute, fontFamily: T.fMono, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ position: 'relative' }}>
          <input type={type} defaultValue={value} placeholder={placeholder} style={{
            width: '100%', padding: '12px 14px', fontSize: 14,
            border: `1px solid ${T.hair}`, borderRadius: 10, background: '#fff',
            fontFamily: T.fSans, color: T.ink, outline: 'none',
          }}/>
          {trailing && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: T.mute, fontFamily: T.fMono }}>{trailing}</div>}
        </div>
      </label>
    );
  }

  function OAuthRow({ lang, t, horizontal = true }){
    const btns = [
      { label: 'Google', icon: 'G', bg: '#fff', fg: T.ink, border: T.hair },
      { label: 'Apple',  icon: '', bg: T.ink, fg: '#fff', border: T.ink },
    ];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: horizontal ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 14 }}>
        {btns.map(b => (
          <div key={b.label} style={{
            padding: '11px 14px', border: `1px solid ${b.border}`, background: b.bg, color: b.fg,
            borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <span style={{ fontFamily: T.fDisplay, fontSize: 15 }}>{b.icon}</span>
            <span>{t(b.label === 'Google' ? 'auth.google' : 'auth.apple')}</span>
          </div>
        ))}
      </div>
    );
  }

  function Divider({ label }){
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 16px', color: T.mute }}>
        <div style={{ flex: 1, height: 1, background: T.hair }}/>
        <Mono size={10}>{label}</Mono>
        <div style={{ flex: 1, height: 1, background: T.hair }}/>
      </div>
    );
  }

  function SignInScreen({ onNav }){
    const [lang] = i18n.useLang();
    const t = (k) => i18n.t(k, lang);
    return (
      <Browser url="personastudio.app/signin">
        <AuthFrame eyebrow="SIGN IN" title={t('auth.signin')} sub="Pick up where you left off.">
          <OAuthRow lang={lang} t={t}/>
          <Divider label={t('auth.orContinueWith')}/>
          <Field label={t('auth.email')} type="email" placeholder="you@domain.com" value="jh@example.com"/>
          <Field label={t('auth.password')} type="password" placeholder="••••••••" trailing={<span style={{ cursor: 'pointer' }}>{t('auth.forgot')}</span>}/>
          <div onClick={() => onNav && onNav('home')} style={{ marginTop: 10 }}>
            <Btn primary style={{ width: '100%', justifyContent: 'center', padding: '12px 20px' }}>{t('auth.continue')}</Btn>
          </div>
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <Mono size={11}>{t('auth.magic')} →</Mono>
          </div>
          <div style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: T.mute }}>
            {t('auth.noAccount')}{' '}
            <span onClick={() => onNav && onNav('signup')} style={{ color: T.ink, fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: T.accent, textUnderlineOffset: 4 }}>
              {t('auth.signup')}
            </span>
          </div>
        </AuthFrame>
      </Browser>
    );
  }

  function SignUpScreen({ onNav }){
    const [lang] = i18n.useLang();
    const t = (k) => i18n.t(k, lang);
    return (
      <Browser url="personastudio.app/signup">
        <AuthFrame eyebrow="CREATE ACCOUNT" title={t('auth.signup')} sub="Start with 3 free simulations a month.">
          <OAuthRow lang={lang} t={t}/>
          <Divider label={t('auth.orContinueWith')}/>
          <Field label={t('auth.email')} type="email" placeholder="you@domain.com"/>
          <Field label={t('auth.password')} type="password" placeholder="•••••••• (min 8)"/>
          <div onClick={() => onNav && onNav('onboard')} style={{ marginTop: 10 }}>
            <Btn accent style={{ width: '100%', justifyContent: 'center', padding: '12px 20px' }}>{t('auth.continue')} →</Btn>
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: T.mute, lineHeight: 1.5 }}>
            {t('auth.terms')}
          </div>
          <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13, color: T.mute }}>
            {t('auth.haveAccount')}{' '}
            <span onClick={() => onNav && onNav('signin')} style={{ color: T.ink, fontWeight: 500, cursor: 'pointer' }}>{t('auth.signin')}</span>
          </div>
        </AuthFrame>
      </Browser>
    );
  }

  function OnboardScreen({ onNav }){
    const [lang] = i18n.useLang();
    const t = (k) => i18n.t(k, lang);
    const [step, setStep] = useState(0);
    const [picked, setPicked] = useState(['pg']);
    const [purpose, setPurpose] = useState('research');
    const steps = [
      { key: 'name',    title: t('onboard.name') },
      { key: 'purpose', title: t('onboard.purpose') },
      { key: 'seed',    title: t('onboard.seed') },
    ];
    const cur = steps[step];
    const next = () => {
      if (step < steps.length - 1) setStep(step + 1);
      else onNav && onNav('library');
    };
    return (
      <Browser url="personastudio.app/onboarding">
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.paper, fontFamily: T.fSans }}>
          {/* Stepper */}
          <div style={{ padding: '18px 32px', borderBottom: `1px solid ${T.hair}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: `conic-gradient(from 180deg, ${T.accent}, ${T.cool}, ${T.accent})` }}/>
              Persona Studio
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8 }}>
              {steps.map((s, i) => (
                <div key={s.key} style={{ width: 40, height: 3, borderRadius: 2, background: i <= step ? T.ink : T.hair }}/>
              ))}
            </div>
            <Mono size={10}>{t('onboard.welcome').toUpperCase()} · {step + 1}/{steps.length}</Mono>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div style={{ maxWidth: 620, width: '100%' }}>
              <Eyebrow>STEP {step + 1}</Eyebrow>
              <div style={{ fontFamily: T.fDisplay, fontWeight: 400, fontSize: 36, letterSpacing: -1, marginTop: 10, color: T.ink }}>
                {cur.title}
              </div>

              <div style={{ marginTop: 28 }}>
                {cur.key === 'name' && (
                  <>
                    <Field label={t('auth.email').replace('Email','Name').replace('이메일','이름').replace('メールアドレス','お名前')} placeholder="JH Baek" value="JH Baek"/>
                    <div style={{ fontSize: 12, color: T.mute }}>We'll use this in transcripts and session summaries.</div>
                  </>
                )}
                {cur.key === 'purpose' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { id: 'research', title: 'Research & learning', body: 'Interview thinkers, stress-test ideas.' },
                      { id: 'writing',  title: 'Writing & editing',    body: 'Get feedback in distinct voices.' },
                      { id: 'product',  title: 'Product decisions',    body: 'Run cross-functional debates.' },
                      { id: 'personal', title: 'Personal journaling',  body: 'Talk through life with trusted voices.' },
                    ].map(opt => (
                      <div key={opt.id} onClick={() => setPurpose(opt.id)} style={{
                        padding: 18, borderRadius: 12, cursor: 'pointer',
                        border: `1.5px solid ${purpose === opt.id ? T.ink : T.hair}`,
                        background: purpose === opt.id ? T.paperSoft : '#fff',
                      }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{opt.title}</div>
                        <div style={{ fontSize: 12, color: T.mute, marginTop: 4, lineHeight: 1.4 }}>{opt.body}</div>
                      </div>
                    ))}
                  </div>
                )}
                {cur.key === 'seed' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {P.filter(p => p.mode === 'public').map(p => {
                      const on = picked.includes(p.id);
                      return (
                        <div key={p.id} onClick={() => setPicked(on ? picked.filter(x => x !== p.id) : [...picked, p.id])} style={{
                          padding: 14, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                          border: `1.5px solid ${on ? hueBg(p.hue) : T.hair}`,
                          background: on ? hueSoft(p.hue) : '#fff',
                        }}>
                          <Av p={p} size={44}/>
                          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 8 }}>{p.name}</div>
                          <Mono size={9}>{p.role}</Mono>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div onClick={() => onNav && onNav('library')} style={{ fontSize: 13, color: T.mute, cursor: 'pointer' }}>{t('onboard.skip')}</div>
                <div style={{ flex: 1 }}/>
                {step > 0 && <Btn onClick={() => setStep(step - 1)} style={{ cursor: 'pointer' }}>← Back</Btn>}
                <div onClick={next}>
                  <Btn primary style={{ cursor: 'pointer' }}>
                    {step === steps.length - 1 ? t('onboard.finish') : t('onboard.next')} →
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Browser>
    );
  }

  function PricingCard({ name, price, sub, features, cta, ctaPrimary, highlight, badge }){
    return (
      <div style={{
        padding: 32, borderRadius: 18, background: '#fff',
        border: `1.5px solid ${highlight ? T.ink : T.hair}`,
        position: 'relative',
        boxShadow: highlight ? '0 20px 50px rgba(26,23,20,0.08)' : 'none',
      }}>
        {badge && (
          <div style={{ position: 'absolute', top: -10, right: 24, padding: '3px 10px', background: T.accent, color: '#fff', fontFamily: T.fMono, fontSize: 10, letterSpacing: 1.5, borderRadius: 999 }}>{badge}</div>
        )}
        <div style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{name}</div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontFamily: T.fDisplay, fontSize: 44, fontWeight: 400, letterSpacing: -1.5 }}>{price}</div>
          <div style={{ color: T.mute, fontSize: 13 }}>{sub}</div>
        </div>
        <div style={{ height: 1, background: T.hair, margin: '20px 0' }}/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: f.muted ? T.mute : T.inkSoft, textDecoration: f.muted ? 'line-through' : 'none' }}>
              <span style={{ color: f.muted ? T.mute : T.cool, fontWeight: 600 }}>✓</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <Btn primary={ctaPrimary} style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', cursor: 'pointer' }}>{cta}</Btn>
        </div>
      </div>
    );
  }

  function PricingScreen({ onNav }){
    const [lang] = i18n.useLang();
    const t = (k) => i18n.t(k, lang);
    const [cycle, setCycle] = useState('month');
    const isMonth = cycle === 'month';
    return (
      <Browser url="personastudio.app/pricing">
        <AppNav active="home" onNav={onNav}/>
        <div style={{ flex: 1, padding: '56px 72px', background: T.paper, overflow: 'auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 44px' }}>
            <Eyebrow>{t('pricing.title').toUpperCase()}</Eyebrow>
            <div style={{ fontFamily: T.fDisplay, fontStyle: 'italic', fontWeight: 300, fontSize: 48, letterSpacing: -1.5, marginTop: 10, lineHeight: 1.05 }}>
              {t('pricing.sub')}
            </div>
            <div style={{ marginTop: 22, display: 'inline-flex', gap: 2, padding: 3, background: T.paperSoft, borderRadius: 999, border: `1px solid ${T.hair}` }}>
              {[['month','Monthly'],['year','Yearly · save 20%']].map(([k,l]) => (
                <div key={k} onClick={() => setCycle(k)} style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
                  background: cycle === k ? T.ink : 'transparent',
                  color: cycle === k ? '#fff' : T.inkSoft,
                }}>{l}</div>
              ))}
            </div>
          </div>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <PricingCard
              name={t('pricing.free')}
              price="$0"
              sub={t('pricing.month')}
              features={[
                { label: '3 simulations / month' },
                { label: '2 personas at a time' },
                { label: 'Public personas only' },
                { label: 'Unlimited personas', muted: true },
                { label: 'Private personas from your files', muted: true },
              ]}
              cta={t('pricing.cta.free')}
            />
            <PricingCard
              name={t('pricing.pro')}
              price={isMonth ? '$18' : '$14'}
              sub={isMonth ? t('pricing.month') : t('pricing.month') + ' · billed yearly'}
              features={[
                { label: 'Unlimited simulations' },
                { label: 'Up to 8 personas at a table' },
                { label: 'Private personas (bring your own files)' },
                { label: 'Export transcripts + Ralph scores' },
                { label: 'Priority inference' },
              ]}
              cta={t('pricing.cta.pro')}
              ctaPrimary
              highlight
              badge="POPULAR"
            />
          </div>
          <div style={{ maxWidth: 900, margin: '44px auto 0', padding: 24, background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: T.accentSoft, color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fDisplay, fontSize: 18 }}>★</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Team workspaces are coming soon.</div>
              <div style={{ fontSize: 12, color: T.mute, marginTop: 2 }}>Invite colleagues, share persona libraries, and collaborate on simulations. <span style={{ color: T.ink, textDecoration: 'underline', textDecorationColor: T.hair, textUnderlineOffset: 3 }}>Join the waitlist →</span></div>
            </div>
          </div>
        </div>
      </Browser>
    );
  }

  function UpgradeModal({ onNav }){
    const [lang] = i18n.useLang();
    const t = (k) => i18n.t(k, lang);
    // Render underneath: a peek of library + centered modal
    return (
      <Browser url="personastudio.app/library">
        <AppNav active="library" onNav={onNav}/>
        <div style={{ flex: 1, position: 'relative', background: T.paper, overflow: 'hidden' }}>
          {/* dim backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,23,20,0.45)', backdropFilter: 'blur(4px)' }}/>
          {/* fake library peeking through */}
          <div style={{ padding: 40, opacity: 0.4 }}>
            <div style={{ fontFamily: T.fDisplay, fontSize: 32, fontWeight: 400 }}>Library</div>
            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {P.slice(0, 4).map(p => (
                <div key={p.id} style={{ padding: 20, background: '#fff', borderRadius: 12, border: `1px solid ${T.hair}` }}>
                  <Av p={p} size={48}/>
                  <div style={{ marginTop: 10, fontWeight: 500 }}>{p.name}</div>
                </div>
              ))}
            </div>
          </div>
          {/* modal */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 480, padding: 36, background: '#fff', borderRadius: 20,
            boxShadow: '0 30px 80px rgba(0,0,0,0.2)',
            fontFamily: T.fSans,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: T.accentSoft, color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fDisplay, fontSize: 22, fontWeight: 400 }}>★</div>
            <div style={{ fontFamily: T.fDisplay, fontSize: 26, fontWeight: 400, letterSpacing: -0.5, marginTop: 16, lineHeight: 1.2 }}>{t('upgrade.title')}</div>
            <div style={{ fontSize: 14, color: T.mute, marginTop: 10, lineHeight: 1.5 }}>{t('upgrade.body')}</div>
            <div style={{ marginTop: 20, padding: 14, background: T.paperSoft, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontFamily: T.fDisplay, fontSize: 22 }}>$18</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>Pro · monthly</div>
                <div style={{ fontSize: 11, color: T.mute }}>Cancel anytime</div>
              </div>
              <div style={{ flex: 1 }}/>
              <Mono size={10} color={T.cool}>UNLIMITED SIMS</Mono>
            </div>
            <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
              <div onClick={() => onNav && onNav('library')} style={{ flex: 1 }}>
                <Btn style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}>{t('upgrade.later')}</Btn>
              </div>
              <div onClick={() => onNav && onNav('pricing')} style={{ flex: 2 }}>
                <Btn accent style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}>{t('upgrade.cta')} →</Btn>
              </div>
            </div>
          </div>
        </div>
      </Browser>
    );
  }

  function SettingsScreen({ onNav }){
    const [lang, setLang] = i18n.useLang();
    const t = (k) => i18n.t(k, lang);
    const [tab, setTab] = useState('account');
    const tabs = [
      ['account',  'Data'],
      ['billing',  'Cloud'],
      ['language', t('settings.language')],
      ['about',    'About'],
    ];
    return (
      <Browser url="personastudio.app/settings">
        <AppNav active="home" onNav={onNav}/>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr', background: T.paper, minHeight: 0 }}>
          <div style={{ borderRight: `1px solid ${T.hair}`, padding: 24, background: T.paperSoft }}>
            <Eyebrow>{t('settings.title').toUpperCase()}</Eyebrow>
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {tabs.map(([k, l]) => (
                <div key={k} onClick={() => setTab(k)} style={{
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  background: tab === k ? '#fff' : 'transparent',
                  border: tab === k ? `1px solid ${T.hair}` : '1px solid transparent',
                  fontWeight: tab === k ? 500 : 400,
                }}>{l}</div>
              ))}
            </div>
          </div>
          <div style={{ padding: 40, overflow: 'auto' }}>
            {tab === 'account' && (
              <div style={{ maxWidth: 640 }}>
                <div style={{ fontFamily: T.fDisplay, fontSize: 28, fontWeight: 400, letterSpacing: -0.5 }}>Data</div>
                <div style={{ marginTop: 6, fontSize: 13, color: T.mute, lineHeight: 1.5 }}>
                  You're in <b style={{ color: T.ink }}>guest mode</b>. Everything lives in your browser — no server, no account. Back up to JSON anytime.
                </div>

                <div style={{ marginTop: 24, padding: 20, background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 12 }}>
                  <Mono size={10}>LOCAL STORAGE</Mono>
                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                    {[
                      ['Avatars',     '7',  'IndexedDB'],
                      ['Simulations', '12', 'IndexedDB'],
                      ['Preferences', '4',  'localStorage'],
                    ].map(([l, n, where]) => (
                      <div key={l}>
                        <div style={{ fontFamily: T.fDisplay, fontSize: 28, fontWeight: 400, letterSpacing: -0.5 }}>{n}</div>
                        <div style={{ fontSize: 13, marginTop: 2 }}>{l}</div>
                        <Mono size={10} style={{ marginTop: 2 }}>{where}</Mono>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 18, height: 6, borderRadius: 3, background: T.paperSoft, overflow: 'hidden' }}>
                    <div style={{ width: '18%', height: '100%', background: T.cool }}/>
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <Mono size={10}>8.4 MB / 50 MB used</Mono>
                    <Mono size={10}>BROWSER QUOTA</Mono>
                  </div>
                </div>

                <div style={{ marginTop: 20, padding: 20, background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 12 }}>
                  <Mono size={10}>BACKUP & RESTORE</Mono>
                  <div style={{ marginTop: 12, fontSize: 13, color: T.inkSoft, lineHeight: 1.5 }}>
                    Export a JSON snapshot of everything — avatars, sims, preferences. Move it to another browser, or check it into git.
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                    <Btn primary style={{ cursor: 'pointer' }}>↓ Export all (.json)</Btn>
                    <Btn style={{ cursor: 'pointer' }}>↑ Import</Btn>
                    <div style={{ flex: 1 }}/>
                    <Mono size={10}>LAST BACKUP · NEVER</Mono>
                  </div>
                </div>

                <div style={{ marginTop: 20, padding: 20, background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 12 }}>
                  <Mono size={10}>MODEL PROVIDER</Mono>
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {[
                      ['Anthropic', 'claude-sonnet-4.5', true],
                      ['OpenAI',    'gpt-4o',            false],
                      ['Ollama',    'llama3.1 · local',  false],
                    ].map(([name, model, active]) => (
                      <div key={name} style={{
                        padding: 14, borderRadius: 10, cursor: 'pointer',
                        border: `1.5px solid ${active ? T.ink : T.hair}`,
                        background: active ? T.paperSoft : '#fff',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{name}</div>
                        <Mono size={10} style={{ marginTop: 4 }}>{model}</Mono>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: T.mute }}>
                    API keys are stored in your browser. They never leave your machine except to call the provider directly.
                  </div>
                </div>

                <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${T.hair}`, display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}/>
                  <div style={{ padding: '10px 20px', borderRadius: 999, fontSize: 13, color: '#b84a3a', border: '1px solid #f4d4cd', cursor: 'pointer' }}>Clear all local data</div>
                </div>
              </div>
            )}
            {tab === 'billing' && (
              <div style={{ maxWidth: 640 }}>
                <div style={{ fontFamily: T.fDisplay, fontSize: 28, fontWeight: 400, letterSpacing: -0.5 }}>Cloud</div>
                <div style={{ marginTop: 6, fontSize: 13, color: T.mute, lineHeight: 1.5 }}>
                  A hosted version of Persona Studio is in the works — team libraries, shared simulations, SSO. Not needed for solo use.
                </div>
                <div style={{ marginTop: 24, padding: 28, background: T.ink, color: '#fff', borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 500px 300px at 90% -20%, rgba(201,100,66,0.25), transparent 60%)`, pointerEvents: 'none' }}/>
                  <div style={{ position: 'relative' }}>
                    <Mono size={10} color="rgba(255,255,255,0.5)">CLOUD · COMING SOON</Mono>
                    <div style={{ fontFamily: T.fDisplay, fontStyle: 'italic', fontWeight: 300, fontSize: 30, letterSpacing: -0.8, marginTop: 10, lineHeight: 1.15 }}>
                      Same software, less plumbing.
                    </div>
                    <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, maxWidth: 460 }}>
                      Self-hosting is great until it isn't. We'll run it for you — hosted inference, team workspace, SSO, audit logs. The OSS build stays OSS, forever.
                    </div>
                    <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                      <div style={{ padding: '10px 18px', borderRadius: 999, background: '#fff', color: T.ink, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Join the waitlist →</div>
                      <div style={{ padding: '10px 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)', fontSize: 13, cursor: 'pointer' }}>Read the plan</div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 18, padding: 18, background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 12 }}>
                  <Mono size={10}>SELF-HOSTING</Mono>
                  <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 8, lineHeight: 1.5 }}>
                    Prefer to run it yourself? The full stack is on GitHub. Docker image, Helm chart, and a one-line installer.
                  </div>
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: T.paperSoft, fontFamily: T.fMono, fontSize: 12, color: T.ink }}>
                    $ curl -fsSL get.persona-studio.dev | sh
                  </div>
                </div>
              </div>
            )}
            {tab === 'about' && (
              <div style={{ maxWidth: 640 }}>
                <div style={{ fontFamily: T.fDisplay, fontSize: 28, fontWeight: 400, letterSpacing: -0.5 }}>About</div>
                <div style={{ marginTop: 18, padding: 22, background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `conic-gradient(from 180deg, ${T.accent}, ${T.cool}, ${T.accent})` }}/>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 15 }}>Persona Studio</div>
                      <Mono size={11}>v0.5.3-alpha · build 2026.04.21</Mono>
                    </div>
                    <div style={{ flex: 1 }}/>
                    <Mono size={10} style={{ padding: '3px 8px', background: T.coolSoft, color: T.cool, borderRadius: 4, letterSpacing: 1 }}>ELv2</Mono>
                  </div>
                </div>

                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['★ GitHub',        'github.com/persona-studio'],
                    ['Discord',         'discord.gg/persona-studio'],
                    ['Docs',            'persona-studio.dev/docs'],
                    ['Changelog',       'persona-studio.dev/changelog'],
                    ['License (ELv2)',  'elastic.co/licensing/elastic-license'],
                    ['Report an issue', 'github.com/.../issues/new'],
                  ].map(([l, url]) => (
                    <div key={l} style={{ padding: 14, background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 10, cursor: 'pointer' }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{l}</div>
                      <Mono size={10} style={{ marginTop: 3 }}>{url} ↗</Mono>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 18, padding: 18, background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 12 }}>
                  <Mono size={10}>CONTRIBUTORS · 43</Mono>
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {P.concat(P).concat(P.slice(0,4)).map((p,i) => (
                      <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: hueBg(p.hue), border: `2px solid ${T.paper}` }}/>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, fontSize: 12, color: T.mute, lineHeight: 1.5 }}>
                    Built in the open. PRs, issues, and show-and-tell welcome.
                  </div>
                </div>
              </div>
            )}
            {tab === 'language' && (
              <div style={{ maxWidth: 560 }}>
                <div style={{ fontFamily: T.fDisplay, fontSize: 28, fontWeight: 400, letterSpacing: -0.5 }}>{t('settings.language')}</div>
                <div style={{ marginTop: 18, fontSize: 13, color: T.mute }}>
                  {t('lang.current')}: <b style={{ color: T.ink }}>{i18n.LANGS.find(l => l.code === lang)?.name}</b>
                </div>
                <div style={{ marginTop: 22 }}>
                  <Mono size={10}>{t('lang.interface').toUpperCase()}</Mono>
                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {i18n.LANGS.map(L => (
                      <div key={L.code} onClick={() => setLang(L.code)} style={{
                        padding: 16, borderRadius: 12, cursor: 'pointer',
                        border: `1.5px solid ${lang === L.code ? T.ink : T.hair}`,
                        background: lang === L.code ? T.paperSoft : '#fff',
                        display: 'flex', flexDirection: 'column', gap: 4,
                      }}>
                        <Mono size={10} color={lang === L.code ? T.accent : T.mute}>{L.short}</Mono>
                        <div style={{ fontWeight: 500 }}>{L.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 28, padding: 18, background: '#fff', border: `1px solid ${T.hair}`, borderRadius: 12 }}>
                  <Mono size={10}>{t('lang.persona').toUpperCase()}</Mono>
                  <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 8, lineHeight: 1.5 }}>
                    Personas reply in their native language by default. You can override per-simulation from the setup screen.
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 18, borderRadius: 999, background: T.ink, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: '#fff' }}/>
                    </div>
                    <div style={{ fontSize: 13 }}>Auto-detect from the question</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Browser>
    );
  }

  window.HF_Auth = { SignInScreen, SignUpScreen, OnboardScreen, PricingScreen, UpgradeModal, SettingsScreen };
})();
