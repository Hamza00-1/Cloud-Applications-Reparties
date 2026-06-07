// CampusOps — Pages part 2: Payments, Users, Groups, Notifications, Progress, Settings
const { useState: uSP2, useMemo: uMP2, useEffect: uEP2 } = React;

// ─── ACTION NAV MAP ───
const ACTION_NAV = {
  'View student': 'users',
  'Contact': 'users',
  'Open grades': 'grades',
  'View invoice': 'payments',
  'Review payments': 'payments',
};

// ─── ROLE-BASED NOTIFICATIONS GENERATOR ───
function generateRoleNotifications(role) {
  const now = new Date();
  const fmt = (d) => d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  const today = fmt(now);

  if (role === 'admin') {
    const overdue = (PAYMENTS || []).filter(p => p.status === 'overdue');
    const atRisk  = (STUDENTS || []).filter(s => s.att < 70);
    const items = [];
    overdue.slice(0,3).forEach((p,i) => {
      items.push({
        id: 'adm-pay-' + i, type: 'alert', read: false,
        title: `Overdue payment: ${p.student}`,
        desc: `Invoice ${p.id} — ${p.amount?.toLocaleString?.() || p.amount} MAD is overdue since ${p.date}.`,
        time: today,
        actions: ['View invoice', 'Contact'],
      });
    });
    atRisk.slice(0,3).forEach((s,i) => {
      items.push({
        id: 'adm-att-' + i, type: 'alert', read: false,
        title: `At-risk attendance: ${s.name}`,
        desc: `Attendance is ${s.att}% — below the 70% threshold. Immediate review recommended.`,
        time: today,
        actions: ['View student'],
      });
    });
    items.push({
      id: 'adm-grd-1', type: 'reminder', read: false,
      title: 'Grade submission deadline approaching',
      desc: 'Semester grade submissions close in 3 days. Please ensure all teachers have submitted.',
      time: today,
      actions: ['Open grades'],
    });
    items.push({
      id: 'adm-pay-ok', type: 'success', read: true,
      title: 'Payment batch processed',
      desc: '2 inscription payments confirmed. Collection rate is 50%.',
      time: today,
      actions: ['Review payments'],
    });
    items.push({
      id: 'adm-sch-1', type: 'info', read: true,
      title: 'Schedule published for S8',
      desc: 'The planning for S8 2025/2026 has been finalized and is visible to CS-G1.',
      time: today,
    });
    return items;
  }

  if (role === 'scolarite') {
    const overdue = (PAYMENTS || []).filter(p => p.status === 'overdue');
    const atRisk  = (STUDENTS || []).filter(s => s.att < 70);
    const items = [];
    overdue.slice(0,3).forEach((p,i) => {
      items.push({
        id: 'sco-pay-' + i, type: 'alert', read: false,
        title: `Overdue payment: ${p.student}`,
        desc: `Invoice ${p.id} — ${p.amount?.toLocaleString?.() || p.amount} MAD overdue since ${p.date}.`,
        time: today,
        actions: ['View invoice', 'Contact'],
      });
    });
    atRisk.slice(0,3).forEach((s,i) => {
      items.push({
        id: 'sco-att-' + i, type: 'alert', read: false,
        title: `At-risk attendance: ${s.name}`,
        desc: `${s.name} has ${s.att}% attendance in group ${s.group}. Official warning may be required.`,
        time: today,
        actions: ['View student'],
      });
    });
    items.push({
      id: 'sco-pay-ok', type: 'success', read: true,
      title: 'Payment received',
      desc: 'A new tuition payment has been confirmed. Updated records are available.',
      time: today,
      actions: ['Review payments'],
    });
    items.push({
      id: 'sco-enr-1', type: 'info', read: true,
      title: 'Student enrollment',
      desc: '2 students are enrolled in CS-G1 for 2025/2026.',
      time: today,
    });
    return items;
  }

  if (role === 'enseignant') {
    const uid = window._userId;
    const myGroups = ['CS-G1'];
    const atRisk = (STUDENTS || []).filter(s => myGroups.includes(s.group) && s.att < 75);
    const items = [];
    items.push({
      id: 'ens-grd-1', type: 'reminder', read: false,
      title: 'Grade submission deadline — S8 Modules',
      desc: 'Please submit grades for CS-G1 S8 modules. Deadline: Friday 23:59.',
      time: today,
      actions: ['Open grades'],
    });
    items.push({
      id: 'ens-grd-2', type: 'reminder', read: false,
      title: 'Homework pending review',
      desc: 'Homework submissions are awaiting your review for CS-G1.',
      time: today,
      actions: ['Open grades'],
    });
    atRisk.slice(0,3).forEach((s,i) => {
      items.push({
        id: 'ens-att-' + i, type: 'alert', read: false,
        title: `Attendance alert: ${s.name}`,
        desc: `${s.name} (${s.group}) has ${s.att}% attendance — below the 75% threshold.`,
        time: today,
        actions: ['View student'],
      });
    });
    items.push({
      id: 'ens-sch-1', type: 'info', read: true,
      title: 'Schedule update',
      desc: 'Your sessions for CS-G1 are confirmed for this week. Check the Planning tab.',
      time: today,
    });
    return items;
  }

  if (role === 'etudiant') {
    const me = ROLES.etudiant;
    const myPayment = (PAYMENTS || []).find(p =>
      p.student === me.name || (window._userId && p.studentId === window._userId)
    );
    const items = [];
    if (myPayment && (myPayment.status === 'overdue' || myPayment.status === 'pending')) {
      items.push({
        id: 'etu-pay-1', type: 'alert', read: false,
        title: 'Payment due',
        desc: `Your tuition invoice (${myPayment.id}) of ${myPayment.amount?.toLocaleString?.() || myPayment.amount} MAD is ${myPayment.status}. Please settle at the finance office.`,
        time: myPayment.date || today,
        actions: ['View invoice'],
      });
    }
    items.push({
      id: 'etu-grd-1', type: 'success', read: false,
      title: 'New grades posted',
      desc: 'Your S8 module grades have been published. Check the Grades tab.',
      time: today,
      actions: ['Open grades'],
    });
    items.push({
      id: 'etu-sch-1', type: 'info', read: true,
      title: 'Schedule update',
      desc: 'Your Wednesday session has been moved to room A-101. Check the Planning tab for details.',
      time: today,
    });
    items.push({
      id: 'etu-att-1', type: 'reminder', read: true,
      title: 'Attendance reminder',
      desc: 'You have 2 absences this month. Keep your attendance above 80% to stay in good standing.',
      time: today,
    });
    return items;
  }

  // Fallback
  return NOTIFICATIONS || [];
}

