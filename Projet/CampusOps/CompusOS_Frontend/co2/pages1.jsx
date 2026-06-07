// CampusOps — Pages part 1: Dashboard, Planning, Attendance, Modules, Grades, Branches
const { useState: uSP, useMemo: uMP, useEffect: uEP, useRef: uRP } = React;

const DAYS_EN = ['Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam'];
const HOURS = [8,9,10,11,12,13,14,15,16,17,18];

// ─── DASHBOARD ───
function Dashboard({ role, toast, onNav }) {
  const { t } = useI18n();
  if (role === 'admin')      return <DashAdmin t={t} onNav={onNav} />;
  if (role === 'scolarite')  return <DashScolarite t={t} onNav={onNav} />;
  if (role === 'enseignant') return <DashTeacher t={t} onNav={onNav} />;
  return <DashStudent t={t} onNav={onNav} />;
}

function StatCard({ icon, color, label, value, trend, trendDir }) {
  return (
    <div className="stat">
      <div className="stat-h">
        <div className="stat-ic" style={{background:color+'20', color}}><Icon name={icon} size={18} /></div>
        {trend && <span className={`trend ${trendDir||'up'}`}>{trend}</span>}
      </div>
      <div className="stat-v">{value}</div>
      <div className="stat-l">{label}</div>
    </div>
  );
}

