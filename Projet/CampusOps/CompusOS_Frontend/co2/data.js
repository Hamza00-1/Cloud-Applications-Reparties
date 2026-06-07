// CampusOps — mock data (cleaned: no emojis, realistic numbers)
const ROLES = {
  admin:      { id:'admin',      label:'Administrator', name:'Hamza Khchinich',     email:'hamza.khchichine@eidia.ueuromed.org',    color:'#5FA83C' },
  scolarite:  { id:'scolarite',  label:'Scolarité',     name:'Karima Ed Dahhak',    email:'karima.eddahhak@eidia.ueuromed.org', color:'#7C3AED' },
  enseignant: { id:'enseignant', label:'Enseignant',    name:'Imad Adnane', email:'imad.adnane@eidia.ueuromed.org', color:'#7CB342', field:'CS & Cyber Security' },
  etudiant:   { id:'etudiant',   label:'Étudiant',      name:'Siham Lyzoul',     email:'siham.lyzoul@eidia.ueuromed.org',  color:'#F59E0B', group:'CS-G1' },
};

// Lucide-style stroke icons (kept as svg paths; no emoji)
const ICONS = {
  dashboard:'<path d="M3 12l9-9 9 9M5 10v10h14V10" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  planning: '<rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  absences: '<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  modules:  '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  grades:   '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  progress: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
  payments: '<rect x="2" y="6" width="20" height="13" rx="2" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M2 10h20" stroke="currentColor" stroke-width="1.7"/>',
  users:    '<circle cx="9" cy="8" r="4" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7M17 11h5M19.5 8.5v5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
  groups:   '<circle cx="9" cy="8" r="3.5" stroke="currentColor" stroke-width="1.7" fill="none"/><circle cx="17" cy="9" r="2.5" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5M15 20c0-2 2-3.5 4.5-3.5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
  branches: '<path d="M12 2L3 7l9 5 9-5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>',
  notifications: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 01-4 0" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  settings: '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 005 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 5a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09A1.65 1.65 0 0015 5a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  search:   '<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  bell:     '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 01-4 0" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  sun:      '<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  moon:     '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>',
  close:    '<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  check:    '<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  alert:    '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  info:     '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  clock:    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
  lock:     '<rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" stroke-width="1.7" fill="none"/>',
  palette:  '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" fill="none"/><circle cx="7.5" cy="10.5" r="1.2" fill="currentColor"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/><circle cx="16.5" cy="10.5" r="1.2" fill="currentColor"/><circle cx="14.5" cy="15" r="1.2" fill="currentColor"/>',
  device:   '<rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  edit:     '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  trash:    '<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
  eye:      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.7" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7" fill="none"/>',
  plus:     '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  logout:   '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  chevron:  '<path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
};

const NAV_GROUPS = [
  { label:'Academic', items:[
    { id:'dashboard',     label:'Dashboard',     icon:'dashboard', roles:['admin','scolarite','enseignant','etudiant'] },
    { id:'planning',      label:'Planning',      icon:'planning',  roles:['admin','scolarite','enseignant','etudiant'] },
    { id:'absences',      label:'Attendance',    icon:'absences',  roles:['admin','scolarite','enseignant','etudiant'] },
    { id:'modules',       label:'Modules',       icon:'modules',   roles:['admin','scolarite','enseignant','etudiant'] },
    { id:'grades',        label:'Grades',        icon:'grades',    roles:['admin','scolarite','enseignant','etudiant'] },
  ]},
  { label:'Personal', items:[
    { id:'progress',      label:'Progress',      icon:'progress',  roles:['admin','scolarite','enseignant','etudiant'] },
    { id:'payments',      label:'Payments',      icon:'payments',  roles:['admin','scolarite','etudiant'] },
  ]},
  { label:'Administration', items:[
    { id:'users',         label:'Users',         icon:'users',     roles:['admin'] },
    { id:'groups',        label:'Groups',        icon:'groups',    roles:['admin','scolarite'] },
    { id:'branches',      label:'Branches',      icon:'branches',  roles:['admin'] },
    { id:'notifications', label:'Notifications', icon:'notifications', roles:['admin','scolarite','enseignant','etudiant'] },
  ]},
];