// ─── PAYMENTS ───
function Payments({ role, toast }){
  const { t, lang } = useI18n();
  const [filter, setFilter] = uSP2('all');
  const [receipt, setReceipt] = uSP2(null);
  const [adding, setAdding] = uSP2(false);
  const [editing, setEditing] = uSP2(null);
  const [, force] = uSP2(0);
  const me = ROLES.etudiant;
  const canEdit = role === 'admin' || role === 'scolarite';

  // Add form
  const [addForm, setAddForm] = uSP2({ studentId:'', planType:'Inscription', amount:45000, status:'Unpaid', dueDate:'' });
  // Edit form
  const [editForm, setEditForm] = uSP2({ status:'', amount:0 });

  // For student: show only their payments
  let rows = PAYMENTS;
  if (role === 'etudiant') {
    const uid = window._userId;
    const filtered = rows.filter(p =>
      (uid && (p.studentId === uid || p.userId === uid)) ||
      p.student === me.name
    );
    rows = filtered.length > 0 ? filtered : rows.filter(p => p.student === me.name);
  }
  if (filter !== 'all') rows = rows.filter(p => p.status === filter);

  const totals = {
    paid: PAYMENTS.filter(p=>p.status==='paid').reduce((a,p)=>a+p.amount,0),
    pending: PAYMENTS.filter(p=>p.status==='pending'||p.status==='partial'||p.status==='unpaid').reduce((a,p)=>a+p.amount,0),
    overdue: PAYMENTS.filter(p=>p.status==='overdue').reduce((a,p)=>a+p.amount,0),
  };
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : n) + ' MAD';

  // Get students for the dropdown
  const studentList = (window.STUDENTS || STUDENTS || []);

  const openAdd = () => {
    const today = new Date();
    const nextMonth = new Date(today); nextMonth.setMonth(nextMonth.getMonth() + 1);
    const dueDateStr = nextMonth.toISOString().split('T')[0];
    setAddForm({ studentId: studentList[0]?.id || '', planType:'Inscription', amount:45000, status:'Unpaid', dueDate: dueDateStr });
    setAdding(true);
  };

  const saveAdd = async () => {
    if (!addForm.studentId) { toast({ type:'error', title:'Select a student' }); return; }
    if (!addForm.dueDate) { toast({ type:'error', title:'Set a due date' }); return; }
    try {
      await window.api.request('/payments', {
        method: 'POST',
        body: {
          studentId: addForm.studentId,
          planType: addForm.planType,
          amount: parseFloat(addForm.amount) || 0,
          status: addForm.status,
          dueDate: addForm.dueDate,
        },
      });
      toast({ type:'success', title:'Payment created', desc:'Invoice added to database.' });
      setAdding(false);
      if (window.refreshAllData) await window.refreshAllData();
      force(x => x + 1);
    } catch (err) {
      toast({ type:'error', title:'Failed to create payment', desc: err?.message || 'API error' });
    }
  };

  const openEdit = (p) => {
    setEditForm({ status: (p.status||'').charAt(0).toUpperCase() + (p.status||'').slice(1), amount: p.amount });
    setEditing(p);
  };

  const saveEdit = async () => {
    if (!editing?.id) return;
    try {
      await window.api.request('/payments/' + editing.id, {
        method: 'PUT',
        body: { status: editForm.status, amount: parseFloat(editForm.amount) || 0 },
      });
      toast({ type:'success', title:'Payment updated', desc:'Changes saved.' });
      setEditing(null);
      if (window.refreshAllData) await window.refreshAllData();
      force(x => x + 1);
    } catch (err) {
      toast({ type:'error', title:'Failed to update', desc: err?.message || 'API error' });
    }
  };

  const deletePayment = async (p) => {
    if (!confirm('Delete payment ' + (p.id?.substring(0,8)||'') + ' for ' + p.student + '?')) return;
    try {
      await window.api.request('/payments/' + p.id, { method: 'DELETE' });
      toast({ type:'success', title:'Payment deleted', desc:'Invoice removed.' });
      if (window.refreshAllData) await window.refreshAllData();
      force(x => x + 1);
    } catch (err) {
      toast({ type:'error', title:'Failed to delete', desc: err?.message || 'API error' });
    }
  };

  const openReceipt = (p) => setReceipt(p);
  const closeReceipt = () => setReceipt(null);
  const sendToStudent = async (p) => {
    try {
      const res = await window.api.request('/payments/' + p.id + '/send-receipt', { method: 'POST' });
      const data = res?.data || {};
      toast({ type:'success', title:'Receipt sent!', desc: data.to ? `Email sent to ${data.to}` : 'Receipt processed.' });
    } catch (err) {
      toast({ type:'error', title:'Failed to send', desc: err?.message || 'Could not send receipt email.' });
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Payments')}</h1>
          <div className="sub">{lang==='fr'?'Suivi des frais et paiements':'Tuition fees and payments'}</div>
        </div>
        {canEdit && (
          <div className="page-actions">
            <button className="btn btn-primary btn-sm" onClick={openAdd}><Icon name="plus" size={14}/>{lang==='fr'?'Ajouter':'Add payment'}</button>
          </div>
        )}
      </div>
      {role!=='etudiant' && (
        <div className="grid-3" style={{marginBottom:14}}>
          <div className="stat"><div className="stat-l">Collected</div><div className="stat-v" style={{color:'var(--green)'}}>{fmt(totals.paid)}</div></div>
          <div className="stat"><div className="stat-l">Pending</div><div className="stat-v" style={{color:'var(--orange)'}}>{fmt(totals.pending)}</div></div>
          <div className="stat"><div className="stat-l">Overdue</div><div className="stat-v" style={{color:'var(--red)'}}>{fmt(totals.overdue)}</div></div>
        </div>
      )}
      <div className="card">
        <div className="card-head">
          <div className="segment">
            <button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All</button>
            <button className={filter==='paid'?'active':''} onClick={()=>setFilter('paid')}>{t('pay.paid')}</button>
            <button className={filter==='unpaid'?'active':''} onClick={()=>setFilter('unpaid')}>Unpaid</button>
          </div>
          <div className="meta">{rows.length} invoices</div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Student</th><th>Type</th>
              <th>Amount</th><th>Status</th><th>Due</th>{canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id}>
                <td><strong>{p.student}</strong></td>
                <td>{p.type}</td>
                <td className="mono" style={{fontWeight:600}}>{fmt(p.amount)}</td>
                <td><span className={`pill ${p.status}`}><span className="d"></span>{p.status}</span></td>
                <td style={{color:'var(--text-2)',fontSize:12.5}}>{p.date}</td>
                {canEdit && (
                  <td style={{textAlign:'right',whiteSpace:'nowrap'}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>openReceipt(p)}>Receipt</button>
                    <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(p)}><Icon name="edit" size={14}/></button>
                    <button className="btn btn-ghost btn-sm" style={{color:'var(--red)'}} onClick={()=>deletePayment(p)}><Icon name="trash" size={14}/></button>
                  </td>
                )}
                {!canEdit && (
                  <td style={{textAlign:'right'}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>openReceipt(p)}>Receipt</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Payment modal */}
      {adding && (
        <>
          <div className="drawer-bg open" onClick={()=>setAdding(false)}></div>
          <div className="modal open">
            <div className="modal-head">
              <h3 style={{fontSize:16}}>{lang==='fr'?'Nouveau paiement':'New payment'}</h3>
              <button className="tb-btn" onClick={()=>setAdding(false)}><Icon name="close" size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="field" style={{gridColumn:'1/-1'}}>
                  <label>Student</label>
                  <select value={addForm.studentId} onChange={e=>setAddForm(f=>({...f,studentId:e.target.value}))}>
                    <option value="">— Select —</option>
                    {studentList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Type</label>
                  <select value={addForm.planType} onChange={e=>setAddForm(f=>({...f,planType:e.target.value}))}>
                    <option value="Inscription">Inscription</option>
                    <option value="Mensualite">Mensualité</option>
                  </select>
                </div>
                <div className="field">
                  <label>Amount (MAD)</label>
                  <input type="number" min="0" value={addForm.amount} onChange={e=>setAddForm(f=>({...f,amount:e.target.value}))}/>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select value={addForm.status} onChange={e=>setAddForm(f=>({...f,status:e.target.value}))}>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
                <div className="field">
                  <label>Due date</label>
                  <input type="date" value={addForm.dueDate} onChange={e=>setAddForm(f=>({...f,dueDate:e.target.value}))}/>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={()=>setAdding(false)}>{t('btn.cancel')}</button>
              <button className="btn btn-primary" onClick={saveAdd}>{t('btn.save')}</button>
            </div>
          </div>
        </>
      )}

      {/* Edit Payment modal */}
      {editing && (
        <>
          <div className="drawer-bg open" onClick={()=>setEditing(null)}></div>
          <div className="modal open">
            <div className="modal-head">
              <h3 style={{fontSize:16}}>Edit payment — {editing.student}</h3>
              <button className="tb-btn" onClick={()=>setEditing(null)}><Icon name="close" size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="field">
                  <label>Status</label>
                  <select value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))}>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
                <div className="field">
                  <label>Amount (MAD)</label>
                  <input type="number" min="0" value={editForm.amount} onChange={e=>setEditForm(f=>({...f,amount:e.target.value}))}/>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-danger-soft" style={{marginRight:'auto'}} onClick={()=>{ deletePayment(editing); setEditing(null); }}><Icon name="trash" size={14}/> Delete</button>
              <button className="btn btn-ghost" onClick={()=>setEditing(null)}>{t('btn.cancel')}</button>
              <button className="btn btn-primary" onClick={saveEdit}>{t('btn.save')}</button>
            </div>
          </div>
        </>
      )}

      {/* Receipt / Invoice modal */}
      {receipt && (
        <>
          <div className="drawer-bg open" onClick={closeReceipt}></div>
          <div className="modal open">
            <div className="modal-head">
              <h3 style={{fontSize:16}}>Invoice / Receipt</h3>
              <button className="tb-btn" onClick={closeReceipt}><Icon name="close" size={16}/></button>
            </div>
            <div className="modal-body">
              <div style={{border:'1px solid var(--border)',borderRadius:10,padding:'20px 24px',background:'var(--bg)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
                  <div>
                    <div style={{fontSize:20,fontWeight:800,fontFamily:'var(--head-font)',color:'var(--accent)'}}>CampusOps</div>
                    <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>Official Payment Receipt</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:12,fontFamily:'var(--mono)',fontWeight:700,color:'var(--text)'}}>{(receipt.id||'').substring(0,8)}</div>
                    <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{receipt.date}</div>
                  </div>
                </div>
                <div style={{height:1,background:'var(--border)',marginBottom:16}}></div>
                <div className="grid-2" style={{gap:'10px 24px',fontSize:13}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'var(--text-3)',marginBottom:3}}>Student</div>
                    <div style={{fontWeight:600}}>{receipt.student}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'var(--text-3)',marginBottom:3}}>Type</div>
                    <div>{receipt.type}</div>
                  </div>
                </div>
                <div style={{height:1,background:'var(--border)',margin:'16px 0'}}></div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontSize:13,color:'var(--text-2)'}}>Amount</div>
                  <div style={{fontSize:22,fontWeight:800,fontFamily:'var(--head-font)',color:'var(--text)'}}>{fmt(receipt.amount)}</div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                  <div style={{fontSize:13,color:'var(--text-2)'}}>Status</div>
                  <span className={`pill ${receipt.status}`}><span className="d"></span>{receipt.status}</span>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={()=>window.print()}>Print</button>
              {canEdit && (
                <button className="btn btn-ghost" onClick={()=>{ sendToStudent(receipt); closeReceipt(); }}>Send to student</button>
              )}
              <button className="btn btn-primary" onClick={closeReceipt}>{lang==='fr'?'Fermer':'Close'}</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── USERS ───
