import User from "../model/User";
import bcrypt from "bcrypt";

export default async function ensureAdminSeed() {
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  if (!adminUser || !adminPass) return;

  const existing = await User.findOne({ username: adminUser }).lean();
  if (existing) return;

  const passwordHash = await bcrypt.hash(adminPass, 10);
  await User.create({ username: adminUser, passwordHash, role: 'admin' });
  console.log('Seeded admin user:', adminUser);
}