const MODULES = [
  { code:'S8-01', name:'Intro to AI',                          color:'#5FA83C', teacher:'Prof. Karim Mansouri' },
  { code:'S8-02', name:'Distributed Applications',             color:'#7CB342', teacher:'Prof. Karim Mansouri' },
  { code:'S8-03', name:'Lang & Comm 4',                        color:'#7C3AED', teacher:'Prof. Karim Mansouri' },
  { code:'S8-04', name:'Digital Forensics & Incident Management', color:'#F59E0B', teacher:'Prof. Karim Mansouri' },
  { code:'S8-05', name:'NoSQL Database Security',              color:'#DC2626', teacher:'Prof. Karim Mansouri' },
  { code:'S8-06', name:'Blockchain Technology',                color:'#0891B2', teacher:'Prof. Karim Mansouri' },
  { code:'S8-07', name:'DevSecOps',                            color:'#DB2777', teacher:'Prof. Karim Mansouri' },
];

const GROUPS_LIST = [
  { id:'CS-G1', name:'CS-G1', branch:'EIDIA', students:2, year:'2025/2026' },
];

const BRANCHES = [
  { code:'EIDIA', name:'EIDIA', head:'Hamza Khchinich', students:2, groups:1, color:'#5FA83C', founded:2020, faculty:1, description:'École d\'Ingénierie Digitale et d\'Intelligence Artificielle — CS & Cyber Security.' },
];

const STUDENTS = [
  { id:'S-01', name:'Siham Lyzoul',  group:'CS-G1', avg:15.4, att:94, status:'active', init:'SL', color:'#0891B2' },
  { id:'S-02', name:'Brahim Nakkar', group:'CS-G1', avg:14.8, att:91, status:'active', init:'BN', color:'#DB2777' },
];

const PAYMENTS = [
  { id:'INV-001', student:'Siham Lyzoul',  group:'CS-G1', type:'Inscription', amount:45000, status:'paid',   date:'2025-04-15', method:'Card' },
  { id:'INV-002', student:'Siham Lyzoul',  group:'CS-G1', type:'Mensualité',  amount:5000,  status:'unpaid', date:'2025-06-15', method:'—' },
  { id:'INV-003', student:'Brahim Nakkar', group:'CS-G1', type:'Inscription', amount:45000, status:'paid',   date:'2025-04-15', method:'Bank transfer' },
  { id:'INV-004', student:'Brahim Nakkar', group:'CS-G1', type:'Mensualité',  amount:5000,  status:'unpaid', date:'2025-06-15', method:'—' },
];

const SESSIONS = [
  { day:0, start:8,  dur:2, mod:'Intro to AI',          grp:'CS-G1', room:'Amphi A',     teacher:'Imad Adnane' },
  { day:2, start:10, dur:2, mod:'Blockchain Technology', grp:'CS-G1', room:'Salle B-204', teacher:'Imad Adnane' },
  { day:4, start:14, dur:2, mod:'DevSecOps',             grp:'CS-G1', room:'Lab Cyber',   teacher:'Imad Adnane' },
];

const NOTIFICATIONS = [
  { id:1, type:'success',  title:'Bienvenue sur CampusOps',     desc:'Le système est opérationnel pour l\'année 2025/2026. Toutes les filières EIDIA sont configurées.', time:'Today', read:false },
  { id:2, type:'alert',    title:'Paiement en attente',         desc:'Mensualité de 5 000 MAD due le mois prochain.', time:'Today', read:false },
  { id:3, type:'info',     title:'Sessions planifiées',         desc:'Les sessions S8 pour CS & Cyber Security sont programmées cette semaine.', time:'Today', read:false },
  { id:4, type:'reminder', title:'Rappel de saisie',            desc:'Veuillez mettre à jour la progression du module NLP pour AI-G1 et AI-G2.', time:'Today', read:true },
  { id:5, type:'info',     title:'Nouveau semestre',            desc:'Les modules S8 Full Stack sont maintenant disponibles dans le planning.', time:'Today', read:true },
];