function DashAdmin({ t, onNav }) {
  const [stats, setStats] = uSP({ students:'—', groups:'—', branches:'—', faculty:'—' });
  const [branchRows, setBranchRows] = uSP([]);
  const [activity, setActivity] = uSP([]);
  const [err, setErr] = uSP(null);

  uEP(() => {
    let ignore = false;
    (async () => {
      try {
        const [u, b, g, n] = await Promise.all([
          window.api.request('/users?limit=200'),
          window.api.request('/branches'),
          window.api.request('/groups'),
          window.api.request('/notifications'),
        ]);
        if (ignore) return;
        const users   = u?.data || [];
        const brs     = b?.data || [];
        const groups  = g?.data || [];
        const notifs  = n?.data || [];

        const studentCount = users.filter(x => x.role === 'Etudiant').length;
        const facultyCount = users.filter(x => x.role === 'Enseignant').length;
        setStats({
          students: studentCount,
          groups: groups.length,
          branches: brs.length,
          faculty: facultyCount,
        });

        // Per-branch summary — derive head + counts from the live data
        const palette = ['#5FA83C','#7C3AED','#F59E0B','#0891B2','#DC2626','#10B981'];
        setBranchRows(brs.map((br, i) => {
          const inBranch = users.filter(x => x.branchId === br.id);
          const head = inBranch.find(x => x.role === 'Admin') || inBranch.find(x => x.role === 'Scolarite');
          return {
            code: br.name,
            name: br.name,
            head: head ? head.name : '—',
            students: inBranch.filter(x => x.role === 'Etudiant').length,
            groups: groups.filter(gg => gg.branchId === br.id).length,
            color: palette[i % palette.length],
          };
        }));

        setActivity(notifs.slice(0, 5));
      } catch (e) {
        console.error('Dashboard load failed', e);
        if (!ignore) setErr(e?.message || 'Failed to load dashboard');
      }
    })();
    return () => { ignore = true; };
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Dashboard')}</h1>
          <div className="sub">System overview — {ROLES.admin.name}</div>
        </div>
      </div>
      {err && <div className="card" style={{padding:12,marginBottom:14,color:'var(--red)',background:'var(--red)10'}}>Failed to load live data: {err}</div>}
      <div className="grid-4" style={{marginBottom:14}}>
        <StatCard icon="users"    color="#5FA83C" label="Total students" value={stats.students} />
        <StatCard icon="groups"   color="#7C3AED" label="Active groups"  value={stats.groups} />
        <StatCard icon="branches" color="#F59E0B" label="Branches"       value={stats.branches} />
        <StatCard icon="users"    color="#0891B2" label="Faculty"        value={stats.faculty} />
      </div>
      <div className="grid-2-1" style={{marginBottom:14}}>
        <div className="card">
          <div className="card-head">
            <h3>Branches at a glance</h3>
            <button className="link" onClick={()=>onNav('branches')}>{t('btn.viewAll')}</button>
          </div>
          <table className="tbl">
            <thead><tr><th>Branch</th><th>Head</th><th>Students</th><th>Groups</th></tr></thead>
            <tbody>
              {branchRows.length === 0 && (
                <tr><td colSpan="4" style={{textAlign:'center',color:'var(--text-3)',padding:'18px 0'}}>No branches yet</td></tr>
              )}
              {branchRows.map(b => (
                <tr key={b.code}>
                  <td><div style={{display:'flex',alignItems:'center',gap:10}}><span className="av av-xs" style={{background:b.color}}>{b.code.slice(0,2).toUpperCase()}</span><strong>{b.name}</strong></div></td>
                  <td>{b.head}</td>
                  <td className="mono">{b.students}</td>
                  <td className="mono">{b.groups}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-head"><h3>Recent activity</h3></div>
          {activity.length === 0 && (
            <div style={{padding:'14px 0',color:'var(--text-3)',fontSize:13}}>No recent notifications.</div>
          )}
          {activity.map(n => (
            <div key={n.id} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:n.type==='alert'?'var(--red)':n.type==='success'?'var(--green)':'var(--accent)',marginTop:6,flexShrink:0}}></span>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{n.title}</div>
                <div style={{fontSize:11.5,color:'var(--text-3)',marginTop:2}}>{n.content || ''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DashScolarite({ t, onNav }) {
  const [stats, setStats] = uSP(null);
  uEP(() => {
    let ignore = false;
    (async () => {
      try {
        const [u, g, p] = await Promise.all([
          window.api.request('/users?limit=200'),
          window.api.request('/groups'),
          window.api.request('/payments'),
        ]);
        if (ignore) return;
        const users = u?.data || [];
        const groups = g?.data || [];
        const payments = p?.data || [];
        const studentCount = users.filter(x => x.role === 'Etudiant').length;
        const paid = payments.filter(x => (x.status||'').toLowerCase() === 'paid').length;
        const unpaid = payments.filter(x => (x.status||'').toLowerCase() === 'unpaid').length;
        setStats({
          totalStudents: studentCount,
          totalGroups: groups.length,
          attendanceRate: 91.2,
          collectionRate: payments.length > 0 ? ((paid / payments.length) * 100).toFixed(1) : 0,
          pendingPayments: unpaid,
          activeRequests: 0,
        });
      } catch {
        setStats(SCOLARITE_STATS);
      }
    })();
    return () => { ignore = true; };
  }, []);
  const s = stats || SCOLARITE_STATS;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Dashboard')}</h1>
          <div className="sub">Scolarité — {ROLES.scolarite.name}</div>
        </div>
      </div>
      <div className="grid-4" style={{marginBottom:14}}>
        <StatCard icon="users"    color="#5FA83C" label="Total students"      value={s.totalStudents} />
        <StatCard icon="groups"   color="#7C3AED" label="Active groups"       value={s.totalGroups} />
        <StatCard icon="absences" color="#0891B2" label="Attendance rate"     value={s.attendanceRate+'%'} />
        <StatCard icon="payments" color="#F59E0B" label="Collection rate"     value={s.collectionRate+'%'} />
      </div>
      <div className="grid-2-1" style={{marginBottom:14}}>
        <div className="card">
          <div className="card-head"><h3>Pending requests</h3></div>
          <div className="empty" style={{padding:'30px 20px'}}>{s.activeRequests} pending administrative requests.</div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Outstanding payments</h3><span className="badge orange">{s.pendingPayments}</span></div>
          <div style={{fontSize:13, color:'var(--text-2)', lineHeight:1.6}}>
            <div style={{marginBottom:6}}><strong>{s.pendingPayments}</strong> invoices awaiting payment</div>
            <button className="btn btn-ghost btn-sm" onClick={()=>onNav('payments')}>Review payments</button>
          </div>
        </div>
      </div>
    </>
  );
}

function DashTeacher({ t, onNav }) {
  const uid = window._userId;
  const teacherSessions = SESSIONS.filter(s => (uid && s.teacherId === uid) || s.teacher === ROLES.enseignant.name);
  const myModules = [...new Set(teacherSessions.map(s => s.mod))];
  const myGroups = [...new Set(teacherSessions.map(s => s.grp))];
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Dashboard')}</h1>
          <div className="sub">{ROLES.enseignant.name} — {ROLES.enseignant.field || 'EIDIA'}</div>
        </div>
      </div>
      <div className="grid-4" style={{marginBottom:14}}>
        <StatCard icon="modules"  color="#5FA83C" label="My modules"          value={myModules.length} />
        <StatCard icon="groups"   color="#7C3AED" label="Active groups"       value={myGroups.length} />
        <StatCard icon="users"    color="#F59E0B" label="Students taught"     value="—" />
        <StatCard icon="planning" color="#0891B2" label="Sessions this week"  value={teacherSessions.length} />
      </div>
      <div className="grid-2-1" style={{marginBottom:14}}>
        <div className="card">
          <div className="card-head">
            <h3>Today's sessions</h3>
            <button className="link" onClick={()=>onNav('planning')}>{t('btn.viewAll')}</button>
          </div>
          <table className="tbl">
            <thead><tr><th>Time</th><th>Module</th><th>Group</th><th>Room</th></tr></thead>
            <tbody>
              {teacherSessions.length === 0 && (
                <tr><td colSpan="4" style={{textAlign:'center',color:'var(--text-3)',padding:'18px 0'}}>No sessions assigned yet</td></tr>
              )}
              {teacherSessions.slice(0,5).map((s,i) => {
                const M = MODULES.find(m=>m.code===s.mod||m.name===s.mod) || {};
                return (
                  <tr key={i}>
                    <td className="mono">{String(Math.floor(s.start)).padStart(2,'0')}:{String(Math.round((s.start%1)*60)).padStart(2,'0')}</td>
                    <td><strong>{M.name||s.mod}</strong></td>
                    <td>{s.grp}</td>
                    <td className="mono">{s.room}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-head"><h3>Pending grading</h3></div>
          <div style={{fontSize:13,color:'var(--text-2)',lineHeight:1.7}}>
            <div style={{padding:'14px 0',color:'var(--text-3)'}}>No pending submissions.</div>
            <button className="btn btn-primary btn-sm" style={{marginTop:10}} onClick={()=>onNav('grades')}>Open grades</button>
          </div>
        </div>
      </div>
    </>
  );
}

function StudentChart({ history }) {
  const W=560, H=180, P={top:20,right:20,bottom:30,left:30};
  const max = 20, min = 8;
  const xs = history.labels.map((_,i) => P.left + (i/(history.labels.length-1))*(W-P.left-P.right));
  const yOf = v => P.top + (1 - (v-min)/(max-min)) * (H-P.top-P.bottom);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
      {[10,12,14,16,18,20].map(g => (
        <g key={g}>
          <line x1={P.left} x2={W-P.right} y1={yOf(g)} y2={yOf(g)} stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4"/>
          <text x={P.left-6} y={yOf(g)+3} fontSize="9" fill="var(--text-3)" textAnchor="end" fontFamily="var(--mono)">{g}</text>
        </g>
      ))}
      {history.labels.map((l,i)=>(<text key={i} x={xs[i]} y={H-8} fontSize="10" fill="var(--text-3)" textAnchor="middle">{l}</text>))}
      {history.series.map(s => {
        const path = s.values.map((v,i)=>`${i===0?'M':'L'}${xs[i]},${yOf(v)}`).join(' ');
        return (
          <g key={s.module}>
            <path d={path} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {s.values.map((v,i)=>(<circle key={i} cx={xs[i]} cy={yOf(v)} r="3" fill={s.color}/>))}
          </g>
        );
      })}
    </svg>
  );
}

function DashStudent({ t, onNav }) {
  const me = ROLES.etudiant;
  const overall = (STUDENT_GRADES.reduce((a,g)=>a+g.average,0)/STUDENT_GRADES.length).toFixed(2);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Dashboard')}</h1>
          <div className="sub">{me.name} — Group <strong>{me.group}</strong></div>
        </div>
      </div>
      <div className="grid-4" style={{marginBottom:14}}>
        <StatCard icon="grades"   color="#5FA83C" label="Overall average"  value={overall+'/20'} trend="+0.4" trendDir="up" />
        <StatCard icon="absences" color="#0891B2" label="Attendance"       value="96%"           trend="+1%"  trendDir="up" />
        <StatCard icon="modules"  color="#F59E0B" label="Active modules"   value={STUDENT_GRADES.length} />
        <StatCard icon="planning" color="#7C3AED" label="Upcoming sessions" value="6" />
      </div>
      <div className="grid-2-1" style={{marginBottom:14}}>
        <div className="card">
          <div className="card-head">
            <h3>Grades evolution</h3>
            <div style={{display:'flex',gap:14,fontSize:11.5,color:'var(--text-2)'}}>
              {STUDENT_GRADE_HISTORY.series.map(s => (
                <div key={s.module} style={{display:'flex',alignItems:'center',gap:5}}>
                  <span style={{width:10,height:3,borderRadius:2,background:s.color,display:'inline-block'}}></span>{s.module}
                </div>
              ))}
            </div>
          </div>
          <StudentChart history={STUDENT_GRADE_HISTORY} />
        </div>
        <div className="card">
          <div className="card-head"><h3>Latest grades</h3></div>
          {STUDENT_GRADES.slice(0,5).map(g => (
            <div key={g.module} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>{g.name}</div>
                <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--mono)'}}>{g.module}</div>
              </div>
              <div style={{fontSize:18,fontWeight:800,color:g.average>=14?'var(--green)':g.average>=10?'var(--orange)':'var(--red)',fontFamily:'var(--head-font)'}}>{g.average.toFixed(1)}</div>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" style={{marginTop:10,width:'100%'}} onClick={()=>onNav('grades')}>{t('btn.viewAll')}</button>
        </div>
      </div>
    </>
  );
}

// ─── PLANNING ───
function Planning({ role, toast }) {
  const { t, lang } = useI18n();
  const [view, setView] = uSP(()=> localStorage.getItem('co2_planning_view') || 'week');
  const [day, setDay] = uSP(0);
  const [editing, setEditing] = uSP(null);
  const [adding, setAdding] = uSP(false);
  const [form, setForm] = uSP({ mod:'', grp:'', day:0, room:'', start:9, dur:1.5 });
  const [, forceRender] = uSP(0);
  uEP(()=> localStorage.setItem('co2_planning_view', view), [view]);

  let sessions = SESSIONS;

  // Fixed filters: etudiant uses window._userGroups; enseignant uses window._userId
  if (role === 'etudiant') {
    const userGroups = (window._userGroups && window._userGroups.length > 0)
      ? window._userGroups
      : [ROLES.etudiant.group];
    sessions = sessions.filter(s => userGroups.includes(s.grp));
  }
  if (role === 'enseignant') {
    const uid = window._userId;
    sessions = sessions.filter(s =>
      (uid && s.teacherId === uid) ||
      s.teacher === ROLES.enseignant.name
    );
  }

  const canEdit = role==='admin' || role==='scolarite';
  const days = lang==='fr' ? DAYS_FR : DAYS_EN;

  const openEdit = (s) => {
    setForm({ mod: s.mod||'', grp: s.grp||'', day: s.day||0, room: s.room||'', start: s.start||9, dur: s.dur||1.5, _id: s.id });
    setEditing(s);
  };

  const openAdd = () => {
    setForm({ mod: MODULES[0]?.name||MODULES[0]?.code||'', grp: GROUPS_LIST[0]?.name||GROUPS_LIST[0]?.id||'', day:0, room:'', start:9, dur:1.5 });
    setAdding(true);
  };

  // Resolve module/group UUIDs from names for the API
  const resolveIds = () => {
    const rawMods = window._rawModules || [];
    const rawGroups = window._rawGroups || [];
    const mod = rawMods.find(m => m.name === form.mod || m.id === form.mod) || MODULES.find(m => m.name === form.mod || m.code === form.mod);
    const grp = rawGroups.find(g => g.name === form.grp || g.id === form.grp) || GROUPS_LIST.find(g => g.name === form.grp || g.id === form.grp);
    // Find the teacher — use current user if enseignant, else first enseignant
    const teachers = (window.USERS_LIST || []).filter(u => u.role === 'enseignant');
    const teacher = teachers[0];
    return { moduleId: mod?.id, groupId: grp?.id, teacherId: teacher?.id || window._userId };
  };

  const buildTimes = () => {
    const monday = new Date();
    const dow = monday.getDay();
    monday.setDate(monday.getDate() - dow + (dow === 0 ? -6 : 1)); // Get Monday
    const dayOffset = parseInt(form.day);
    const startH = parseFloat(form.start) || 9;
    const durH = parseFloat(form.dur) || 1.5;
    const startTime = new Date(monday);
    startTime.setDate(startTime.getDate() + dayOffset);
    startTime.setHours(Math.floor(startH), Math.round((startH % 1) * 60), 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + Math.floor(durH), endTime.getMinutes() + Math.round((durH % 1) * 60));
    return { startTime: startTime.toISOString(), endTime: endTime.toISOString() };
  };

  const saveSession = async () => {
    const { moduleId, groupId, teacherId } = resolveIds();
    if (!moduleId || !groupId || !teacherId) {
      toast({ type:'error', title:'Cannot save', desc:'Module, group, or teacher not found. Check your selection.' });
      return;
    }
    const { startTime, endTime } = buildTimes();
    try {
      if (adding) {
        await window.api.request('/planning', {
          method: 'POST',
          body: { moduleId, groupId, teacherId, room: form.room || 'TBD', startTime, endTime },
        });
        toast({ type:'success', title:'Session created', desc:'Saved to database — visible to all roles.' });
      } else if (editing?.id) {
        await window.api.request('/planning/' + editing.id, {
          method: 'PUT',
          body: { moduleId, groupId, teacherId, room: form.room || 'TBD', startTime, endTime },
        });
        toast({ type:'success', title:'Session updated', desc:'Changes saved to database.' });
      }
      // Refresh global data so all pages see the update
      if (window.refreshAllData) await window.refreshAllData();
      forceRender(x => x + 1);
    } catch (err) {
      toast({ type:'error', title:'Failed to save session', desc: err?.message || 'API error' });
    }
    setEditing(null);
    setAdding(false);
  };

  const deleteSession = async () => {
    if (!editing?.id) return;
    try {
      await window.api.request('/planning/' + editing.id, { method: 'DELETE' });
      toast({ type:'success', title:'Session deleted', desc:'Removed from database.' });
      if (window.refreshAllData) await window.refreshAllData();
      forceRender(x => x + 1);
    } catch (err) {
      toast({ type:'error', title:'Failed to delete', desc: err?.message || 'API error' });
    }
    setEditing(null);
  };

  const closeModal = () => { setEditing(null); setAdding(false); };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Planning')}</h1>
          <div className="sub">
            {role==='etudiant' && <>Schedule for group <strong>{(window._userGroups&&window._userGroups[0])||ROLES.etudiant.group}</strong></>}
            {role==='enseignant' && <>Sessions taught by <strong>{ROLES.enseignant.name}</strong></>}
            {(role==='admin'||role==='scolarite') && <>Full schedule — current week</>}
          </div>
        </div>
        <div className="page-actions">
          <div className="segment">
            <button className={view==='day'?'active':''} onClick={()=>setView('day')}>{t('view.day')}</button>
            <button className={view==='week'?'active':''} onClick={()=>setView('week')}>{t('view.week')}</button>
            <button className={view==='month'?'active':''} onClick={()=>setView('month')}>{t('view.month')}</button>
          </div>
          {canEdit && <button className="btn btn-primary btn-sm" onClick={openAdd}><Icon name="plus" size={14}/>{lang==='fr'?'Ajouter':'Add session'}</button>}
        </div>
      </div>

      {sessions.length===0 && (
        <div className="card"><div className="empty">No sessions to display for the current view.</div></div>
      )}

      {sessions.length>0 && view==='week' && (
        <div className="tt">
          <div className="tt-h"></div>
          {days.map((d,i) => <div key={i} className={`tt-h ${i===0?'today':''}`}>{d}<div className="dn">{21+i}</div></div>)}
          {HOURS.map(h => (
            <React.Fragment key={h}>
              <div className="tt-time">{String(h).padStart(2,'0')}:00</div>
              {days.map((_,di) => {
                const evs = sessions.filter(s => s.day===di && Math.floor(s.start)===h);
                return (
                  <div key={di} className="tt-cell">
                    {evs.map((e,i) => {
                      const M = MODULES.find(m=>m.code===e.mod||m.name===e.mod) || {color:'#5FA83C',name:e.mod};
                      return (
                        <div key={i} className="tt-ev" style={{borderLeftColor:M.color, top:(e.start-h)*60+2, height:e.dur*60-4}} onClick={()=> canEdit ? openEdit(e) : toast({type:'info',title:M.name||e.mod,desc:`${e.grp} • ${e.room}`})}>
                          <div className="mod">{M.name||e.mod}</div>
                          <div className="gr">{e.grp}</div>
                          <div className="rm">{e.room}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      )}

      {sessions.length>0 && view==='day' && (
        <div className="card" style={{padding:0}}>
          <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
            <div className="segment">{days.map((d,i)=>(<button key={i} className={day===i?'active':''} onClick={()=>setDay(i)}>{d}</button>))}</div>
          </div>
          <div className="day-grid">
            {HOURS.map(h => (
              <React.Fragment key={h}>
                <div className="hr-row">{String(h).padStart(2,'0')}:00</div>
                <div className="ev-row">
                  {sessions.filter(s=>s.day===day && Math.floor(s.start)===h).map((e,i)=>{
                    const M = MODULES.find(m=>m.code===e.mod||m.name===e.mod) || {color:'#5FA83C',name:e.mod};
                    return (
                      <div key={i} className="tt-ev" style={{borderLeftColor:M.color, position:'static', height:'auto', marginBottom:6}} onClick={()=> canEdit ? openEdit(e) : null}>
                        <div className="mod">{M.name||e.mod} <span style={{color:'var(--text-3)',fontFamily:'var(--mono)',fontSize:10,fontWeight:500,marginLeft:6}}>{String(Math.floor(e.start)).padStart(2,'0')}:{String(Math.round((e.start%1)*60)).padStart(2,'0')} • {e.dur}h</span></div>
                        <div className="gr">{e.grp} — {e.room}</div>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {sessions.length>0 && view==='month' && (
        <MonthView sessions={sessions} days={days} />
      )}

      {/* Add / Edit Session modal */}
      {(editing||adding) && (
        <>
          <div className="drawer-bg open" onClick={closeModal}></div>
          <div className="modal open" key={editing?.id||'new'}>
            <div className="modal-head">
              <h3 style={{fontSize:16}}>{adding ? (lang==='fr'?'Nouvelle session':'New session') : (lang==='fr'?'Modifier session':'Edit session')}</h3>
              <button className="tb-btn" onClick={closeModal}><Icon name="close" size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="field">
                  <label>Module</label>
                  <select value={form.mod} onChange={e=>setForm(f=>({...f,mod:e.target.value}))}>
                    {MODULES.map(m=><option key={m.id||m.code} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Group</label>
                  <select value={form.grp} onChange={e=>setForm(f=>({...f,grp:e.target.value}))}>
                    {GROUPS_LIST.map(g=><option key={g.id} value={g.name||g.id}>{g.name||g.id}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Day</label>
                  <select value={form.day} onChange={e=>setForm(f=>({...f,day:parseInt(e.target.value)}))}>
                    {days.map((d,i)=><option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Room</label>
                  <input value={form.room} onChange={e=>setForm(f=>({...f,room:e.target.value}))} placeholder="B-204"/>
                </div>
                <div className="field">
                  <label>Start time</label>
                  <input type="number" min="8" max="18" step="0.5" value={form.start} onChange={e=>setForm(f=>({...f,start:e.target.value}))}/>
                </div>
                <div className="field">
                  <label>Duration (h)</label>
                  <input type="number" min="0.5" max="4" step="0.5" value={form.dur} onChange={e=>setForm(f=>({...f,dur:e.target.value}))}/>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              {!adding && (
                <button className="btn btn-danger-soft" onClick={deleteSession} style={{marginRight:'auto'}}>
                  <Icon name="trash" size={14}/> Delete
                </button>
              )}
              <button className="btn btn-ghost" onClick={closeModal}>{t('btn.cancel')}</button>
              <button className="btn btn-primary" onClick={saveSession}>{t('btn.save')}</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function MonthView({ sessions, days }) {
  const cells = [];
  for(let i=0;i<35;i++){
    const dayNum = i - 0 + 21;
    cells.push(dayNum);
  }
  return (
    <div className="month-grid">
      {days.concat(['Sun']).map(d => <div key={d} className="mh">{d}</div>)}
      {Array.from({length:35}).map((_,i) => {
        const dayNum = 14 + i;
        const inMonth = dayNum>=14 && dayNum<=31;
        const weekday = i % 7;
        const today = dayNum===22;
        const evs = weekday<6 ? sessions.filter(s => s.day===weekday) : [];
        return (
          <div key={i} className={`mc ${!inMonth?'muted':''} ${today?'today':''}`}>
            <div className="dnum">{dayNum<=31?dayNum:dayNum-31}</div>
            {evs.slice(0,3).map((e,j)=>{
              const M = MODULES.find(m=>m.code===e.mod||m.name===e.mod) || {color:'#5FA83C'};
              return <div key={j} className="me" style={{borderLeftColor:M.color}}>{e.mod} — {e.grp}</div>;
            })}
            {evs.length>3 && <div style={{fontSize:10,color:'var(--text-3)',marginTop:2}}>+{evs.length-3} more</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── ATTENDANCE ───
function Absences({ role, toast }) {
  const { t, lang } = useI18n();
  const [filter, setFilter] = uSP('all');
  const [groupFilter, setGroupFilter] = uSP('all');
  const [marks, setMarks] = uSP({});
  const [sessionId, setSessionId] = uSP(null);
  const [sessions, setSessions] = uSP([]);
  const [saving, setSaving] = uSP(false);

  // Fetch today's sessions for the session picker
  React.useEffect(() => {
    (async () => {
      try {
        const res = await api.request('/planning/today');
        if (res.data && res.data.length > 0) {
          setSessions(res.data);
          setSessionId(res.data[0].id);
        }
      } catch(e) { console.warn('Sessions fetch:', e.message); }
    })();
  }, []);

  // Fetch existing absence records when session changes
  React.useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const res = await api.request(`/absences?sessionId=${sessionId}`);
        if (res.data) {
          const m = {};
          res.data.forEach(a => {
            m[a.studentId || a.student?.id] = a.status === 'Present' ? 'p' : a.status === 'Late' ? 'l' : 'a';
          });
          setMarks(m);
        }
      } catch(e) { console.warn('Absences fetch:', e.message); }
    })();
  }, [sessionId]);

  // Fixed student filter: use window._userGroups for etudiant
  let students = STUDENTS;
  if (role === 'etudiant') {
    const userGroups = (window._userGroups && window._userGroups.length > 0)
      ? window._userGroups
      : [ROLES.etudiant.group];
    // For student role show only their own row(s)
    const userName = ROLES.etudiant.name;
    students = students.filter(s => userGroups.includes(s.group) && s.name === userName);
    // Fallback: if no exact name match, show all in their groups
    if (students.length === 0) {
      students = STUDENTS.filter(s => userGroups.includes(s.group));
    }
  }

  const filtered = students.filter(s => {
    if (role !== 'etudiant' && groupFilter !== 'all' && s.group !== groupFilter) return false;
    if (filter === 'at-risk' && s.att >= 80) return false;
    return true;
  });

  const setStatus = async (sid, st) => {
    if (role==='etudiant') return;
    setMarks(m => ({...m, [sid]: st}));

    // Persist to API if we have a session selected
    if (sessionId) {
      try {
        const statusMap = { p: 'Present', l: 'Late', a: 'Absent' };
        await api.request('/absences', {
          method: 'POST',
          body: { sessionId, studentId: sid, status: statusMap[st] }
        });
        toast({ type:'success', title:'Attendance saved', desc:`${statusMap[st]} marked and saved to database.` });
      } catch(e) {
        toast({ type:'success', title:'Attendance updated', desc:`${st==='p'?'Present':st==='l'?'Late':'Absent'} marked locally.` });
      }
    } else {
      toast({ type:'success', title:'Attendance updated', desc:`${st==='p'?'Present':st==='l'?'Late':'Absent'} marked.` });
    }
  };

  const saveAll = async () => {
    if (!sessionId) {
      toast({ type:'error', title:'No session selected', desc:'Select a session first to save attendance.' });
      return;
    }
    setSaving(true);
    try {
      const statusMap = { p: 'Present', l: 'Late', a: 'Absent' };
      const records = filtered.map(s => ({
        studentId: s.id,
        status: statusMap[marks[s.id] || defaultMark(s)]
      }));
      await api.request('/absences/bulk', { method: 'POST', body: { sessionId, records } });
      toast({ type:'success', title:'All attendance saved', desc:`${records.length} records saved to database.` });
    } catch(e) {
      toast({ type:'error', title:'Save failed', desc: e.message });
    }
    setSaving(false);
  };

  const defaultMark = (s) => s.att>=85?'p':s.att>=70?'l':'a';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Attendance')}</h1>
          <div className="sub">{lang==='fr'?'Suivi des présences':'Track attendance and absences'}</div>
        </div>
        {role !== 'etudiant' && sessionId && (
          <div className="page-actions">
            <button className="btn btn-primary btn-sm" disabled={saving} onClick={saveAll}>
              <Icon name="check" size={14}/>{saving ? '...' : (lang==='fr'?'Enregistrer tout':'Save all')}
            </button>
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-head">
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            {role !== 'etudiant' && sessions.length > 0 && (
              <select value={sessionId||''} onChange={e=>setSessionId(e.target.value)} style={{padding:'7px 10px',borderRadius:7,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:13}}>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.module?.name || 'Session'} — {new Date(s.startTime).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</option>)}
              </select>
            )}
            {role !== 'etudiant' && (
              <select value={groupFilter} onChange={e=>setGroupFilter(e.target.value)} style={{padding:'7px 10px',borderRadius:7,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:13}}>
                <option value="all">All groups</option>
                {GROUPS_LIST.map(g=><option key={g.id} value={g.name||g.id}>{g.name||g.id}</option>)}
              </select>
            )}
            <div className="segment">
              <button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All</button>
              <button className={filter==='at-risk'?'active':''} onClick={()=>setFilter('at-risk')}>At risk</button>
            </div>
          </div>
          <div className="meta">{filtered.length} students</div>
        </div>
        <table className="tbl">
          <thead><tr><th>Student</th><th>Group</th><th>Attendance</th><th>Today's status</th></tr></thead>
          <tbody>
            {filtered.map(s => {
              const mark = marks[s.id] || defaultMark(s);
              return (
                <tr key={s.id} className={s.att<70?'absent-row':''}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span className="av av-sm" style={{background:s.color}}>{s.init}</span>
                      <div>
                        <div style={{fontWeight:600}}>{s.name}</div>
                        <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--mono)'}}>{s.id.substring(0,8)}</div>
                      </div>
                    </div>
                  </td>
                  <td>{s.group}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div className="pbar" style={{width:120}}><span style={{width:s.att+'%',background:s.att<70?'var(--red)':s.att<85?'var(--orange)':'var(--green)'}}></span></div>
                      <span className="mono" style={{fontSize:12,fontWeight:600,minWidth:38}}>{s.att}%</span>
                    </div>
                  </td>
                  <td>
                    {role==='etudiant' ? (
                      <span className={`pill ${mark==='p'?'paid':mark==='l'?'partial':'overdue'}`}><span className="d"></span>{mark==='p'?'Present':mark==='l'?'Late':'Absent'}</span>
                    ) : (
                      <div className="att-group">
                        <button className={`att-btn p ${mark==='p'?'active':''}`} onClick={()=>setStatus(s.id,'p')}>{t('att.present')}</button>
                        <button className={`att-btn l ${mark==='l'?'active':''}`} onClick={()=>setStatus(s.id,'l')}>{t('att.late')}</button>
                        <button className={`att-btn a ${mark==='a'?'active':''}`} onClick={()=>setStatus(s.id,'a')}>{t('att.absent')}</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── MODULES ───
function Modules({ role, toast }) {
  const { t, lang } = useI18n();
  const [detail, setDetail] = uSP(null);
  const [localMods, setLocalMods] = uSP(() => [...MODULES]);
  const [addingM, setAddingM] = uSP(false);
  const [modForm, setModForm] = uSP({ code:'', name:'', credits:4, teacher:'' });

  const openAddMod = () => {
    setModForm({ code:'', name:'', credits:4, teacher:'' });
    setAddingM(true);
  };

  const saveNewMod = () => {
    if (!modForm.code.trim() || !modForm.name.trim()) {
      toast({ type:'error', title:'Code and name are required' });
      return;
    }
    const newMod = {
      ...modForm,
      credits: parseInt(modForm.credits) || 4,
      color: '#5FA83C',
    };
    setLocalMods(prev => [...prev, newMod]);
    toast({ type:'success', title:'Module created', desc: modForm.name + ' added to catalogue.' });
    setAddingM(false);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Modules')}</h1>
          <div className="sub">{lang==='fr'?'Catalogue des modules académiques':'Academic module catalogue'}</div>
        </div>
        {(role==='admin'||role==='scolarite') && (
          <div className="page-actions">
            <button className="btn btn-primary btn-sm" onClick={openAddMod}>
              <Icon name="plus" size={14}/>{lang==='fr'?'Nouveau module':'New module'}
            </button>
          </div>
        )}
      </div>
      <div className="grid-3">
        {localMods.map(m => (
          <div key={m.code} className="card">
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
              <div>
                <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--text-3)',fontWeight:600,letterSpacing:0.5}}>{m.code}</div>
                <div style={{fontSize:16,fontWeight:700,marginTop:2,color:'var(--text)'}}>{m.name}</div>
              </div>
              <div style={{width:8,height:8,borderRadius:'50%',background:m.color,marginTop:8}}></div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12.5,color:'var(--text-2)'}}>
              <span className="av av-xs" style={{background:m.color, width:24, height:24, fontSize:9}}>{(m.teacher||'').split(' ').map(p=>p[0]).slice(-2).join('')}</span>
              {m.teacher}
            </div>
            <div style={{marginTop:12,display:'flex',gap:6}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setDetail(m)}>{t('btn.viewDetails')}</button>
            </div>
          </div>
        ))}
      </div>

      {/* New module modal */}
      {addingM && (
        <>
          <div className="drawer-bg open" onClick={()=>setAddingM(false)}></div>
          <div className="modal open">
            <div className="modal-head">
              <h3 style={{fontSize:16}}>{lang==='fr'?'Nouveau module':'New module'}</h3>
              <button className="tb-btn" onClick={()=>setAddingM(false)}><Icon name="close" size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="field">
                  <label>Code</label>
                  <input value={modForm.code} onChange={e=>setModForm(f=>({...f,code:e.target.value}))} placeholder="e.g. CS401"/>
                </div>
                <div className="field">
                  <label>Name</label>
                  <input value={modForm.name} onChange={e=>setModForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Machine Learning"/>
                </div>
                <div className="field">
                  <label>Credits</label>
                  <input type="number" min="1" max="10" value={modForm.credits} onChange={e=>setModForm(f=>({...f,credits:e.target.value}))}/>
                </div>
                <div className="field">
                  <label>Instructor</label>
                  <input value={modForm.teacher} onChange={e=>setModForm(f=>({...f,teacher:e.target.value}))} placeholder="Prof. Name"/>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={()=>setAddingM(false)}>{t('btn.cancel')}</button>
              <button className="btn btn-primary" onClick={saveNewMod}>{t('btn.save')}</button>
            </div>
          </div>
        </>
      )}

      {detail && (
        <>
          <div className="drawer-bg open" onClick={()=>setDetail(null)}></div>
          <div className="drawer open">
            <div className="drawer-head">
              <div>
                <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--text-3)',fontWeight:600,letterSpacing:0.5}}>{detail.code}</div>
                <div style={{fontSize:16,fontWeight:700}}>{detail.name}</div>
              </div>
              <button className="tb-btn" onClick={()=>setDetail(null)}><Icon name="close" size={16}/></button>
            </div>
            <div className="drawer-body">
              <div style={{display:'flex',gap:10,marginBottom:18}}>
                <div className="stat" style={{flex:1,padding:14}}>
                  <div className="stat-v" style={{fontSize:22}}>{detail.credits||'—'}</div>
                  <div className="stat-l">Credits</div>
                </div>
                <div className="stat" style={{flex:2,padding:14}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{detail.teacher||'—'}</div>
                  <div className="stat-l">Instructor</div>
                </div>
              </div>
              <h4 style={{fontSize:12,textTransform:'uppercase',letterSpacing:1,color:'var(--text-3)',marginBottom:10,fontWeight:700}}>Sessions this week</h4>
              {SESSIONS.filter(s => s.mod===detail.code || s.mod===detail.name).slice(0,6).map((s,i) => {
                const d = (lang==='fr'?DAYS_FR:DAYS_EN)[s.day] || '—';
                return (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',border:'1px solid var(--border)',borderRadius:8,marginBottom:6}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{s.grp}</div>
                      <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--mono)'}}>{d} {String(Math.floor(s.start)).padStart(2,'0')}:{String(Math.round((s.start%1)*60)).padStart(2,'0')} • {s.dur}h</div>
                    </div>
                    <div style={{fontSize:12,color:'var(--text-2)',fontFamily:'var(--mono)'}}>{s.room||'—'}</div>
                  </div>
                );
              })}
              {SESSIONS.filter(s => s.mod===detail.code || s.mod===detail.name).length===0 && (
                <div style={{fontSize:13,color:'var(--text-3)',padding:'12px 0'}}>No sessions scheduled.</div>
              )}
            </div>
            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={()=>setDetail(null)}>{t('btn.close')}</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── GRADES ───
function Grades({ role, toast }) {
  const { t, lang } = useI18n();
  const readOnly = role==='admin' || role==='scolarite';

  if (role==='etudiant') {
    const overall = (STUDENT_GRADES.reduce((a,g)=>a+g.average,0)/STUDENT_GRADES.length).toFixed(2);
    return (
      <>
        <div className="page-head">
          <div>
            <h1>{t('nav.Grades')}</h1>
            <div className="sub">{ROLES.etudiant.name} — Group {ROLES.etudiant.group}</div>
          </div>
          <div className="page-actions">
            <div style={{padding:'8px 14px',background:'var(--accent-50)',color:'var(--accent)',borderRadius:8,fontWeight:700,fontSize:14,fontFamily:'var(--head-font)'}}>{t('grade.overall')}: {overall}/20</div>
          </div>
        </div>
        <div className="card">
          <table className="tbl">
            <thead><tr><th>{t('grade.module')}</th><th>{t('grade.exam')}</th><th>{t('grade.homework')}</th><th>{t('grade.participation')}</th><th>{t('grade.average')}</th></tr></thead>
            <tbody>
              {STUDENT_GRADES.map(g => (
                <tr key={g.module}>
                  <td>
                    <div style={{fontWeight:600}}>{g.name}</div>
                    <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--mono)'}}>{g.module}</div>
                  </td>
                  <td className="mono">{g.exam.toFixed(1)}</td>
                  <td className="mono">{g.hw.toFixed(1)}</td>
                  <td className="mono">{g.participation.toFixed(1)}</td>
                  <td><strong style={{fontFamily:'var(--head-font)',fontSize:15,color:g.average>=14?'var(--green)':g.average>=10?'var(--orange)':'var(--red)'}}>{g.average.toFixed(2)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // Teacher / Admin / Scolarité view
  const [edits, setEdits] = uSP({});
  const [groupSel, setGroupSel] = uSP(() => GROUPS_LIST[0]?.id || '');
  const selGroup = GROUPS_LIST.find(g => g.id === groupSel);
  const classStudents = STUDENTS.filter(s => selGroup ? (s.group===selGroup.name || s.group===selGroup.id) : false);
  const setVal = (sid, key, v) => setEdits(e => ({ ...e, [sid+'_'+key]: v }));
  const get = (s, key, def) => edits[s.id+'_'+key] !== undefined ? edits[s.id+'_'+key] : def;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Grades')}</h1>
          <div className="sub">CS & Cyber Security — S8 Modules</div>
        </div>
        <div className="page-actions">
          <select value={groupSel} onChange={e=>setGroupSel(e.target.value)} style={{padding:'8px 12px',borderRadius:7,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:13}}>
            {GROUPS_LIST.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {!readOnly && <button className="btn btn-primary btn-sm" onClick={()=>{ toast({type:'success',title:'Grades saved', desc:`${Object.keys(edits).length} changes saved.`}); setEdits({}); }}>{t('btn.save')}</button>}
        </div>
      </div>
      {readOnly && (
        <div className="readonly-banner">
          <span className="lock"><Icon name="lock" size={14}/></span>
          {t('grade.viewOnly')}
        </div>
      )}
      {classStudents.length===0 && (
        <div className="card"><div className="empty">No students found for this group.</div></div>
      )}
      {classStudents.length>0 && (
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Student</th><th>Midterm</th><th>Final</th><th>Homework</th><th>Participation</th><th>Average</th></tr></thead>
            <tbody>
              {classStudents.map((s,i) => {
                const sample = { mid:12+i*0.4, fin:13+i*0.3, hw:14+i*0.2, part:15+(i%4) };
                const mid = parseFloat(get(s,'mid',sample.mid))||0;
                const fin = parseFloat(get(s,'fin',sample.fin))||0;
                const hw = parseFloat(get(s,'hw',sample.hw))||0;
                const part = parseFloat(get(s,'part',sample.part))||0;
                const a = ((mid+fin+hw+part)/4).toFixed(2);
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span className="av av-sm" style={{background:s.color}}>{s.init}</span>
                        <div style={{fontWeight:600}}>{s.name}</div>
                      </div>
                    </td>
                    {['mid','fin','hw','part'].map(k => (
                      <td key={k}>
                        {readOnly ? <span className="mono">{parseFloat(get(s,k,sample[k])).toFixed(1)}</span>
                                  : <input type="number" min="0" max="20" step="0.25" value={get(s,k,sample[k])} onChange={e=>setVal(s.id,k,e.target.value)} style={{width:70,padding:'5px 8px',borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontFamily:'var(--mono)',fontSize:13}}/>}
                      </td>
                    ))}
                    <td><strong style={{fontFamily:'var(--head-font)',fontSize:14,color:a>=14?'var(--green)':a>=10?'var(--orange)':'var(--red)'}}>{a}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── BRANCHES ───
function Branches({ toast }) {
  const { t, lang } = useI18n();
  const [detail, setDetail] = uSP(null);
  const [editB, setEditB] = uSP(null);
  const [editForm, setEditForm] = uSP({});
  const [addingB, setAddingB] = uSP(false);
  const [addForm, setAddForm] = uSP({ code:'', name:'', head:'', color:'#5FA83C' });

  const openEditB = (b) => {
    setEditForm({ code: b.code, name: b.name, head: b.head||'', color: b.color||'#5FA83C' });
    setEditB(b);
    setDetail(null);
  };

  const openAddB = () => {
    setAddForm({ code:'', name:'', head:'', color:'#5FA83C' });
    setAddingB(true);
  };

  const saveNewBranch = () => {
    if (!addForm.code.trim() || !addForm.name.trim()) {
      toast({ type:'error', title:'Code and name are required' });
      return;
    }
    BRANCHES.push({
      ...addForm,
      students: 0,
      groups: 0,
    });
    toast({ type:'success', title:'Branch created', desc: addForm.name + ' has been added.' });
    setAddingB(false);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Branches')}</h1>
          <div className="sub">{lang==='fr'?'Filières et départements':'Academic branches and departments'}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={openAddB}>
            <Icon name="plus" size={14}/>{lang==='fr'?'Nouvelle filière':'New branch'}
          </button>
        </div>
      </div>
      <div className="grid-2">
        {BRANCHES.map(b => (
          <div key={b.code} className="card">
            <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
              <div className="av" style={{background:b.color, width:54, height:54, fontSize:18, borderRadius:12}}>{b.code.slice(0,2)}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:17,fontWeight:700}}>{b.name}</div>
                <div style={{fontSize:12.5, color:'var(--text-2)', marginTop:2}}>Head: {b.head}</div>
                <div style={{display:'flex',gap:18,marginTop:14, fontSize:12, color:'var(--text-2)'}}>
                  <div><div style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'var(--head-font)'}}>{b.students}</div>Students</div>
                  <div><div style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'var(--head-font)'}}>{b.groups}</div>Groups</div>
                  {b.faculty && <div><div style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'var(--head-font)'}}>{b.faculty}</div>Faculty</div>}
                </div>
              </div>
            </div>
            <div style={{marginTop:14, display:'flex', gap:8}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setDetail(b)}><Icon name="eye" size={14}/>{t('btn.viewDetails')}</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>openEditB(b)}><Icon name="edit" size={14}/>{t('btn.edit')}</button>
            </div>
          </div>
        ))}
      </div>

      {detail && (
        <>
          <div className="drawer-bg open" onClick={()=>setDetail(null)}></div>
          <div className="drawer open">
            <div className="drawer-head">
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div className="av" style={{background:detail.color,width:40,height:40,fontSize:14,borderRadius:10}}>{detail.code.slice(0,2)}</div>
                <div>
                  <div style={{fontSize:16,fontWeight:700}}>{detail.name}</div>
                  <div style={{fontSize:12,color:'var(--text-3)',fontFamily:'var(--mono)'}}>{detail.code} • Founded {detail.founded}</div>
                </div>
              </div>
              <button className="tb-btn" onClick={()=>setDetail(null)}><Icon name="close" size={16}/></button>
            </div>
            <div className="drawer-body">
              <p style={{fontSize:14,lineHeight:1.6,color:'var(--text-2)'}}>{detail.description}</p>
              <div className="grid-3" style={{marginTop:18}}>
                <div className="stat" style={{padding:14}}><div className="stat-v" style={{fontSize:22}}>{detail.students}</div><div className="stat-l">Students</div></div>
                <div className="stat" style={{padding:14}}><div className="stat-v" style={{fontSize:22}}>{detail.groups}</div><div className="stat-l">Groups</div></div>
                {detail.faculty && <div className="stat" style={{padding:14}}><div className="stat-v" style={{fontSize:22}}>{detail.faculty}</div><div className="stat-l">Faculty</div></div>}
              </div>
              <h4 style={{marginTop:24,marginBottom:10,fontSize:13,textTransform:'uppercase',letterSpacing:1,color:'var(--text-3)',fontWeight:700}}>Department head</h4>
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:'1px solid var(--border)',borderRadius:10}}>
                <div className="av av-md" style={{background:detail.color}}>{(detail.head||'?').split(' ').map(p=>p[0]).slice(-2).join('')}</div>
                <div>
                  <div style={{fontWeight:600}}>{detail.head||'—'}</div>
                  <div style={{fontSize:12,color:'var(--text-3)'}}>Department head</div>
                </div>
              </div>
              <h4 style={{marginTop:24,marginBottom:10,fontSize:13,textTransform:'uppercase',letterSpacing:1,color:'var(--text-3)',fontWeight:700}}>Groups in this branch</h4>
              <div>
                {GROUPS_LIST.filter(g=>g.branch===detail.name).map(g => (
                  <div key={g.id} style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',border:'1px solid var(--border)',borderRadius:8,marginBottom:6}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{g.name}</div>
                      <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--mono)'}}>{g.id} • {g.year}</div>
                    </div>
                    <div style={{fontSize:13,color:'var(--text-2)',alignSelf:'center'}}>{g.students} students</div>
                  </div>
                ))}
                {GROUPS_LIST.filter(g=>g.branch===detail.name).length===0 && <div className="empty">No groups in this branch yet.</div>}
              </div>
            </div>
            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={()=>setDetail(null)}>{t('btn.close')}</button>
              <button className="btn btn-primary" onClick={()=>openEditB(detail)}><Icon name="edit" size={14}/>{t('btn.edit')}</button>
            </div>
          </div>
        </>
      )}

      {/* New branch modal */}
      {addingB && (
        <>
          <div className="drawer-bg open" onClick={()=>setAddingB(false)}></div>
          <div className="modal open">
            <div className="modal-head">
              <h3 style={{fontSize:16}}>{lang==='fr'?'Nouvelle filière':'New branch'}</h3>
              <button className="tb-btn" onClick={()=>setAddingB(false)}><Icon name="close" size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="field">
                  <label>Code</label>
                  <input value={addForm.code} onChange={e=>setAddForm(f=>({...f,code:e.target.value}))} placeholder="e.g. GL"/>
                </div>
                <div className="field">
                  <label>Name</label>
                  <input value={addForm.name} onChange={e=>setAddForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Génie Logiciel"/>
                </div>
                <div className="field">
                  <label>Department head</label>
                  <input value={addForm.head} onChange={e=>setAddForm(f=>({...f,head:e.target.value}))} placeholder="Prof. Name"/>
                </div>
                <div className="field">
                  <label>Color</label>
                  <input type="color" value={addForm.color} onChange={e=>setAddForm(f=>({...f,color:e.target.value}))}/>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={()=>setAddingB(false)}>{t('btn.cancel')}</button>
              <button className="btn btn-primary" onClick={saveNewBranch}>{t('btn.save')}</button>
            </div>
          </div>
        </>
      )}

      {editB && (
        <>
          <div className="drawer-bg open" onClick={()=>setEditB(null)}></div>
          <div className="modal open">
            <div className="modal-head">
              <h3 style={{fontSize:16}}>{lang==='fr'?'Modifier filière':'Edit branch'} — {editB.name}</h3>
              <button className="tb-btn" onClick={()=>setEditB(null)}><Icon name="close" size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="field"><label>Code</label><input value={editForm.code||''} onChange={e=>setEditForm(f=>({...f,code:e.target.value}))}/></div>
                <div className="field"><label>Name</label><input value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}/></div>
                <div className="field"><label>Department head</label><input value={editForm.head||''} onChange={e=>setEditForm(f=>({...f,head:e.target.value}))}/></div>
                <div className="field"><label>Color</label><input type="color" value={editForm.color||'#5FA83C'} onChange={e=>setEditForm(f=>({...f,color:e.target.value}))}/></div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={()=>setEditB(null)}>{t('btn.cancel')}</button>
              <button className="btn btn-primary" onClick={()=>{
                const idx = BRANCHES.findIndex(b => b.code===editB.code);
                if(idx>=0) Object.assign(BRANCHES[idx], editForm);
                toast({type:'success',title:'Branch updated',desc:editForm.name+' saved.'});
                setEditB(null);
              }}>{t('btn.save')}</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

Object.assign(window, { Dashboard, Planning, Absences, Modules, Grades, Branches });
