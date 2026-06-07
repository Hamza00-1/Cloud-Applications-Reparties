// CampusOps — shell (sidebar + topbar)
const { useState: uSS, useEffect: uES, useRef: uRS } = React;

function Sidebar({ role, active, onNav, collapsed, onToggle }) {
  const { t } = useI18n();
  const groups = NAV_GROUPS.map(g => ({ ...g, items: g.items.filter(i => i.roles.includes(role)) })).filter(g => g.items.length);
  const r = ROLES[role];
  const unread = NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <aside className="sb">
      <div className="sb-head">
        {!collapsed && (
          <>
            <img src="uploads/Logo_UEMF_2016.jpg" alt="UEMF Logo" className="logo-light" style={{ height: 36, objectFit: 'contain' }} />
            <img src="uploads/UEMF.png" alt="UEMF Logo" className="logo-dark" style={{ height: 36, objectFit: 'contain' }} />
            <div className="sb-brand" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 4 }}>
              CampusOps
              <small>{t('app.tagline', 'University OS')}</small>
            </div>
          </>
        )}
        <button className="sb-toggle" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'} style={collapsed ? { margin: 0, marginInline: 'auto' } : {}}>
          <Icon name="chevron" size={14} />
        </button>
      </div>
      <div className="sb-body">
        {groups.map(g => (
          <div key={g.label} className="sb-group">
            <div className="sb-group-label">{t('nav.' + g.label, g.label)}</div>
            {g.items.map(i => (
              <div key={i.id} className={`sb-item ${active === i.id ? 'active' : ''}`} onClick={() => onNav(i.id)}>
                <span className="ic"><Icon name={i.icon} size={18} /></span>
                <span className="lbl">{t('nav.' + i.label, i.label)}</span>
                {i.id === 'notifications' && unread > 0 && <span className="cnt">{unread}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="sb-foot">
        <div className="sb-user" onClick={() => onNav('settings')}>
          <div className="av" style={{ background: r.color }}>{r.name.split(' ').map(p => p[0]).slice(0, 2).join('')}</div>
          <div className="info">
            <div className="nm">{r.name}</div>
            <div className="rl">{r.label}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function buildSearchIndex() {
  const idx = [];
  STUDENTS.forEach(s => idx.push({ kind: 'Student', id: s.id, label: s.name, meta: s.group, page: 'users' }));
  USERS_LIST.forEach(u => idx.push({ kind: 'User', id: u.id, label: u.name, meta: u.role, page: 'users' }));
  GROUPS_LIST.forEach(g => idx.push({ kind: 'Group', id: g.id, label: g.name, meta: g.branch, page: 'groups' }));
  MODULES.forEach(m => idx.push({ kind: 'Module', id: m.code, label: m.name, meta: m.code, page: 'modules' }));
  BRANCHES.forEach(b => idx.push({ kind: 'Branch', id: b.code, label: b.name, meta: b.head, page: 'branches' }));
  return idx;
}

function Topbar({ role, onRole, onLogout, onNav, unread, notifOpen, setNotifOpen, profOpen, setProfOpen, pageTitle, theme, setTheme, lang, setLang }) {
  const { t } = useI18n();
  const [q, setQ] = uSS('');
  const [showRes, setShowRes] = uSS(false);
  const idx = uRS(null);
  if (!idx.current) idx.current = buildSearchIndex();
  const results = q.trim().length < 1 ? [] : idx.current.filter(r => (r.label + ' ' + (r.meta || '') + ' ' + r.id).toLowerCase().includes(q.toLowerCase())).slice(0, 18);
  const grouped = {};
  results.forEach(r => { (grouped[r.kind] = grouped[r.kind] || []).push(r); });

  const r = ROLES[role];

  return (
    <div className="tb">
      <div className="tb-search">
        <span className="search-icon"><Icon name="search" size={16} /></span>
        <input
          placeholder={t('tb.search')}
          value={q}
          onChange={e => { setQ(e.target.value); setShowRes(true); }}
          onFocus={() => setShowRes(true)}
          onBlur={() => setTimeout(() => setShowRes(false), 200)}
        />
        <kbd className="tb-kbd">⌘K</kbd>
        {showRes && q.trim().length > 0 && (
          <div className="tb-results">
            {results.length === 0 && <div className="empty">No matches for "{q}"</div>}
            {Object.keys(grouped).map(kind => (
              <div key={kind}>
                <div className="group-label">{kind}s</div>
                {grouped[kind].map(rr => (
                  <div key={rr.kind + rr.id} className="res" onMouseDown={() => { onNav(rr.page); setQ(''); setShowRes(false); }}>
                    <span style={{ flex: 1 }}>{rr.label}</span>
                    <span className="meta">{rr.meta}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="tb-sp"></div>

      {/* Language switcher */}
      <div style={{ position: 'relative' }}>
        <div className="segment" style={{ padding: 2 }}>
          <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
          <button className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>FR</button>
        </div>
      </div>

      {/* Theme toggle */}
      <button className="tb-btn" title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
      </button>

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button className="tb-btn" onClick={() => { setNotifOpen(!notifOpen); setProfOpen(false); }}>
          <Icon name="bell" size={18} />
          {unread > 0 && <span className="nbadge"></span>}
        </button>
        {notifOpen && (
          <div className="menu" style={{ width: 380, padding: 0, right: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t('tb.notifications')}</div>
              <button className="link" style={{ fontSize: 12 }} onClick={() => onNav('notifications')}>{t('btn.viewAll')}</button>
            </div>
            <div style={{ maxHeight: 380, overflowY: 'auto', padding: 8 }}>
              {NOTIFICATIONS.slice(0, 5).map(n => (
                <div key={n.id} className={`notif ${n.read ? '' : 'unread'} t-${n.type}`} style={{ marginBottom: 6, padding: '10px 12px' }}>
                  <span className="dot"></span>
                  <div className="body">
                    <div className="t" style={{ fontSize: 13 }}>{n.title}</div>
                    <div className="d" style={{ fontSize: 11.5 }}>{n.desc}</div>
                    <div className="tm">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div style={{ position: 'relative' }}>
        <div className="tb-role" onClick={() => { setProfOpen(!profOpen); setNotifOpen(false); }}>
          <span className="d" style={{ background: r.color }}></span>
          {r.label}
        </div>
        {profOpen && (
          <div className="menu" style={{ minWidth: 240, right: 0 }}>
            <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{r.email}</div>
            </div>
            <div className="menu-item" onClick={() => { onNav('settings'); setProfOpen(false); }}>
              <Icon name="settings" size={16} /> {t('tb.settings')}
            </div>
            <div className="menu-item" style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 10, color: 'var(--red)' }} onClick={onLogout}>
              <Icon name="logout" size={16} /> {t('tb.logout')}
            </div>
            <div style={{ padding: '10px 12px 4px', borderTop: '1px solid var(--border)', marginTop: 6, fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>Switch role (demo)</div>
            {Object.values(ROLES).map(rr => (
              <div key={rr.id} className={`menu-item ${rr.id === role ? 'active' : ''}`} onClick={() => { onRole(rr.id); setProfOpen(false); }}>
                <span className="d" style={{ width: 8, height: 8, borderRadius: '50%', background: rr.color }}></span>
                {rr.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Toasts({ items, remove }) {
  const ICON_MAP = { success: 'check', error: 'alert', warn: 'alert', info: 'info' };
  return (
    <div className="toasts">
      {items.map(t => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>
          <div className="t-ic"><Icon name={ICON_MAP[t.type] || 'info'} size={18} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="tt">{t.title}</div>
            {t.desc && <div className="td">{t.desc}</div>}
          </div>
          <button className="t-close" onClick={() => remove(t.id)}><Icon name="close" size={14} /></button>
          <div className="t-progress"></div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, Toasts });