function Users({ toast }){
  const { t, lang } = useI18n();
  const [q, setQ] = uSP2('');
  const [roleFilter, setRoleFilter] = uSP2('all');
  const [, force] = uSP2(0);
  const [inviting, setInviting] = uSP2(false);
  const [inviteForm, setInviteForm] = uSP2({ name:'', email:'', role:'etudiant', branch: BRANCHES[0]?.name || '—', group: '', status:'active' });
  const [editingU, setEditingU] = uSP2(null);
  const [editForm, setEditForm] = uSP2({});

  const filtered = USERS_LIST.filter(u => {
    if(roleFilter!=='all' && u.role!==roleFilter) return false;
    if(q && !(u.name+' '+u.email+' '+u.branch).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const openInvite = () => {
    setInviteForm({ name:'', email:'', role:'etudiant', branch: BRANCHES[0]?.name || '—', group: window.GROUPS_LIST?.[0]?.id || '', status:'active' });
    setInviting(true);
  };

  const refreshUsersList = async () => {
    try {
      const res = await window.api.request('/users?limit=200');
      if (res && res.data) {
        const replace = (arr, items) => { if (Array.isArray(arr)) arr.splice(0, arr.length, ...items); };
        replace(window.USERS_LIST, res.data.map(x => ({
          id: x.id, name: x.name, role: (x.role || '').toLowerCase(),
          email: x.email, branch: x.branch?.name || '—', status: 'active',
          init: x.name?.substring(0,2).toUpperCase() || '??', color: '#5FA83C',
        })));
        const studs = res.data.filter(x => x.role === 'Etudiant');
        // Always replace — empty list is meaningful info
        replace(window.STUDENTS, studs.map(s => ({
          id: s.id, name: s.name, group: s.studentGroups?.[0]?.group?.name || '—',
          avg: 14, att: 90, status: 'active',
          init: s.name?.substring(0,2).toUpperCase() || '??', color: '#7CB342',
        })));
        force(x => x + 1);
      }
    } catch (err) {
      console.error("Failed to refresh users list", err);
    }
  };

  const saveInvite = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      toast({ type:'error', title:'Name and email are required' }); return;
    }
    if (!/\S+@\S+\.\S+/.test(inviteForm.email)) {
      toast({ type:'error', title:'Invalid email address' }); return;
    }
    
    // Resolve branch UUID — fetch from API since local BRANCHES may lack UUID ids
    let branchId = null;
    try {
      const brRes = await window.api.request('/branches');
      const apiBranches = brRes.data || [];
      const match = apiBranches.find(b => b.name === inviteForm.branch) || apiBranches[0];
      branchId = match?.id;
    } catch (e) {
      console.error('Failed to fetch branches', e);
    }
    if (!branchId) {
      toast({ type:'error', title:'No branch available — check backend connection' }); return;
    }
    
    // Create mapping for roles to match backend enum
    const roleMap = {
      'admin': 'Admin',
      'scolarite': 'Scolarite',
      'enseignant': 'Enseignant',
      'etudiant': 'Etudiant'
    };
    const apiRole = roleMap[inviteForm.role] || 'Etudiant';
    
    // Generate a secure temporary password satisfying z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[!@#$%^&*(),.?":{}|<>]/)
    const tempPassword = 'CampusOps' + Math.floor(100 + Math.random() * 900) + '!';

    try {
      const createdUser = await window.api.request('/users', {
        method: 'POST',
        body: {
          name: inviteForm.name,
          email: inviteForm.email,
          password: tempPassword,
          role: apiRole,
          branchId: branchId
        }
      });
      
      // If student and a group is selected, assign them
      if (apiRole === 'Etudiant' && inviteForm.group) {
        try {
          await window.api.request(`/groups/${inviteForm.group}/students`, {
            method: 'POST',
            body: { studentId: createdUser.data.id }
          });
        } catch (groupErr) {
          console.error("Failed to assign group", groupErr);
          toast({ type:'error', title:'Group assignment failed', desc: groupErr.message });
        }
      }
      
      toast({ type:'success', title:'Invitation sent', desc: `${inviteForm.email} created with password: ${tempPassword}. Welcome email dispatched.` });
      setInviting(false);
      await refreshUsersList();
    } catch (err) {
      toast({ type:'error', title:'Failed to send invitation', desc: err.message });
    }
  };

  const openEditU = (u) => {
    setEditForm({ name:u.name, email:u.email, role:u.role, branch:u.branch, status:u.status });
    setEditingU(u);
  };

  const saveEditU = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast({ type:'error', title:'Name and email are required' }); return;
    }
    let branchId = null;
    try {
      const brRes = await window.api.request('/branches');
      const apiBranches = brRes.data || [];
      const match = apiBranches.find(b => b.name === editForm.branch) || apiBranches[0];
      branchId = match?.id;
    } catch (e) {
      console.error('Failed to fetch branches', e);
    }

    const roleMap = {
      'admin': 'Admin',
      'scolarite': 'Scolarite',
      'enseignant': 'Enseignant',
      'etudiant': 'Etudiant'
    };
    const apiRole = roleMap[editForm.role] || 'Etudiant';

    try {
      await window.api.request(`/users/${editingU.id}`, {
        method: 'PUT',
        body: {
          name: editForm.name,
          email: editForm.email,
          role: apiRole,
          branchId: branchId
        }
      });
      
      toast({ type:'success', title:'User updated', desc: editForm.name + ' saved.' });
      setEditingU(null);
      await refreshUsersList();
    } catch (err) {
      toast({ type:'error', title:'Failed to update user', desc: err.message });
    }
  };

  const deleteUser = async (u) => {
    if (!confirm(`Are you sure you want to remove ${u.name}?`)) return;
    try {
      await window.api.request(`/users/${u.id}`, {
        method: 'DELETE'
      });
      toast({ type:'success', title:'User deleted', desc: u.name + ' has been removed.' });
      setEditingU(null);
      await refreshUsersList();
    } catch (err) {
      toast({ type:'error', title:'Failed to delete user', desc: err.message });
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Users')}</h1>
          <div className="sub">{lang==='fr'?'Tous les utilisateurs du système':'All system users'}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={openInvite}><Icon name="plus" size={14}/>{lang==='fr'?'Inviter':'Invite user'}</button>
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <div style={{display:'flex',gap:8,alignItems:'center',flex:1,maxWidth:520}}>
            <input placeholder={lang==='fr'?'Rechercher utilisateurs…':'Search users…'} value={q} onChange={e=>setQ(e.target.value)} style={{flex:1,padding:'8px 12px',borderRadius:7,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:13}}/>
            <div className="segment">
              <button className={roleFilter==='all'?'active':''} onClick={()=>setRoleFilter('all')}>All</button>
              <button className={roleFilter==='admin'?'active':''} onClick={()=>setRoleFilter('admin')}>Admin</button>
              <button className={roleFilter==='enseignant'?'active':''} onClick={()=>setRoleFilter('enseignant')}>Teachers</button>
              <button className={roleFilter==='scolarite'?'active':''} onClick={()=>setRoleFilter('scolarite')}>Scolarité</button>
            </div>
          </div>
          <div className="meta">{filtered.length} users</div>
        </div>
        <table className="tbl">
          <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Branch</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span className="av av-sm" style={{background:u.color}}>{u.init}</span>
                    <div>
                      <div style={{fontWeight:600}}>{u.name}</div>
                      <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--mono)'}}>{u.id}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge gray" style={{textTransform:'capitalize'}}>{u.role}</span></td>
                <td style={{color:'var(--text-2)'}}>{u.email}</td>
                <td>{u.branch}</td>
                <td><span className={`pill ${u.status==='active'?'paid':'overdue'}`}><span className="d"></span>{u.status}</span></td>
                <td style={{textAlign:'right'}}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>openEditU(u)}><Icon name="edit" size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite user modal */}
      {inviting && (
        <>
          <div className="drawer-bg open" onClick={()=>setInviting(false)}></div>
          <div className="modal open">
            <div className="modal-head">
              <h3 style={{fontSize:16}}>{lang==='fr'?'Inviter un utilisateur':'Invite user'}</h3>
              <button className="tb-btn" onClick={()=>setInviting(false)}><Icon name="close" size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="field" style={{gridColumn:'1/-1'}}>
                  <label>Full name</label>
                  <input value={inviteForm.name} onChange={e=>setInviteForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Karim Mansouri"/>
                </div>
                <div className="field" style={{gridColumn:'1/-1'}}>
                  <label>Email address</label>
                  <input type="email" value={inviteForm.email} onChange={e=>setInviteForm(f=>({...f,email:e.target.value}))} placeholder="user@uemf.ma"/>
                </div>
                <div className="field">
                  <label>Role</label>
                  <select value={inviteForm.role} onChange={e=>setInviteForm(f=>({...f,role:e.target.value}))}>
                    <option value="etudiant">Étudiant</option>
                    <option value="enseignant">Enseignant</option>
                    <option value="scolarite">Scolarité</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="field">
                  <label>Branch</label>
                  <select value={inviteForm.branch} onChange={e=>setInviteForm(f=>({...f,branch:e.target.value}))}>
                    <option value="—">—</option>
                    {BRANCHES.map(b=><option key={b.code} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                {inviteForm.role === 'etudiant' && (
                  <div className="field">
                    <label>Group</label>
                    <select value={inviteForm.group} onChange={e=>setInviteForm(f=>({...f,group:e.target.value}))}>
                      <option value="">(Select a group)</option>
                      {(window.GROUPS_LIST || [])
                        .filter(g => inviteForm.branch === '—' || g.branch === inviteForm.branch)
                        .map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="field" style={{gridColumn:'1/-1'}}>
                  <label>Status</label>
                  <select value={inviteForm.status} onChange={e=>setInviteForm(f=>({...f,status:e.target.value}))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{marginTop:14,padding:'10px 12px',background:'var(--accent-50)',borderRadius:8,fontSize:12,color:'var(--accent)',border:'1px solid var(--accent-100)'}}>
                An invitation email with a temporary password will be sent to the user.
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={()=>setInviting(false)}>{t('btn.cancel')}</button>
              <button className="btn btn-primary" onClick={saveInvite}>{lang==='fr'?'Envoyer':'Send invitation'}</button>
            </div>
          </div>
        </>
      )}

      {/* Edit user modal */}
      {editingU && (
        <>
          <div className="drawer-bg open" onClick={()=>setEditingU(null)}></div>
          <div className="modal open">
            <div className="modal-head">
              <h3 style={{fontSize:16}}>{lang==='fr'?'Modifier utilisateur':'Edit user'} — {editingU.name}</h3>
              <button className="tb-btn" onClick={()=>setEditingU(null)}><Icon name="close" size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="field" style={{gridColumn:'1/-1'}}>
                  <label>Full name</label>
                  <input value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}/>
                </div>
                <div className="field" style={{gridColumn:'1/-1'}}>
                  <label>Email</label>
                  <input type="email" value={editForm.email||''} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))}/>
                </div>
                <div className="field">
                  <label>Role</label>
                  <select value={editForm.role||'etudiant'} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))}>
                    <option value="etudiant">Étudiant</option>
                    <option value="enseignant">Enseignant</option>
                    <option value="scolarite">Scolarité</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="field">
                  <label>Branch</label>
                  <select value={editForm.branch||'—'} onChange={e=>setEditForm(f=>({...f,branch:e.target.value}))}>
                    <option value="—">—</option>
                    {BRANCHES.map(b=><option key={b.code} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div className="field" style={{gridColumn:'1/-1'}}>
                  <label>Status</label>
                  <select value={editForm.status||'active'} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-danger-soft" style={{marginRight:'auto'}} onClick={()=>{ if(confirm('Delete '+editingU.name+'?')) deleteUser(editingU); }}><Icon name="trash" size={14}/> Delete</button>
              <button className="btn btn-ghost" onClick={()=>setEditingU(null)}>{t('btn.cancel')}</button>
              <button className="btn btn-primary" onClick={saveEditU}>{t('btn.save')}</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── GROUPS ───
function Groups({ toast }){
  const { t, lang } = useI18n();
  const [view, setView] = uSP2(null);
  const [edit, setEdit] = uSP2(null);
  const [editForm, setEditForm] = uSP2({});
  const [addingG, setAddingG] = uSP2(false);
  const [addGForm, setAddGForm] = uSP2({ id:'', name:'', branch: BRANCHES[0]?.name || '', year:'2025-26', students:0 });
  const [groups, setGroups] = uSP2(() => [...GROUPS_LIST]);
  const [loading, setLoading] = uSP2(false);

  // Fetch groups from API on mount
  React.useEffect(() => {
    (async () => {
      try {
        const res = await api.request('/groups');
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map(g => ({
            id: g.id,
            name: g.name,
            branch: g.branch?.name || BRANCHES[0]?.name || 'EIDIA',
            branchId: g.branchId,
            year: g.academicYear || '2025-26',
            students: g._count?.students || g.students?.length || 0,
          }));
          setGroups(mapped);
          window.GROUPS_LIST = mapped;
        }
      } catch(e) { console.warn('Groups fetch fallback:', e.message); }
    })();
  }, []);

  const openEdit = (g) => {
    setEditForm({ id: g.id, name: g.name, branch: g.branch, year: g.year, students: g.students });
    setEdit(g);
    setView(null);
  };

  const saveEdit = async () => {
    setLoading(true);
    try {
      const body = { name: editForm.name, academicYear: editForm.year };
      // Try to resolve branchId
      const br = BRANCHES.find(b => b.name === editForm.branch);
      if (br && br.id) body.branchId = br.id;
      await api.request(`/groups/${edit.id}`, { method: 'PUT', body });
      // Update local state
      setGroups(prev => prev.map(g => g.id === edit.id ? { ...g, ...editForm } : g));
      window.GROUPS_LIST = groups.map(g => g.id === edit.id ? { ...g, ...editForm } : g);
      toast({ type:'success', title:'Group updated', desc: editForm.name + ' has been saved.' });
      setEdit(null);
    } catch(e) {
      toast({ type:'error', title:'Update failed', desc: e.message });
    }
    setLoading(false);
  };

  const openAddG = () => {
    setAddGForm({ id:'', name:'', branch: BRANCHES[0]?.name || '', year:'2025-26', students:0 });
    setAddingG(true);
  };

  const saveNewGroup = async () => {
    if (!addGForm.name.trim()) {
      toast({ type:'error', title:'Name is required' });
      return;
    }
    setLoading(true);
    try {
      const br = BRANCHES.find(b => b.name === addGForm.branch);
      const body = {
        name: addGForm.name,
        academicYear: addGForm.year,
        branchId: br?.id || BRANCHES[0]?.id,
      };
      const res = await api.request('/groups', { method: 'POST', body });
      const newG = {
        id: res.data.id,
        name: res.data.name,
        branch: addGForm.branch,
        year: res.data.academicYear || addGForm.year,
        students: 0,
      };
      setGroups(prev => [...prev, newG]);
      window.GROUPS_LIST = [...groups, newG];
      toast({ type:'success', title:'Group created', desc: addGForm.name + ' has been added.' });
      setAddingG(false);
    } catch(e) {
      toast({ type:'error', title:'Create failed', desc: e.message });
    }
    setLoading(false);
  };

  const deleteGroup = async (g) => {
    if (!confirm(`Delete group "${g.name}"?`)) return;
    try {
      await api.request(`/groups/${g.id}`, { method: 'DELETE' });
      setGroups(prev => prev.filter(x => x.id !== g.id));
      window.GROUPS_LIST = groups.filter(x => x.id !== g.id);
      toast({ type:'success', title:'Group deleted', desc: g.name + ' removed.' });
    } catch(e) {
      toast({ type:'error', title:'Delete failed', desc: e.message });
    }
  };

  const groupStudents = (g) => STUDENTS.filter(s => s.group === g.id || s.group === g.name);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Groups')}</h1>
          <div className="sub">{lang==='fr'?'Groupes et classes':'Class groups across all branches'}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={openAddG}>
            <Icon name="plus" size={14}/>{lang==='fr'?'Nouveau groupe':'New group'}
          </button>
        </div>
      </div>
      <div className="grid-3">
        {groups.map(g => {
          const studs = groupStudents(g);
          return (
            <div key={g.id} className="card">
              <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--text-3)',fontWeight:600}}>{g.id.substring(0,8)}</div>
              <div style={{fontSize:16,fontWeight:700,marginTop:2}}>{g.name}</div>
              <div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{g.branch} • {g.year}</div>
              <div style={{display:'flex',gap:14,marginTop:14,fontSize:12,color:'var(--text-2)'}}>
                <div><div style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'var(--head-font)'}}>{g.students}</div>Students</div>
                <div><div style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'var(--head-font)'}}>{studs.filter(s=>s.status==='active').length}</div>Active</div>
              </div>
              <div style={{marginTop:14,display:'flex',gap:6}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>setView(g)}><Icon name="eye" size={14}/>View</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(g)}><Icon name="edit" size={14}/>{t('btn.edit')}</button>
                <button className="btn btn-ghost btn-sm" style={{color:'var(--red)'}} onClick={()=>deleteGroup(g)}><Icon name="trash" size={14}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {view && (
        <>
          <div className="drawer-bg open" onClick={()=>setView(null)}></div>
          <div className="drawer open">
            <div className="drawer-head">
              <div>
                <div style={{fontSize:16,fontWeight:700}}>{view.name}</div>
                <div style={{fontSize:12,color:'var(--text-3)',fontFamily:'var(--mono)'}}>{view.id.substring(0,8)} • {view.branch}</div>
              </div>
              <button className="tb-btn" onClick={()=>setView(null)}><Icon name="close" size={16}/></button>
            </div>
            <div className="drawer-body">
              {(() => {
                const studs = groupStudents(view);
                return (
                  <>
                    <h4 style={{fontSize:12,textTransform:'uppercase',letterSpacing:1,color:'var(--text-3)',marginBottom:10,fontWeight:700}}>
                      Students ({studs.length || view.students})
                    </h4>
                    {studs.length === 0 && (
                      <div style={{fontSize:13,color:'var(--text-3)',padding:'12px 0'}}>
                        {view.students > 0 ? `${view.students} students enrolled (details not loaded).` : 'No students in this group.'}
                      </div>
                    )}
                    {studs.map(s => (
                      <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                        <span className="av av-sm" style={{background:s.color}}>{s.init}</span>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:13}}>{s.name}</div>
                          <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--mono)'}}>{s.id}</div>
                        </div>
                        <div className="mono" style={{fontSize:13,fontWeight:600,color:s.avg>=14?'var(--green)':s.avg>=10?'var(--orange)':'var(--red)'}}>{s.avg.toFixed(1)}</div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
            <div className="drawer-foot">
              <button className="btn btn-ghost" onClick={()=>setView(null)}>{t('btn.close')}</button>
              <button className="btn btn-primary" onClick={()=>openEdit(view)}>{t('btn.edit')}</button>
            </div>
          </div>
        </>
      )}

      {/* New group modal */}
      {addingG && (
        <>
          <div className="drawer-bg open" onClick={()=>setAddingG(false)}></div>
          <div className="modal open">
            <div className="modal-head">
              <h3 style={{fontSize:16}}>{lang==='fr'?'Nouveau groupe':'New group'}</h3>
              <button className="tb-btn" onClick={()=>setAddingG(false)}><Icon name="close" size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="field">
                  <label>Name</label>
                  <input value={addGForm.name} onChange={e=>setAddGForm(f=>({...f,name:e.target.value}))} placeholder="e.g. CS-G2"/>
                </div>
                <div className="field">
                  <label>Branch</label>
                  <select value={addGForm.branch} onChange={e=>setAddGForm(f=>({...f,branch:e.target.value}))}>
                    {BRANCHES.map(b=><option key={b.code||b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Academic year</label>
                  <input value={addGForm.year} onChange={e=>setAddGForm(f=>({...f,year:e.target.value}))} placeholder="2025-26"/>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={()=>setAddingG(false)}>{t('btn.cancel')}</button>
              <button className="btn btn-primary" disabled={loading} onClick={saveNewGroup}>{loading ? '...' : t('btn.save')}</button>
            </div>
          </div>
        </>
      )}

      {edit && (
        <>
          <div className="drawer-bg open" onClick={()=>setEdit(null)}></div>
          <div className="modal open">
            <div className="modal-head">
              <h3 style={{fontSize:16}}>{lang==='fr'?'Modifier groupe':'Edit group'} — {edit.name}</h3>
              <button className="tb-btn" onClick={()=>setEdit(null)}><Icon name="close" size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="field"><label>Name</label><input value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}/></div>
                <div className="field">
                  <label>Branch</label>
                  <select value={editForm.branch||''} onChange={e=>setEditForm(f=>({...f,branch:e.target.value}))}>
                    {BRANCHES.map(b=><option key={b.code||b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div className="field"><label>Academic year</label><input value={editForm.year||''} onChange={e=>setEditForm(f=>({...f,year:e.target.value}))}/></div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={()=>setEdit(null)}>{t('btn.cancel')}</button>
              <button className="btn btn-primary" disabled={loading} onClick={saveEdit}>{loading ? '...' : t('btn.save')}</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}



// ─── NOTIFICATIONS ───
function Notifications({ role, toast, onNav }){
  const { t, lang } = useI18n();
  const isAdmin = role === 'admin' || role === 'scolarite';
  const [view, setView] = uSP2('inbox');
  const [filter, setFilter] = uSP2('all');
  // Initialize items with role-specific generated notifications
  const [items, setItems] = uSP2(() => generateRoleNotifications(role));
  const filtered = items.filter(n => filter==='all' || (filter==='unread' && !n.read) || filter===n.type);
  const markAll = () => { setItems(items.map(i=>({...i, read:true}))); toast({type:'success',title:'All notifications marked as read'}); };
  const markOne = (id) => setItems(items.map(i => i.id===id?{...i,read:true}:i));

  // Handle action button clicks using ACTION_NAV map
  const handleAction = (action) => {
    const page = ACTION_NAV[action];
    if (page && onNav) {
      onNav(page);
    } else {
      toast({ type:'info', title: action });
    }
  };

  // Composer state (admin/scolarite only)
  const [compType, setCompType] = uSP2('info');
  const [compTitle, setCompTitle] = uSP2('');
  const [compBody, setCompBody] = uSP2('');
  const [compAudience, setCompAudience] = uSP2('all_students');
  const [compGroup, setCompGroup] = uSP2('');
  const [compUser, setCompUser] = uSP2('');
  const [compChannels, setCompChannels] = uSP2({ inapp: true, email: true, telegram: false, whatsapp: false });
  const [sending, setSending] = uSP2(false);
  const [sentLog, setSentLog] = uSP2([]);

  const toggleCh = (ch) => setCompChannels(prev => ({...prev, [ch]: !prev[ch]}));

  // Load real notifications from API on mount
  const [realLoaded, setRealLoaded] = uSP2(false);
  React.useEffect(() => {
    if (realLoaded) return;
    window.api.request('/notifications').then(res => {
      if (res.data && res.data.length > 0) {
        setItems(res.data.map(n => ({
          id: n.id, type: n.type || 'info', title: n.title,
          desc: n.content, time: new Date(n.createdAt).toLocaleString(),
          read: n.isRead,
        })));
      }
      setRealLoaded(true);
    }).catch(() => setRealLoaded(true)); // fallback to mock data
  }, []);

  const handleSend = async () => {
    if (!compTitle.trim()) { toast({type:'error', title:'Title is required'}); return; }
    if (!compBody.trim()) { toast({type:'error', title:'Message body is required'}); return; }
    const channels = Object.entries(compChannels).filter(([_,v])=>v).map(([k])=>k);
    if (!channels.length) { toast({type:'error', title:'Select at least one delivery channel'}); return; }

    setSending(true);
    const audienceLabel = compAudience === 'all_students' ? 'All students' : compAudience === 'all_teachers' ? 'All teachers' : compAudience === 'all' ? 'Everyone' : compAudience === 'group' ? `Group: ${compGroup || '?'}` : `User: ${compUser || '?'}`;

    try {
      const res = await window.api.request('/notifications/broadcast', { method: 'POST', body: {
        title: compTitle, content: compBody, type: compType,
        audience: compAudience, groupId: compGroup || undefined, userId: compUser || undefined,
        channels,
      }});
      const result = res.data;
      const channelSummary = (result.channels || []).map(c => `${c.channel}: ${c.delivered}/${c.total}`).join(', ');
      toast({type:'success', title:'Notification broadcast sent!', desc:`${result.recipientCount} recipients — ${channelSummary}`});
    } catch(err) {
      // Mock mode fallback
      toast({type:'success', title:'Notification sent (Mock Mode)', desc:`Would deliver to ${audienceLabel} via ${channels.join(', ')}`});
    }

    // Add to sent log
    setSentLog(prev => [{ id: Date.now(), title: compTitle, body: compBody, type: compType, audience: audienceLabel, channels, time: new Date().toLocaleTimeString() }, ...prev]);
    // Also add to inbox as preview
    setItems(prev => [{ id: Date.now(), type: compType, title: compTitle, desc: compBody, time: 'Just now', read: true }, ...prev]);

    setCompTitle(''); setCompBody('');
    setSending(false);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Notifications')}</h1>
          <div className="sub">{isAdmin ? (view==='compose' ? 'Send notifications to users' : `${items.filter(n=>!n.read).length} unread`) : `${items.filter(n=>!n.read).length} unread`}</div>
        </div>
        <div className="page-actions">
          {isAdmin && (
            <div className="segment" style={{marginRight:8}}>
              <button className={view==='inbox'?'active':''} onClick={()=>setView('inbox')}>Inbox</button>
              <button className={view==='compose'?'active':''} onClick={()=>setView('compose')}>Send</button>
              <button className={view==='history'?'active':''} onClick={()=>setView('history')}>Sent Log</button>
            </div>
          )}
          {view==='inbox' && <button className="btn btn-ghost btn-sm" onClick={markAll}>{t('btn.markAllRead')}</button>}
        </div>
      </div>

      {/* ─── INBOX VIEW ─── */}
      {view==='inbox' && (
        <>
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            <div className="segment">
              <button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All</button>
              <button className={filter==='unread'?'active':''} onClick={()=>setFilter('unread')}>Unread</button>
              <button className={filter==='alert'?'active':''} onClick={()=>setFilter('alert')}>Alerts</button>
              <button className={filter==='reminder'?'active':''} onClick={()=>setFilter('reminder')}>Reminders</button>
              <button className={filter==='success'?'active':''} onClick={()=>setFilter('success')}>Success</button>
            </div>
          </div>
          <div>
            {filtered.length===0 && <div className="card"><div className="empty">No notifications match this filter.</div></div>}
            {filtered.map(n => (
              <div key={n.id} className={`notif t-${n.type} ${n.read?'':'unread'}`} onClick={()=>markOne(n.id)}>
                <span className="dot"></span>
                <div className="body">
                  <div className="t">
                    {n.title}
                    {!n.read && <span className="unread-dot"></span>}
                  </div>
                  <div className="d">{n.desc}</div>
                  <div className="tm">{n.time}</div>
                  {n.actions && (
                    <div className="actions">
                      {n.actions.map((a,i) => (
                        <button key={i} onClick={(e)=>{ e.stopPropagation(); handleAction(a); }}>{a}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── COMPOSE VIEW (Admin / Scolarité only) ─── */}
      {view==='compose' && isAdmin && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap:18}}>
          <div className="card">
            <h3 style={{marginBottom:14}}>Compose notification</h3>

            {/* Type selector */}
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Notification type</div>
            <div className="segment" style={{marginBottom:16}}>
              {[['info','Info'],['alert','Alert'],['reminder','Reminder'],['success','Success']].map(([k,l]) => (
                <button key={k} className={compType===k?'active':''} onClick={()=>setCompType(k)}>{l}</button>
              ))}
            </div>

            {/* Title */}
            <div className="field" style={{marginBottom:12}}>
              <label>Title</label>
              <input value={compTitle} onChange={e=>setCompTitle(e.target.value)} placeholder="e.g. Grade submission deadline approaching" />
            </div>

            {/* Body */}
            <div className="field" style={{marginBottom:12}}>
              <label>Message</label>
              <textarea value={compBody} onChange={e=>setCompBody(e.target.value)} placeholder="Write the notification message here…" rows={5} style={{width:'100%',resize:'vertical',fontFamily:'inherit',fontSize:13,padding:'10px 12px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg)'}}/>
            </div>

            {/* Quick templates */}
            <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Quick templates</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
              {[
                {l:'Grade posted', ty:'success', ti:'New grades available', bd:'Your grades for the latest session have been posted. Check the Grades tab for details.'},
                {l:'Grade deadline', ty:'reminder', ti:'Grade submission deadline', bd:'Please submit all pending grades before Friday at 23:59. Late submissions will not be accepted.'},
                {l:'Absence alert', ty:'alert', ti:'Absence threshold exceeded', bd:'You have exceeded the allowed number of absences for this semester. Please contact the Scolarité office immediately.'},
                {l:'Payment due', ty:'alert', ti:'Payment reminder', bd:'Your tuition payment is now overdue. Please settle your balance at the finance office or via bank transfer to avoid late fees.'},
                {l:'Schedule change', ty:'info', ti:'Schedule update', bd:'There has been a change to your weekly schedule. Please check the Planning tab for updated session times and rooms.'},
                {l:'Announcement', ty:'info', ti:'System announcement', bd:'CampusOps will undergo scheduled maintenance this weekend. The platform will be briefly unavailable on Saturday from 02:00 to 04:00.'},
              ].map((tpl,i) => (
                <button key={i} className="btn btn-ghost btn-sm" style={{fontSize:11}} onClick={()=>{setCompType(tpl.ty); setCompTitle(tpl.ti); setCompBody(tpl.bd); toast({type:'info',title:`Template loaded: ${tpl.l}`});}}>{tpl.l}</button>
              ))}
            </div>

            {/* Send button */}
            <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="btn btn-ghost" onClick={()=>{setCompTitle('');setCompBody('');setCompType('info');}}>Clear</button>
              <button className="btn btn-primary" disabled={sending} onClick={handleSend}>{sending ? 'Sending…' : 'Send notification'}</button>
            </div>
          </div>

          {/* Right sidebar — Recipients & Channels */}
          <div>
            <div className="card" style={{marginBottom:14}}>
              <h3 style={{marginBottom:12}}>Recipients</h3>

              <div className="field" style={{marginBottom:10}}>
                <label>Audience</label>
                <select value={compAudience} onChange={e=>setCompAudience(e.target.value)}>
                  <option value="all">Everyone (all users)</option>
                  <option value="all_students">All students</option>
                  <option value="all_teachers">All teachers</option>
                  <option value="group">Specific group</option>
                  <option value="user">Specific user</option>
                </select>
              </div>

              {compAudience === 'group' && (
                <div className="field" style={{marginBottom:10}}>
                  <label>Select group</label>
                  <select value={compGroup} onChange={e=>setCompGroup(e.target.value)}>
                    <option value="">— Choose a group —</option>
                    {(window.GROUPS_LIST || []).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              )}

              {compAudience === 'user' && (
                <div className="field" style={{marginBottom:10}}>
                  <label>Search user</label>
                  <select value={compUser} onChange={e=>setCompUser(e.target.value)}>
                    <option value="">— Choose a user —</option>
                    {(window.USERS_LIST || window.STUDENTS || []).map(u => <option key={u.id} value={u.id}>{u.name} {u.role ? `(${u.role})` : ''}</option>)}
                  </select>
                </div>
              )}

              <div style={{fontSize:11,color:'var(--text-3)',marginTop:6,padding:'8px 10px',background:'var(--hover)',borderRadius:6}}>
                {compAudience === 'all' && 'This will be sent to all students, teachers, and staff.'}
                {compAudience === 'all_students' && `Will reach ${(window.STUDENTS||[]).length || '~80'} students.`}
                {compAudience === 'all_teachers' && `Will reach all registered teachers.`}
                {compAudience === 'group' && (compGroup ? `Will reach all students in the selected group.` : 'Please select a group.')}
                {compAudience === 'user' && (compUser ? `Will reach the selected user only.` : 'Please select a user.')}
              </div>
            </div>

            <div className="card">
              <h3 style={{marginBottom:12}}>Delivery channels</h3>
              <p style={{fontSize:12,color:'var(--text-3)',marginBottom:10}}>Choose how to deliver this notification.</p>

              {[
                ['inapp', 'In-app notification', 'Appears in the notification bell inside CampusOps.'],
                ['email', 'Email', 'Sent to the user\'s registered email address.'],
                ['telegram', 'Telegram', 'Sent via @CampusOpsBot to linked accounts.'],
                ['whatsapp', 'WhatsApp', 'Sent to the user\'s registered phone number.'],
              ].map(([key, label, desc]) => (
                <div key={key} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                  <button className={`toggle ${compChannels[key]?'on':''}`} onClick={()=>toggleCh(key)} style={{flexShrink:0}}></button>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{label}</div>
                    <div style={{fontSize:11,color:'var(--text-3)'}}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── SENT LOG VIEW (Admin / Scolarité only) ─── */}
      {view==='history' && isAdmin && (
        <div className="card">
          <div className="card-head"><h3>Sent notifications log</h3><div className="meta">{sentLog.length} sent this session</div></div>
          {sentLog.length === 0 && <div className="empty" style={{padding:30}}>No notifications sent yet this session. Go to the "Send" tab to compose one.</div>}
          <table className="tbl" style={{marginTop:sentLog.length?8:0}}>
            {sentLog.length > 0 && (
              <thead><tr><th>Time</th><th>Type</th><th>Title</th><th>Audience</th><th>Channels</th></tr></thead>
            )}
            <tbody>
              {sentLog.map(s => (
                <tr key={s.id}>
                  <td className="mono" style={{fontSize:12,whiteSpace:'nowrap'}}>{s.time}</td>
                  <td><span className={`pill ${s.type==='alert'?'overdue':s.type==='success'?'paid':s.type==='reminder'?'partial':'active'}`}><span className="d"></span>{s.type}</span></td>
                  <td><strong>{s.title}</strong><br/><span style={{fontSize:11,color:'var(--text-3)'}}>{s.body.substring(0,60)}…</span></td>
                  <td style={{fontSize:12.5}}>{s.audience}</td>
                  <td style={{fontSize:12}}>{s.channels.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── PROGRESS ───
function Progress({ role }){
  const { t, lang } = useI18n();
  if(role==='etudiant'){
    const me = ROLES.etudiant;
    const overall = (STUDENT_GRADES.reduce((a,g)=>a+g.average,0)/STUDENT_GRADES.length).toFixed(2);
    return (
      <>
        <div className="page-head">
          <div>
            <h1>{t('nav.Progress')}</h1>
            <div className="sub">{me.name} — Group {me.group}</div>
          </div>
        </div>
        <div className="grid-4" style={{marginBottom:14}}>
          <div className="stat"><div className="stat-l">{t('grade.overall')}</div><div className="stat-v" style={{color:'var(--green)'}}>{overall}</div></div>
          <div className="stat"><div className="stat-l">Modules passed</div><div className="stat-v">{STUDENT_GRADES.filter(g=>g.average>=10).length}/{STUDENT_GRADES.length}</div></div>
          <div className="stat"><div className="stat-l">Attendance</div><div className="stat-v">96%</div></div>
          <div className="stat"><div className="stat-l">Rank</div><div className="stat-v">3rd</div></div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Module breakdown</h3></div>
          <table className="tbl">
            <thead><tr><th>Module</th><th>Average</th><th>Status</th></tr></thead>
            <tbody>
              {STUDENT_GRADES.map(g => (
                <tr key={g.module}>
                  <td><strong>{g.name}</strong> <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-3)',marginLeft:8}}>{g.module}</span></td>
                  <td className="mono" style={{fontWeight:700,fontSize:14,color:g.average>=14?'var(--green)':g.average>=10?'var(--orange)':'var(--red)'}}>{g.average.toFixed(2)}</td>
                  <td><span className={`pill ${g.average>=14?'paid':g.average>=10?'partial':'overdue'}`}><span className="d"></span>{g.average>=14?'Excellent':g.average>=10?'Passing':'At risk'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Progress')}</h1>
          <div className="sub">{lang==='fr'?'Suivi de progression':'Academic progress overview'}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h3>Students at a glance</h3></div>
        <table className="tbl">
          <thead><tr><th>Student</th><th>Group</th><th>Average</th><th>Attendance</th><th>Status</th></tr></thead>
          <tbody>
            {STUDENTS.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span className="av av-sm" style={{background:s.color}}>{s.init}</span>
                    <div style={{fontWeight:600}}>{s.name}</div>
                  </div>
                </td>
                <td>{s.group}</td>
                <td className="mono" style={{fontWeight:600,color:s.avg>=14?'var(--green)':s.avg>=10?'var(--orange)':'var(--red)'}}>{s.avg.toFixed(1)}</td>
                <td className="mono">{s.att}%</td>
                <td><span className={`pill ${s.status==='active'?'paid':'overdue'}`}><span className="d"></span>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── SETTINGS ───
function Settings({ role, onLogout, theme, setTheme, lang, setLang, toast }){
  const { t } = useI18n();
  const [tab, setTab] = uSP2('account');
  const [phone, setPhone] = uSP2(() => localStorage.getItem('co2_phone') || '');
  const [density, setDensity] = uSP2(() => localStorage.getItem('co2_density') || 'comfortable');
  const [changingPwd, setChangingPwd] = uSP2(false);
  const [pwdForm, setPwdForm] = uSP2({ current:'', next:'', confirm:'' });
  const [managingTokens, setManagingTokens] = uSP2(false);
  const [tokens, setTokens] = uSP2(() => {
    try { return JSON.parse(localStorage.getItem('co2_tokens')||'[]'); } catch { return []; }
  });
  const [newTokenName, setNewTokenName] = uSP2('');
  const [revealedToken, setRevealedToken] = uSP2(null);
  const r = ROLES[role];

  uEP2(() => {
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  uEP2(() => {
    localStorage.setItem('co2_tokens', JSON.stringify(tokens));
  }, [tokens]);

  const applyDensity = (d) => {
    setDensity(d);
    localStorage.setItem('co2_density', d);
  };

  const submitPwd = () => {
    if (!pwdForm.current.trim()) { toast({type:'error', title:'Current password required'}); return; }
    if (pwdForm.next.length < 8) { toast({type:'error', title:'Password must be at least 8 characters'}); return; }
    if (pwdForm.next !== pwdForm.confirm) { toast({type:'error', title:'Passwords do not match'}); return; }
    toast({type:'success', title:'Password changed', desc:'Your password has been updated successfully.'});
    setPwdForm({ current:'', next:'', confirm:'' });
    setChangingPwd(false);
  };

  const generateToken = () => {
    if (!newTokenName.trim()) { toast({type:'error', title:'Token name is required'}); return; }
    const tk = 'co2_' + Math.random().toString(36).slice(2,12) + Math.random().toString(36).slice(2,12);
    const newTok = { id: Date.now(), name: newTokenName, token: tk, created: new Date().toLocaleDateString(), lastUsed: '—' };
    setTokens(prev => [newTok, ...prev]);
    setRevealedToken(newTok);
    setNewTokenName('');
    toast({type:'success', title:'Token created', desc:'Copy it now — it will not be shown again.'});
  };

  const revokeToken = (id) => {
    setTokens(prev => prev.filter(t => t.id !== id));
    toast({type:'success', title:'Token revoked'});
  };

  const copyToken = (txt) => {
    navigator.clipboard?.writeText(txt);
    toast({type:'success', title:'Copied to clipboard'});
  };

  const [telegramCode, setTelegramCode] = uSP2('');
  const [linkingTg, setLinkingTg] = uSP2(false);
  const [tgLinked, setTgLinked] = uSP2(false);

  uEP2(() => {
    // Check telegram status on mount
    const checkTgStatus = async () => {
      try {
        const res = await window.api.request('/telegram/status');
        setTgLinked(res.data?.linked || false);
      } catch (e) {
        console.error('Failed to check TG status', e);
      }
    };
    checkTgStatus();
  }, []);

  const linkTelegram = async () => {
    if (!telegramCode.trim() || telegramCode.length !== 6) {
      toast({type:'error', title:'Invalid code', desc:'Please enter the 6-digit code from the bot.'});
      return;
    }
    setLinkingTg(true);
    try {
      await window.api.request('/telegram/link', {
        method: 'POST',
        body: { code: telegramCode }
      });
      toast({type:'success', title:'Telegram linked!', desc:'You will now receive notifications via Telegram and can use bot commands.'});
      setTgLinked(true);
      setTelegramCode('');
    } catch (err) {
      toast({type:'error', title:'Linking failed', desc: err.message || 'Invalid or expired code.'});
    }
    setLinkingTg(false);
  };

  const unlinkTelegram = async () => {
    if (!confirm('Are you sure you want to unlink your Telegram account? You will no longer receive notifications.')) return;
    setLinkingTg(true);
    try {
      await window.api.request('/telegram/unlink', { method: 'POST' });
      toast({type:'success', title:'Telegram unlinked', desc:'Your account is no longer connected.'});
      setTgLinked(false);
    } catch (err) {
      toast({type:'error', title:'Unlink failed', desc: err.message});
    }
    setLinkingTg(false);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.Settings')}</h1>
          <div className="sub">{lang==='fr'?'Préférences et compte':'Preferences and account'}</div>
        </div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'220px 1fr', gap:18}}>
        <div className="card" style={{padding:10, alignSelf:'flex-start'}}>
          <div className="settings-nav">
            <button className={`tab ${tab==='account'?'active':''}`} onClick={()=>setTab('account')}><Icon name="users" size={16}/>{t('set.account')}</button>
            <button className={`tab ${tab==='security'?'active':''}`} onClick={()=>setTab('security')}><Icon name="lock" size={16}/>{t('set.security')}</button>
            <button className={`tab ${tab==='appearance'?'active':''}`} onClick={()=>setTab('appearance')}><Icon name="palette" size={16}/>{t('set.appearance')}</button>
            <button className={`tab ${tab==='notifications'?'active':''}`} onClick={()=>setTab('notifications')}><Icon name="bell" size={16}/>{t('set.notifications')}</button>
            <button className={`tab ${tab==='sessions'?'active':''}`} onClick={()=>setTab('sessions')}><Icon name="device" size={16}/>{t('set.sessions')}</button>
          </div>
        </div>
        <div className="card">
          {tab==='account' && (
            <div>
              <h3 style={{marginBottom:14}}>{t('set.account')}</h3>
              <div style={{display:'flex',alignItems:'center',gap:14,paddingBottom:18,borderBottom:'1px solid var(--border)',marginBottom:14}}>
                <div className="av av-md" style={{background:r.color, width:64, height:64, fontSize:20}}>{r.name.split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
                <div>
                  <div style={{fontSize:18,fontWeight:700}}>{r.name}</div>
                  <div style={{fontSize:13,color:'var(--text-2)'}}>{r.email}</div>
                  <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{r.label}{r.field?` — ${r.field}`:''}</div>
                </div>
              </div>
              <div className="grid-2">
                <div className="field"><label>Full name</label><input defaultValue={r.name}/></div>
                <div className="field"><label>Email</label><input defaultValue={r.email}/></div>
                <div className="field">
                  <label>Phone</label>
                  <input
                    value={phone}
                    onChange={e=>setPhone(e.target.value)}
                    placeholder="+212 …"
                  />
                </div>
                <div className="field"><label>{t('set.language')}</label><select value={lang} onChange={e=>setLang(e.target.value)}><option value="en">English</option><option value="fr">Français</option></select></div>
              </div>
              <div style={{marginTop:14,display:'flex',justifyContent:'flex-end'}}>
                <button className="btn btn-primary" onClick={()=>{ localStorage.setItem('co2_phone', phone); toast({type:'success',title:'Profile saved', desc:'Your changes have been saved.'}); }}>{t('btn.save')}</button>
              </div>
            </div>
          )}
          {tab==='security' && (
            <div>
              <h3 style={{marginBottom:14}}>{t('set.security')}</h3>
              <div className="setting-row">
                <div><div className="t">{t('set.changePassword')}</div><div className="s">Use at least 8 characters with a mix of letters, numbers and symbols.</div></div>
                <button className="btn btn-ghost btn-sm" onClick={()=>setChangingPwd(true)}>Change</button>
              </div>
              <div className="setting-row">
                <div><div className="t">{t('set.2fa')}</div><div className="s">Add an extra layer of security using an authenticator app or SMS code.</div></div>
                <button className="toggle" onClick={(e)=>{e.currentTarget.classList.toggle('on'); toast({type:'success',title:'2FA toggled'});}}></button>
              </div>
              <div className="setting-row">
                <div><div className="t">Login alerts</div><div className="s">Email me when there's a sign-in from a new device or location.</div></div>
                <button className="toggle on" onClick={(e)=>{e.currentTarget.classList.toggle('on'); toast({type:'success',title:'Login alerts toggled'});}}></button>
              </div>
              <div className="setting-row">
                <div><div className="t">API tokens</div><div className="s">Manage personal access tokens for integrations. {tokens.length>0 && <strong>({tokens.length} active)</strong>}</div></div>
                <button className="btn btn-ghost btn-sm" onClick={()=>setManagingTokens(true)}>Manage</button>
              </div>
            </div>
          )}
          {tab==='appearance' && (
            <div>
              <h3 style={{marginBottom:14}}>{t('set.appearance')}</h3>
              <div className="setting-row">
                <div><div className="t">Theme</div><div className="s">Choose how CampusOps looks. System matches your OS preference.</div></div>
                <div className="segment">
                  <button className={theme==='light'?'active':''} onClick={()=>setTheme('light')}>{t('set.lightMode')}</button>
                  <button className={theme==='dark'?'active':''} onClick={()=>setTheme('dark')}>{t('set.darkMode')}</button>
                </div>
              </div>
              <div className="setting-row">
                <div><div className="t">{t('set.language')}</div><div className="s">Interface language for menus, tables and forms.</div></div>
                <div className="segment">
                  <button className={lang==='en'?'active':''} onClick={()=>setLang('en')}>English</button>
                  <button className={lang==='fr'?'active':''} onClick={()=>setLang('fr')}>Français</button>
                </div>
              </div>
              <div className="setting-row">
                <div><div className="t">Density</div><div className="s">Comfortable spacing or compact for more on screen.</div></div>
                <div className="segment">
                  <button className={density==='comfortable'?'active':''} onClick={()=>applyDensity('comfortable')}>Comfortable</button>
                  <button className={density==='compact'?'active':''} onClick={()=>applyDensity('compact')}>Compact</button>
                </div>
              </div>
              <div className="setting-row">
                <div><div className="t">Reduce motion</div><div className="s">Disable non-essential animations and transitions.</div></div>
                <button className="toggle"></button>
              </div>
            </div>
          )}
          {tab==='notifications' && (
            <div>
              <h3 style={{marginBottom:6}}>Notification Channels</h3>
              <p style={{fontSize:12.5,color:'var(--text-3)',marginBottom:18}}>Choose how and where you receive alerts about grades, absences, payments, and deadlines.</p>

              {/* ── Email ── */}
              <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Email</div>
              {[
                ['Email — daily digest','One email summarising all activity since yesterday.',true],
                ['Email — real-time alerts','Instant email for absences, payments, and grade submissions.',true],
              ].map(([title,sub,on],i) => (
                <div key={'em'+i} className="setting-row">
                  <div><div className="t">{title}</div><div className="s">{sub}</div></div>
                  <button className={`toggle ${on?'on':''}`} onClick={(e)=>e.currentTarget.classList.toggle('on')}></button>
                </div>
              ))}

              <div style={{height:1,background:'var(--border)',margin:'16px 0'}}/>

              {/* ── Telegram ── */}
              <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Telegram Bot</div>
              <div className="setting-row">
                <div>
                  <div className="t">Enable Telegram notifications</div>
                  <div className="s">Receive instant alerts via our <strong>@UEMF_CampusOps_bot</strong> on Telegram.</div>
                </div>
                <button className={`toggle ${tgLinked ? 'on' : ''}`} onClick={(e)=>{
                  if (tgLinked) return; // Prevent toggling off via this button, they must click Unlink
                  toast({type:'info', title:'Telegram setup', desc:'Open Telegram and message @UEMF_CampusOps_bot with /start to link your account.'});
                }}></button>
              </div>
              
              {tgLinked ? (
                <div className="setting-row" style={{background:'var(--success-50)',borderRadius:8,padding:'14px',margin:'8px 0', border:'1px solid var(--success-100)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div className="t" style={{fontSize:14, color:'var(--success)'}}>✅ Telegram Linked</div>
                      <div className="s" style={{color:'var(--success)'}}>Your account is connected to Telegram and receiving alerts.</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" disabled={linkingTg} onClick={unlinkTelegram} style={{color:'var(--red)'}}>Unlink Account</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="setting-row" style={{background:'var(--hover)',borderRadius:8,padding:'10px 14px',margin:'8px 0'}}>
                    <div>
                      <div className="t" style={{fontSize:12}}>How to connect</div>
                      <div className="s">1. Open Telegram → search <strong>@UEMF_CampusOps_bot</strong><br/>2. Send <code>/start</code><br/>3. The bot will reply with a link code<br/>4. Paste the code below and click "Link"</div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8,marginBottom:4}}>
                    <input value={telegramCode} onChange={e=>setTelegramCode(e.target.value)} placeholder="Paste your 6-digit Telegram link code…" style={{flex:1,fontSize:12.5}}/>
                    <button className="btn btn-primary btn-sm" disabled={linkingTg} onClick={linkTelegram}>{linkingTg ? '...' : 'Link'}</button>
                  </div>
                </>
              )}

              <div style={{height:1,background:'var(--border)',margin:'16px 0'}}/>

              {/* ── WhatsApp ── */}
              <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>WhatsApp</div>
              <div className="setting-row">
                <div>
                  <div className="t">Enable WhatsApp notifications</div>
                  <div className="s">Receive critical alerts (payment overdue, absence threshold) via WhatsApp.</div>
                </div>
                <button className="toggle" onClick={(e)=>{e.currentTarget.classList.toggle('on'); toast({type:'info', title:'WhatsApp setup', desc:'Enter your phone number above in Account settings, then enable this toggle.'});}}></button>
              </div>
              <div className="setting-row" style={{background:'var(--hover)',borderRadius:8,padding:'10px 14px',margin:'8px 0'}}>
                <div>
                  <div className="t" style={{fontSize:12}}>Phone number required</div>
                  <div className="s">Make sure your phone number is set in the <strong>Account</strong> tab (e.g. +212 6XX XX XX XX). WhatsApp messages will be sent to that number.</div>
                </div>
              </div>

              <div style={{height:1,background:'var(--border)',margin:'16px 0'}}/>

              {/* ── Browser Push ── */}
              <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Browser</div>
              <div className="setting-row">
                <div>
                  <div className="t">Browser push notifications</div>
                  <div className="s">Show desktop pop-ups when CampusOps is open in this browser.</div>
                </div>
                <button className="toggle" onClick={(e)=>e.currentTarget.classList.toggle('on')}></button>
              </div>

              <div style={{height:1,background:'var(--border)',margin:'16px 0'}}/>

              {/* ── Event Types ── */}
              <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Event Types</div>
              <p style={{fontSize:12,color:'var(--text-3)',marginBottom:10}}>Select which events trigger notifications across all enabled channels.</p>
              {[
                ['New grade posted','When a teacher submits or updates a grade.',true],
                ['Grade submission deadlines','Remind teachers before grading windows close.',true],
                ['Absence threshold alert','When a student misses too many sessions.',true],
                ['Payment due / overdue','When an invoice becomes due or overdue.',true],
                ['Schedule changes','When a planning session is added, moved, or cancelled.',false],
                ['System announcements','Platform updates and maintenance windows.',false],
              ].map(([title,sub,on],i) => (
                <div key={'ev'+i} className="setting-row">
                  <div><div className="t">{title}</div><div className="s">{sub}</div></div>
                  <button className={`toggle ${on?'on':''}`} onClick={(e)=>e.currentTarget.classList.toggle('on')}></button>
                </div>
              ))}

              <div style={{marginTop:18,display:'flex',justifyContent:'flex-end'}}>
                <button className="btn btn-primary" onClick={()=>toast({type:'success',title:'Notification preferences saved'})}>Save preferences</button>
              </div>
            </div>
          )}
          {tab==='sessions' && (
            <div>
              <h3 style={{marginBottom:14}}>{t('set.activeSessions')}</h3>
              {[
                ['MacBook Pro — Chrome','Casablanca, Morocco','Active now',true],
                ['iPhone 15 — Safari','Casablanca, Morocco','3 hours ago',false],
                ['Windows — Firefox','Rabat, Morocco','2 days ago',false],
              ].map(([d,loc,tm,cur],i)=> (
                <div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0',borderBottom:'1px solid var(--border)'}}>
                  <div style={{width:40,height:40,borderRadius:10,background:'var(--hover)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-2)'}}><Icon name="device" size={18}/></div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13.5}}>{d} {cur && <span className="badge green" style={{marginLeft:8}}>This device</span>}</div>
                    <div style={{fontSize:12,color:'var(--text-3)'}}>{loc} • {tm}</div>
                  </div>
                  {!cur && <button className="btn btn-ghost btn-sm" onClick={()=>toast({type:'success',title:'Session revoked'})}>Revoke</button>}
                </div>
              ))}
              <div style={{marginTop:18,display:'flex',justifyContent:'flex-end',gap:8}}>
                <button className="btn btn-danger-soft btn-sm" onClick={()=>{ toast({type:'warn',title:'Signed out everywhere'}); setTimeout(onLogout, 500); }}>{t('set.signOutAll')}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change password modal */}
      {changingPwd && (
        <>
          <div className="drawer-bg open" onClick={()=>setChangingPwd(false)}></div>
          <div className="modal open" style={{width:480}}>
            <div className="modal-head">
              <h3 style={{fontSize:16}}>{t('set.changePassword')}</h3>
              <button className="tb-btn" onClick={()=>setChangingPwd(false)}><Icon name="close" size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="field" style={{marginBottom:12}}>
                <label>Current password</label>
                <input type="password" value={pwdForm.current} onChange={e=>setPwdForm(f=>({...f,current:e.target.value}))} autoFocus/>
              </div>
              <div className="field" style={{marginBottom:12}}>
                <label>New password</label>
                <input type="password" value={pwdForm.next} onChange={e=>setPwdForm(f=>({...f,next:e.target.value}))}/>
                <div className="hint" style={{fontSize:11,color:'var(--text-3)',marginTop:4}}>At least 8 characters with letters, numbers, and symbols.</div>
              </div>
              <div className="field">
                <label>Confirm new password</label>
                <input type="password" value={pwdForm.confirm} onChange={e=>setPwdForm(f=>({...f,confirm:e.target.value}))}/>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={()=>{ setChangingPwd(false); setPwdForm({current:'',next:'',confirm:''}); }}>{t('btn.cancel')}</button>
              <button className="btn btn-primary" onClick={submitPwd}>Update password</button>
            </div>
          </div>
        </>
      )}

      {/* Manage API tokens modal */}
      {managingTokens && (
        <>
          <div className="drawer-bg open" onClick={()=>{ setManagingTokens(false); setRevealedToken(null); }}></div>
          <div className="modal open" style={{width:640}}>
            <div className="modal-head">
              <h3 style={{fontSize:16}}>API tokens</h3>
              <button className="tb-btn" onClick={()=>{ setManagingTokens(false); setRevealedToken(null); }}><Icon name="close" size={16}/></button>
            </div>
            <div className="modal-body">
              <p style={{fontSize:12.5,color:'var(--text-2)',marginBottom:14}}>Personal access tokens allow scripts and integrations to authenticate with the CampusOps API on your behalf.</p>

              {revealedToken && (
                <div style={{padding:'12px 14px',background:'var(--accent-50)',border:'1px solid var(--accent-100)',borderRadius:8,marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--accent)',marginBottom:6}}>New token created — copy it now (it will not be shown again):</div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <code style={{flex:1,padding:'8px 10px',background:'var(--surface)',borderRadius:6,fontFamily:'var(--mono)',fontSize:12,wordBreak:'break-all'}}>{revealedToken.token}</code>
                    <button className="btn btn-ghost btn-sm" onClick={()=>copyToken(revealedToken.token)}>Copy</button>
                  </div>
                </div>
              )}

              <div style={{display:'flex',gap:8,marginBottom:14}}>
                <input value={newTokenName} onChange={e=>setNewTokenName(e.target.value)} placeholder="Token name (e.g. CI/CD pipeline)" style={{flex:1,padding:'9px 12px',borderRadius:7,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:13}}/>
                <button className="btn btn-primary btn-sm" onClick={generateToken}><Icon name="plus" size={14}/>Generate</button>
              </div>

              <div style={{fontSize:11,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Existing tokens ({tokens.length})</div>
              {tokens.length === 0 && <div className="empty" style={{padding:24,fontSize:13}}>No tokens yet. Generate one above to get started.</div>}
              {tokens.map(tk => (
                <div key={tk.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13.5}}>{tk.name}</div>
                    <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--mono)'}}>{tk.token.slice(0,8)}…{tk.token.slice(-4)} • Created {tk.created} • Last used {tk.lastUsed}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>copyToken(tk.token)}>Copy</button>
                  <button className="btn btn-danger-soft btn-sm" onClick={()=>{ if(confirm('Revoke "'+tk.name+'"?')) revokeToken(tk.id); }}><Icon name="trash" size={14}/></button>
                </div>
              ))}
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={()=>{ setManagingTokens(false); setRevealedToken(null); }}>Done</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

Object.assign(window, { Payments, Users, Groups, Notifications, Progress, Settings });