const USERS_LIST = [
  { id:'U-001', name:'Hamza Khchinich',  role:'admin',      email:'hamza.khchichine@eidia.ueuromed.org', branch:'EIDIA', status:'active', init:'HK', color:'#5FA83C' },
  { id:'U-002', name:'Karima Ed Dahhak', role:'scolarite',  email:'karima.eddahhak@eidia.ueuromed.org',  branch:'EIDIA', status:'active', init:'KE', color:'#7C3AED' },
  { id:'U-003', name:'Imad Adnane',      role:'enseignant', email:'imad.adnane@eidia.ueuromed.org',      branch:'EIDIA', status:'active', init:'IA', color:'#7CB342' },
  { id:'U-004', name:'Siham Lyzoul',     role:'etudiant',   email:'siham.lyzoul@eidia.ueuromed.org',     branch:'EIDIA', status:'active', init:'SL', color:'#F59E0B' },
  { id:'U-005', name:'Brahim Nakkar',    role:'etudiant',   email:'brahim.nakkar@eidia.ueuromed.org',    branch:'EIDIA', status:'active', init:'BN', color:'#0891B2' },
];

// Scolarité dashboard stats — derived from real EIDIA seed
const SCOLARITE_STATS = {
  totalStudents:    2,
  totalGroups:      1,
  attendanceRate:   92.5,
  collectionRate:   50.0,
  pendingPayments:  2,
  activeRequests:   0,
};

// Student grades — S8 CS & Cyber Security modules
const STUDENT_GRADES = [
  { module:'S8-01', name:'Intro to AI',                          exam:15.0, hw:16, participation:14, average:15.0 },
  { module:'S8-02', name:'Distributed Applications',             exam:14.5, hw:15, participation:13, average:14.2 },
  { module:'S8-03', name:'Lang & Comm 4',                        exam:16.0, hw:17, participation:16, average:16.3 },
  { module:'S8-04', name:'Digital Forensics & Incident Management', exam:13.5, hw:14, participation:12, average:13.2 },
  { module:'S8-05', name:'NoSQL Database Security',              exam:15.5, hw:16, participation:15, average:15.5 },
  { module:'S8-06', name:'Blockchain Technology',                exam:14.0, hw:15, participation:14, average:14.3 },
  { module:'S8-07', name:'DevSecOps',                            exam:16.5, hw:17, participation:16, average:16.5 },
];

// Per-period averages for student dashboard chart
const STUDENT_GRADE_HISTORY = {
  labels:['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'],
  series:[
    { module:'Intro to AI',     color:'#5FA83C', values:[13.0, 13.5, 14.0, 14.5, 14.8, 15.0, 15.0, 15.2] },
    { module:'Distributed Apps', color:'#7C3AED', values:[12.5, 13.0, 13.5, 13.8, 14.0, 14.2, 14.2, 14.5] },
    { module:'Lang & Comm 4',    color:'#F59E0B', values:[15.0, 15.5, 15.8, 16.0, 16.2, 16.3, 16.3, 16.5] },
    { module:'DevSecOps',        color:'#0891B2', values:[14.5, 15.0, 15.5, 15.8, 16.0, 16.3, 16.5, 16.7] },
  ],
};

