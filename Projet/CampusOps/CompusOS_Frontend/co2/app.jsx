// CampusOps — App root
const { useState: uSA, useEffect: uEA } = React;

const PAGE_TITLES = {
  dashboard:'Dashboard', planning:'Planning', absences:'Attendance', modules:'Modules',
  progress:'Progress', grades:'Grades', payments:'Payments', users:'Users', groups:'Groups',
  branches:'Branches', notifications:'Notifications', settings:'Settings',
};

function App() {
  const { t, lang, setLang } = useI18n();
  const [auth, setAuth]     = uSA(null);
  const [loading, setLoading] = uSA(true);
  const [page, setPage]     = uSA(() => localStorage.getItem('co2_page') || 'dashboard');
  const [collapsed, setColl]= uSA(() => localStorage.getItem('co2_coll')==='1');
  const [theme, setThemeS]  = uSA(() => localStorage.getItem('co2_theme') || 'light');
  const [toasts, setToasts] = uSA([]);
  const [notifOpen, setNo]  = uSA(false);
  const [profOpen, setPo]   = uSA(false);

  // Apply theme to document
  uEA(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('co2_theme', theme);
  }, [theme]);

  // Apply stored density on mount
  uEA(() => {
    const d = localStorage.getItem('co2_density') || 'comfortable';
    document.documentElement.setAttribute('data-density', d);
  }, []);

  uEA(() => { if(auth) localStorage.setItem('co2_role', auth); }, [auth]);
  uEA(() => localStorage.setItem('co2_page', page), [page]);
  uEA(() => localStorage.setItem('co2_coll', collapsed?'1':'0'), [collapsed]);

  // Shared data-refresh function — callable from anywhere
  const refreshAllData = async () => {
    const replace = (arr, items) => { if (Array.isArray(arr)) arr.splice(0, arr.length, ...items); };
    try {
      const [md, gp, br, us, py, nt, pl] = await Promise.allSettled([
        window.api.request('/modules'),
        window.api.request('/groups'),
        window.api.request('/branches'),
        window.api.request('/users?limit=200'),
        window.api.request('/payments'),
        window.api.request('/notifications'),
        window.api.request('/planning'),
      ]);

      if (md.status==='fulfilled' && md.value.data?.length) {
        window._rawModules = md.value.data;
        replace(window.MODULES, md.value.data.map(m => ({
          id: m.id, code: m.code || m.id?.substring(0,6) || '???',
          name: m.name, credits: m.credits || 4,
          teacher: m.teacher?.name || '—', color: '#5FA83C',
        })));
      }
      if (gp.status==='fulfilled' && gp.value.data?.length) {
        window._rawGroups = gp.value.data;
        replace(window.GROUPS_LIST, gp.value.data.map(g => ({
          id: g.id, name: g.name, branch: g.branch?.name || '—',
          students: g._count?.students || 0, year: g.academicYear || '2025/2026',
        })));
      }
      if (br.status==='fulfilled' && br.value.data?.length) {
        replace(window.BRANCHES, br.value.data.map(b => ({
          id: b.id, code: b.code || b.id?.substring(0,4) || '??',
          name: b.name, head: '—',
          students: b._count?.users || 0, groups: b._count?.groups || 0, color: '#5FA83C',
        })));
      }
      if (us.status==='fulfilled' && us.value.data?.length) {
        replace(window.USERS_LIST, us.value.data.map(x => ({
          id: x.id, name: x.name, role: (x.role || '').toLowerCase(),
          email: x.email, branch: x.branch?.name || '—', status: 'active',
          init: x.name?.substring(0,2).toUpperCase() || '??', color: '#5FA83C',
        })));
        const studs = us.value.data.filter(x => x.role === 'Etudiant');
        replace(window.STUDENTS, studs.map(s => ({
          id: s.id, name: s.name, group: s.group?.name || '—',
          avg: 14, att: 90, status: 'active',
          init: s.name?.substring(0,2).toUpperCase() || '??', color: '#7CB342',
        })));
      }
      if (py.status==='fulfilled' && py.value.data?.length) {
        replace(window.PAYMENTS, py.value.data.map(p => ({
          id: p.id, student: p.student?.name || '—', group: p.student?.group?.name || '—',
          type: p.planType || 'Tuition', amount: parseFloat(p.amount) || 0,
          status: (p.status || 'pending').toLowerCase(),
          date: new Date(p.dueDate).toLocaleDateString(), method: '—',
        })));
      }
      if (nt.status==='fulfilled' && nt.value.data?.length) {
        replace(window.NOTIFICATIONS, nt.value.data.map(n => ({
          id: n.id, type: n.type?.toLowerCase() || 'info',
          title: n.title, desc: n.content,
          time: new Date(n.createdAt).toLocaleDateString(), read: n.isRead,
        })));
      }
      if (pl.status==='fulfilled' && pl.value.data?.length) {
        window.SESSIONS = pl.value.data.map(s => {
          const d = new Date(s.startTime), e = new Date(s.endTime), dur = (e-d)/3600000;
          return { id: s.id, day: d.getDay()===0?6:d.getDay()-1, start: d.getHours()+d.getMinutes()/60, dur, mod: s.module?.name||'?', grp: s.group?.name||'?', room: s.room, teacherId: s.teacherId };
        });
      }
    } catch(e) {
      console.error('Data refresh failed', e);
    }
  };
  // Expose globally so any page component can call it after mutations
  window.refreshAllData = refreshAllData;

  // Boot: check token → fetch profile → load live data
  uEA(() => {
    const boot = async () => {
      if (!window.api.getToken()) { setLoading(false); return; }
      try {
        const prof = await window.api.request('/auth/profile');
        const u = prof.data;
        const role = (u.role || 'admin').toLowerCase();

        // Inject real user into ROLES
        ROLES[role] = {
          id: role,
          label: u.role,
          name: u.name,
          email: u.email,
          color: ROLES[role]?.color || '#5FA83C',
        };
        window._userId = u.id;
        window._userGroups    = (u.studentGroups || []).map(sg => sg.group?.name).filter(Boolean);
        window._userGroupIds  = (u.studentGroups || []).map(sg => sg.group?.id).filter(Boolean);

        await refreshAllData();
        setAuth(role);
      } catch(err) {
        // Token invalid — clear and show login
        window.api.clearTokens();
        setAuth(null);
      } finally {
        setLoading(false);
      }
    };

    boot();

    // Listen for token expiry fired by api.js
    const onExp = () => { window.api.clearTokens(); setAuth(null); setLoading(false); };
    window.addEventListener('auth_expired', onExp);
    return () => window.removeEventListener('auth_expired', onExp);
  }, []);

  // Re-fetch data whenever the user navigates to a different page
  uEA(() => {
    if (auth && window.api.getToken()) {
      refreshAllData();
    }
  }, [page]);

  const toast = (cfg) => {
    const id = Math.random().toString(36).slice(2,9);
    setToasts(ts => [...ts, { id, type:'info', ...cfg }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id!==id)), 4000);
  };
  const removeT  = (id) => setToasts(ts => ts.filter(x => x.id!==id));
  const setTheme = (th) => { setThemeS(th); toast({ type:'success', title:`${th==='dark'?'Dark':'Light'} theme enabled` }); };
  const navigate = (p) => { if(p==='payments' && auth==='enseignant') return; setPage(p); setNo(false); setPo(false); };
  const handleLogout = () => { window.api.clearTokens(); setAuth(null); setPage('dashboard'); };

  // Loading spinner
  if (loading) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <div style={{width:40,height:40,borderRadius:'50%',border:'3px solid #E2E8F0',borderTopColor:'#5FA83C',animation:'spin 1s linear infinite'}}/>
      <div style={{fontSize:13,color:'#94A3B8',fontFamily:'Inter,sans-serif'}}>Loading CampusOps…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // Not authenticated — show login
  if (!auth) return <Login onAuth={(role) => { setAuth(role); }} />;

  const unread = NOTIFICATIONS.filter(n=>!n.read).length;

  return (
    <div className={`app ${collapsed?'collapsed':''}`}>
      <Sidebar role={auth} active={page} onNav={navigate} collapsed={collapsed} onToggle={()=>setColl(!collapsed)} />
      <div className="main">
        <Topbar
          role={auth}
          onRole={(r)=>{ setAuth(r); setPage('dashboard'); toast({title:`Switched to ${ROLES[r].label}`,type:'success'}); }}
          onLogout={handleLogout}
          onNav={navigate}
          unread={unread}
          notifOpen={notifOpen} setNotifOpen={setNo}
          profOpen={profOpen}   setProfOpen={setPo}
          pageTitle={t('nav.'+(PAGE_TITLES[page]||'Dashboard'))}
          theme={theme} setTheme={setTheme}
          lang={lang} setLang={(l)=>{ setLang(l); toast({type:'success',title:l==='en'?'Language: English':'Langue: Français'}); }}
        />
        <main className="content">
          {page==='dashboard'     && <Dashboard role={auth} toast={toast} onNav={navigate} />}
          {page==='planning'      && <Planning role={auth} toast={toast} />}
          {page==='absences'      && <Absences role={auth} toast={toast} />}
          {page==='modules'       && <Modules role={auth} toast={toast} />}
          {page==='progress'      && <Progress role={auth} />}
          {page==='grades'        && <Grades role={auth} toast={toast} />}
          {page==='payments'      && <Payments role={auth} toast={toast} />}
          {page==='users'         && <Users toast={toast} />}
          {page==='groups'        && <Groups toast={toast} />}
          {page==='branches'      && <Branches toast={toast} />}
          {page==='notifications' && <Notifications role={auth} toast={toast} onNav={navigate} />}
          {page==='settings'      && <Settings role={auth} onLogout={handleLogout} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} toast={toast} />}
        </main>
      </div>
      <Toasts items={toasts} remove={removeT} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
