import { PrismaClient, Role, AbsenceStatus, PaymentPlanType, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

// ── Helpers ──
function getMonday(d: Date) {
  const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}
function dt(base: Date, dayOffset: number, h: number, m = 0) {
  const d = new Date(base); d.setDate(d.getDate() + dayOffset); d.setHours(h, m, 0, 0); return d;
}
const hash = (pw: string) => bcrypt.hash(pw, env.BCRYPT_SALT_ROUNDS);

// S8 CS & Cyber Security modules
const CS_S8_MODULES = [
  'Intro to AI',
  'Blockchain Technology',
  'DevSecOps',
  'Digital Forensics & Incident Management',
  'Lang & Comm 4',
  'NoSQL Database Security',
  'Distributed Applications',
];

async function main() {
  console.log('🌱 Starting EIDIA seed (clean — real accounts only)...\n');

  // ── Clean ──
  if (env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.notification.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.progress.deleteMany();
    await prisma.absence.deleteMany();
    await prisma.planning.deleteMany();
    await prisma.groupStudent.deleteMany();
    await prisma.user.deleteMany();
    await prisma.group.deleteMany();
    await prisma.module.deleteMany();
    await prisma.branch.deleteMany();
  }

  // ── 1. Branch ──
  console.log('🏢 Creating EIDIA branch...');
  const branch = await prisma.branch.create({
    data: { name: 'EIDIA', location: 'UEMF — Route de Meknès, Fès' },
  });

  // ── 2. Real EIDIA accounts only ──
  console.log('👤 Creating 5 real EIDIA accounts...');
  const realPw = await hash('CampusOps@2026');

  const admin = await prisma.user.create({
    data: { name: 'Hamza Khchinich', email: 'hamza.khchichine@eidia.ueuromed.org', passwordHash: realPw, role: Role.Admin, whatsappNumber: '+212660609941', branchId: branch.id },
  });
  const scolarite = await prisma.user.create({
    data: { name: 'Karima Ed Dahhak', email: 'karima.eddahhak@eidia.ueuromed.org', passwordHash: realPw, role: Role.Scolarite, whatsappNumber: '+212771493177', branchId: branch.id },
  });
  const enseignant = await prisma.user.create({
    data: { name: 'Imad Adnane', email: 'imad.adnane@eidia.ueuromed.org', passwordHash: realPw, role: Role.Enseignant, whatsappNumber: '+212611526620', branchId: branch.id },
  });
  const siham = await prisma.user.create({
    data: { name: 'Siham Lyzoul', email: 'siham.lyzoul@eidia.ueuromed.org', passwordHash: realPw, role: Role.Etudiant, whatsappNumber: '+212620407095', branchId: branch.id },
  });
  const brahim = await prisma.user.create({
    data: { name: 'Brahim Nakkar', email: 'brahim.nakkar@eidia.ueuromed.org', passwordHash: realPw, role: Role.Etudiant, whatsappNumber: '+212659756354', branchId: branch.id },
  });

  const students = [siham, brahim];
  console.log('   → 5 accounts created (password: CampusOps@2026)');

  // ── 3. Modules (S8 CS & Cyber Security) ──
  console.log('📚 Creating S8 modules...');
  const modules: { id: string; name: string }[] = [];
  for (const modName of CS_S8_MODULES) {
    const m = await prisma.module.create({
      data: { name: modName, description: 'CS & Cyber Security — Semester 8', branchId: branch.id },
    });
    modules.push({ id: m.id, name: modName });
  }
  console.log(`   → ${modules.length} modules created`);

  // ── 4. Group: CS-G1 ──
  console.log('🎓 Creating CS-G1 group...');
  const csG1 = await prisma.group.create({
    data: { name: 'CS-G1', academicYear: '2025/2026', branchId: branch.id },
  });

  // Enroll both students
  for (const s of students) {
    await prisma.groupStudent.create({ data: { groupId: csG1.id, studentId: s.id } });
  }
  console.log('   → 2 students enrolled in CS-G1');

  // ── 5. Planning (3 sessions/week for Imad Adnane) ──
  console.log('📅 Creating planning sessions...');
  const monday = getMonday(new Date());
  const sessions = [
    { mod: modules[0], day: 0, h: 8,  eh: 10, room: 'Amphi A' },      // Mon 8-10  Intro to AI
    { mod: modules[1], day: 2, h: 10, eh: 12, room: 'Salle B-204' },   // Wed 10-12 Blockchain
    { mod: modules[2], day: 4, h: 14, eh: 16, room: 'Lab Cyber' },     // Fri 14-16 DevSecOps
  ];

  const createdSessions: { id: string }[] = [];
  for (const s of sessions) {
    const sess = await prisma.planning.create({
      data: {
        moduleId: s.mod.id, groupId: csG1.id, teacherId: enseignant.id,
        room: s.room,
        startTime: dt(monday, s.day, s.h),
        endTime: dt(monday, s.day, s.eh),
      },
    });
    createdSessions.push(sess);
  }
  console.log(`   → ${createdSessions.length} sessions created`);

  // ── 6. Absences ──
  console.log('✍️  Creating absence records...');
  const statuses: AbsenceStatus[] = [AbsenceStatus.Present, AbsenceStatus.Present, AbsenceStatus.Late];
  let absCount = 0;
  for (let i = 0; i < createdSessions.length; i++) {
    for (let j = 0; j < students.length; j++) {
      await prisma.absence.create({
        data: { sessionId: createdSessions[i].id, studentId: students[j].id, status: statuses[(i + j) % 3] },
      });
      absCount++;
    }
  }
  console.log(`   → ${absCount} absence records`);

  // ── 7. Payments (Inscription + Mensualité per student) ──
  console.log('💸 Creating payments...');
  const lastMonth = new Date(); lastMonth.setMonth(lastMonth.getMonth() - 1);
  const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);

  for (const s of students) {
    await prisma.payment.createMany({
      data: [
        { studentId: s.id, planType: PaymentPlanType.Inscription, amount: 45000.00, status: PaymentStatus.Paid, dueDate: lastMonth },
        { studentId: s.id, planType: PaymentPlanType.Mensualite, amount: 5000.00, status: PaymentStatus.Unpaid, dueDate: nextMonth },
      ],
    });
  }
  console.log(`   → ${students.length * 2} payments`);

  // ── 8. Progress ──
  console.log('📈 Creating progress tracking...');
  for (const mod of modules.slice(0, 3)) {
    await prisma.progress.create({
      data: { moduleId: mod.id, groupId: csG1.id, percentage: 30 + Math.floor(Math.random() * 40), lastUpdatedById: enseignant.id },
    });
  }

  // ── 9. Notifications ──
  console.log('🔔 Creating notifications...');
  await prisma.notification.createMany({
    data: [
      { userId: admin.id, title: 'Bienvenue sur CampusOps', content: 'Le système est opérationnel pour l\'année 2025/2026.', type: 'success' },
      { userId: siham.id, title: 'Paiement en attente', content: 'Votre mensualité de 5 000 MAD est due le mois prochain.', type: 'alert' },
      { userId: enseignant.id, title: 'Sessions planifiées', content: 'Vos 3 sessions S8 CS & Cyber Security sont programmées cette semaine.', type: 'info' },
      { userId: scolarite.id, title: 'Nouveau semestre', content: 'Les modules S8 sont maintenant disponibles.', type: 'info' },
    ],
  });

  console.log('\n✅ EIDIA seed complete!');
  console.log('   Branch: 1 (EIDIA) | Users: 5 | Group: CS-G1 | Students: 2');
  console.log(`   Modules: ${modules.length} | Sessions: ${createdSessions.length} | Absences: ${absCount}`);
  console.log(`   Payments: ${students.length * 2} | Notifications: 4`);
  console.log('\n   All accounts (password: CampusOps@2026):');
  console.log('     • hamza.khchichine@eidia.ueuromed.org  [Admin]');
  console.log('     • karima.eddahhak@eidia.ueuromed.org   [Scolarite]');
  console.log('     • imad.adnane@eidia.ueuromed.org       [Enseignant]');
  console.log('     • siham.lyzoul@eidia.ueuromed.org      [Etudiant]');
  console.log('     • brahim.nakkar@eidia.ueuromed.org     [Etudiant]');
}

main()
  .catch((e) => { console.error('❌ Error seeding:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