// i18n strings
const I18N = {
  en: {
    'app.brand':'CampusOps','app.tagline':'University OS',
    'nav.Dashboard':'Dashboard','nav.Planning':'Planning','nav.Attendance':'Attendance','nav.Modules':'Modules',
    'nav.Grades':'Grades','nav.Progress':'Progress','nav.Payments':'Payments','nav.Users':'Users','nav.Groups':'Groups',
    'nav.Branches':'Branches','nav.Notifications':'Notifications','nav.Settings':'Settings','nav.Academic':'Academic','nav.Personal':'Personal','nav.Administration':'Administration',
    'tb.search':'Search students, groups, modules…','tb.profile':'Profile','tb.settings':'Settings','tb.logout':'Sign out','tb.notifications':'Notifications',
    'btn.viewAll':'View all','btn.markAllRead':'Mark all read','btn.viewDetails':'View details','btn.edit':'Edit','btn.save':'Save changes','btn.cancel':'Cancel','btn.close':'Close','btn.create':'Create','btn.delete':'Delete','btn.export':'Export','btn.filter':'Filter','btn.today':'Today',
    'view.day':'Day','view.week':'Week','view.month':'Month',
    'att.present':'Present','att.late':'Late','att.absent':'Absent','att.excused':'Excused',
    'pay.paid':'Paid','pay.pending':'Pending','pay.overdue':'Overdue','pay.partial':'Partial',
    'set.account':'Account','set.security':'Security','set.appearance':'Appearance','set.notifications':'Notifications','set.sessions':'Sessions','set.language':'Language',
    'set.lightMode':'Light','set.darkMode':'Dark','set.system':'System',
    'set.changePassword':'Change password','set.2fa':'Two-factor authentication','set.activeSessions':'Active sessions','set.signOutAll':'Sign out everywhere',
    'grade.viewOnly':'You have view-only access. Grades are managed by teachers.',
    'grade.exam':'Exam','grade.homework':'Homework','grade.participation':'Participation','grade.average':'Average','grade.overall':'Overall average','grade.module':'Module',
    'login.signIn':'Sign in','login.email':'Email','login.password':'Password','login.role':'Role','login.welcome':'Welcome back',
  },
  fr: {
    'app.brand':'CampusOps','app.tagline':'OS Universitaire',
    'nav.Dashboard':'Tableau de bord','nav.Planning':'Planning','nav.Attendance':'Présences','nav.Modules':'Modules',
    'nav.Grades':'Notes','nav.Progress':'Progression','nav.Payments':'Paiements','nav.Users':'Utilisateurs','nav.Groups':'Groupes',
    'nav.Branches':'Filières','nav.Notifications':'Notifications','nav.Settings':'Paramètres','nav.Academic':'Académique','nav.Personal':'Personnel','nav.Administration':'Administration',
    'tb.search':'Rechercher étudiants, groupes, modules…','tb.profile':'Profil','tb.settings':'Paramètres','tb.logout':'Déconnexion','tb.notifications':'Notifications',
    'btn.viewAll':'Tout voir','btn.markAllRead':'Tout marquer lu','btn.viewDetails':'Voir détails','btn.edit':'Modifier','btn.save':'Enregistrer','btn.cancel':'Annuler','btn.close':'Fermer','btn.create':'Créer','btn.delete':'Supprimer','btn.export':'Exporter','btn.filter':'Filtrer','btn.today':'Aujourd\'hui',
    'view.day':'Jour','view.week':'Semaine','view.month':'Mois',
    'att.present':'Présent','att.late':'Retard','att.absent':'Absent','att.excused':'Excusé',
    'pay.paid':'Payé','pay.pending':'En attente','pay.overdue':'En retard','pay.partial':'Partiel',
    'set.account':'Compte','set.security':'Sécurité','set.appearance':'Apparence','set.notifications':'Notifications','set.sessions':'Sessions','set.language':'Langue',
    'set.lightMode':'Clair','set.darkMode':'Sombre','set.system':'Système',
    'set.changePassword':'Changer le mot de passe','set.2fa':'Authentification à deux facteurs','set.activeSessions':'Sessions actives','set.signOutAll':'Déconnecter partout',
    'grade.viewOnly':'Accès en lecture seule. Les notes sont gérées par les enseignants.',
    'grade.exam':'Examen','grade.homework':'Devoirs','grade.participation':'Participation','grade.average':'Moyenne','grade.overall':'Moyenne générale','grade.module':'Module',
    'login.signIn':'Se connecter','login.email':'Email','login.password':'Mot de passe','login.role':'Rôle','login.welcome':'Bon retour',
  }
};

// i18n hook + helpers
function useI18n(){
  const [lang, setLangState] = React.useState(()=> localStorage.getItem('co2_lang') || 'en');
  React.useEffect(()=>{
    const onChange = ()=> setLangState(localStorage.getItem('co2_lang') || 'en');
    window.addEventListener('co2_lang_change', onChange);
    return ()=> window.removeEventListener('co2_lang_change', onChange);
  },[]);
  const setLang = (l)=> { localStorage.setItem('co2_lang', l); window.dispatchEvent(new Event('co2_lang_change')); };
  const t = (key, fallback)=> (I18N[lang] && I18N[lang][key]) || fallback || key;
  return { lang, setLang, t };
}

function Icon({ name, size }){
  const path = ICONS[name];
  if(!path) return null;
  return <svg width={size||18} height={size||18} viewBox="0 0 24 24" dangerouslySetInnerHTML={{__html:path}} />;
}

Object.assign(window, { ROLES, ICONS, NAV_GROUPS, MODULES, GROUPS_LIST, BRANCHES, STUDENTS, PAYMENTS, SESSIONS, NOTIFICATIONS, USERS_LIST, SCOLARITE_STATS, STUDENT_GRADES, STUDENT_GRADE_HISTORY, I18N, useI18n, Icon });
