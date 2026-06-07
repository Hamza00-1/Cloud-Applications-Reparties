// CampusOps — Login (with Forgot + Reset Password flow)
const { useState: uSL, useEffect: uEL } = React;

const DEMO_CREDS = {
  admin:      { email: 'hamza.khchichine@eidia.ueuromed.org', password: 'CampusOps@2026' },
  scolarite:  { email: 'karima.eddahhak@eidia.ueuromed.org',  password: 'CampusOps@2026' },
  enseignant: { email: 'imad.adnane@eidia.ueuromed.org',      password: 'CampusOps@2026' },
  etudiant:   { email: 'siham.lyzoul@eidia.ueuromed.org',     password: 'CampusOps@2026' },
};

function Login({ onAuth }) {
  const { t, lang, setLang } = useI18n();

  // Detect reset token in URL
  const urlResetToken = new URLSearchParams(window.location.search).get('reset_token') || '';

  // view: 'login' | 'forgot' | 'reset'
  const [view, setView]           = uSL(urlResetToken ? 'reset' : 'login');

  // Login state
  const [role, setRole]           = uSL('admin');
  const [email, setEmail]         = uSL(DEMO_CREDS.admin.email);
  const [pwd, setPwd]             = uSL(DEMO_CREDS.admin.password);

  // Forgot state
  const [forgotEmail, setForgotEmail] = uSL('');
  const [forgotSent, setForgotSent]   = uSL(false);

  // Reset state
  const [resetToken, setResetToken]     = uSL(urlResetToken);
  const [resetPwd, setResetPwd]         = uSL('');
  const [resetConfirm, setResetConfirm] = uSL('');
  const [resetDone, setResetDone]       = uSL(false);

  // Shared
  const [loading, setLoading]     = uSL(false);
  const [error, setError]         = uSL('');

  uEL(() => {
    const c = DEMO_CREDS[role];
    if (c) { setEmail(c.email); setPwd(c.password); }
  }, [role]);

  // ── Login ──
  const submitLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await window.api.request('/auth/login', { method: 'POST', body: { email, password: pwd }, noAuth: true });
      window.api.setTokens(res.data.accessToken, res.data.refreshToken);
      const userRole = (res.data.user.role || role).toLowerCase();
      ROLES[userRole] = { id: userRole, label: res.data.user.role, name: res.data.user.name, email: res.data.user.email, color: ROLES[userRole]?.color || '#5FA83C' };
      onAuth(userRole);
    } catch(err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  // ── Forgot password ──
  const submitForgot = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await window.api.request('/auth/forgot-password', { method: 'POST', body: { email: forgotEmail }, noAuth: true });
      setForgotSent(true);
    } catch(err) {
      setError(err.message || 'Failed to send reset email.');
    } finally { setLoading(false); }
  };

  // ── Reset password ──
  const submitReset = async (e) => {
    e.preventDefault();
    setError('');
    if (resetPwd !== resetConfirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await window.api.request('/auth/reset-password', { method: 'POST', body: { token: resetToken, password: resetPwd }, noAuth: true });
      window.history.replaceState({}, '', window.location.pathname);
      setResetDone(true);
    } catch(err) {
      setError(err.message || 'Reset failed. The link may have expired.');
    } finally { setLoading(false); }
  };

  const hero = (
    <div className="login-hero">
      <div className="logo" style={{alignItems:'center', gap:12}}>
        <img src="uploads/UEMF.png" alt="UEMF Logo" style={{height:48, objectFit:'contain'}} />
        <div className="logo-txt">CampusOps</div>
      </div>
      <div className="hero-body">
        <h1>{lang==='fr' ? "L'opérateur de votre campus." : 'Run your campus on one platform.'}</h1>
        <p className="lead">{lang==='fr' ? 'Planning, présences, notes, paiements et utilisateurs — un système unifié.' : 'Scheduling, attendance, grading, payments and people — one unified system.'}</p>
        <div className="badges">
          <span className="hbadge">SOC 2</span>
          <span className="hbadge">FERPA-aligned</span>
          <span className="hbadge">99.99% uptime</span>
        </div>
      </div>
      <div className="foot"><span>© 2025 CampusOps</span><span>Privacy</span><span>Terms</span></div>
    </div>
  );

  const langToggle = (
    <div style={{display:'flex',justifyContent:'flex-end',marginBottom:18}}>
      <div className="segment" style={{padding:2}}>
        <button type="button" className={lang==='en'?'active':''} onClick={()=>setLang('en')}>EN</button>
        <button type="button" className={lang==='fr'?'active':''} onClick={()=>setLang('fr')}>FR</button>
      </div>
    </div>
  );

  const errorBox = error ? (
    <div style={{padding:'10px 12px',borderRadius:8,background:'#FEF2F2',color:'#DC2626',fontSize:12.5,marginBottom:12,border:'1px solid #FECACA',fontWeight:500}}>{error}</div>
  ) : null;

  // ── FORGOT VIEW ──
  if (view === 'forgot') return (
    <div className="login">
      {hero}
      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submitForgot}>
          {langToggle}
          <h2>{lang==='fr' ? 'Mot de passe oublié' : 'Forgot password'}</h2>
          <div className="sub" style={{marginBottom:18}}>{lang==='fr' ? "Entrez votre email — nous vous enverrons un lien valide 15 minutes." : "Enter your email and we'll send a reset link valid for 15 minutes."}</div>
          {errorBox}
          {forgotSent ? (
            <div style={{padding:16,borderRadius:10,background:'#F0FDF4',border:'1px solid #86EFAC',textAlign:'center'}}>
              <div style={{fontSize:28,marginBottom:8}}>📧</div>
              <div style={{fontWeight:600,color:'#166534',marginBottom:4}}>{lang==='fr' ? 'Email envoyé !' : 'Email sent!'}</div>
              <div style={{fontSize:12.5,color:'#166534'}}>{lang==='fr' ? 'Vérifiez votre boîte mail et cliquez sur le lien dans les 15 minutes.' : 'Check your inbox and click the link within 15 minutes.'}</div>
            </div>
          ) : (
            <>
              <div className="field"><label>{t('login.email')}</label><input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} required placeholder="your@email.ma" /></div>
              <button type="submit" className="btn btn-primary full" disabled={loading} style={{marginTop:8}}>{loading ? '...' : (lang==='fr' ? 'Envoyer le lien' : 'Send reset link')}</button>
            </>
          )}
          <div style={{textAlign:'center',marginTop:16}}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={()=>{setView('login');setError('');setForgotSent(false);}}>← {lang==='fr' ? 'Retour à la connexion' : 'Back to login'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  // ── RESET VIEW ──
  if (view === 'reset') return (
    <div className="login">
      {hero}
      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submitReset}>
          {langToggle}
          <h2>{lang==='fr' ? 'Nouveau mot de passe' : 'Set new password'}</h2>
          <div className="sub" style={{marginBottom:18}}>{lang==='fr' ? 'Choisissez un nouveau mot de passe sécurisé.' : 'Choose a strong new password for your account.'}</div>
          {errorBox}
          {resetDone ? (
            <div style={{padding:16,borderRadius:10,background:'#F0FDF4',border:'1px solid #86EFAC',textAlign:'center'}}>
              <div style={{fontSize:28,marginBottom:8}}>✅</div>
              <div style={{fontWeight:600,color:'#166534',marginBottom:4}}>{lang==='fr' ? 'Mot de passe réinitialisé !' : 'Password reset!'}</div>
              <div style={{fontSize:12.5,color:'#166534',marginBottom:12}}>{lang==='fr' ? 'Vous pouvez vous connecter avec votre nouveau mot de passe.' : 'You can now log in with your new password.'}</div>
              <button type="button" className="btn btn-primary btn-sm" onClick={()=>{setView('login');setError('');}}>{lang==='fr' ? 'Se connecter' : 'Go to login'}</button>
            </div>
          ) : (
            <>
              {!urlResetToken && (
                <div className="field"><label>{lang==='fr' ? 'Code de réinitialisation' : 'Reset token'}</label><input value={resetToken} onChange={e=>setResetToken(e.target.value)} required placeholder="Paste token from email…" /></div>
              )}
              <div className="field"><label>{lang==='fr' ? 'Nouveau mot de passe' : 'New password'}</label><input type="password" value={resetPwd} onChange={e=>setResetPwd(e.target.value)} required placeholder="Min. 8 chars, uppercase, number, symbol" /></div>
              <div className="field"><label>{lang==='fr' ? 'Confirmer' : 'Confirm password'}</label><input type="password" value={resetConfirm} onChange={e=>setResetConfirm(e.target.value)} required /></div>
              <button type="submit" className="btn btn-primary full" disabled={loading} style={{marginTop:8}}>{loading ? '...' : (lang==='fr' ? 'Réinitialiser' : 'Reset password')}</button>
            </>
          )}
          <div style={{textAlign:'center',marginTop:16}}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={()=>{setView('login');setError('');}}> ← {lang==='fr' ? 'Retour' : 'Back to login'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  // ── DEFAULT LOGIN VIEW ──
  return (
    <div className="login">
      {hero}
      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submitLogin}>
          {langToggle}
          <h2>{t('login.welcome')}</h2>
          <div className="sub">{lang==='fr' ? 'Connectez-vous pour continuer' : 'Sign in to continue to CampusOps'}</div>

          <div className="role-tabs">
            {Object.values(ROLES).map(r => (
              <div key={r.id} className={`role-tab ${role===r.id?'active':''}`} onClick={()=>setRole(r.id)}>
                {r.label.length>10 ? r.label.slice(0,10) : r.label}
              </div>
            ))}
          </div>

          {errorBox}

          <div className="field"><label>{t('login.email')}</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" /></div>
          <div className="field">
            <label style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>{t('login.password')}</span>
              <button type="button" style={{fontSize:11,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'inherit'}} onClick={()=>{setView('forgot');setError('');setForgotEmail(email);}}>
                {lang==='fr' ? 'Mot de passe oublié ?' : 'Forgot password?'}
              </button>
            </label>
            <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} required autoComplete="current-password" />
          </div>

          <button type="submit" className="btn btn-primary full" style={{marginTop:8}} disabled={loading}>
            {loading ? (lang==='fr' ? 'Connexion…' : 'Signing in…') : t('login.signIn')}
          </button>

          <div style={{textAlign:'center',marginTop:18,fontSize:12,color:'var(--text-3)'}}>
            {lang==='fr' ? 'Identifiants pré-remplis — cliquez sur un rôle' : 'Credentials auto-filled — click a role above'}
          </div>
        </form>
      </div>
    </div>
  );
}

window.Login = Login;
