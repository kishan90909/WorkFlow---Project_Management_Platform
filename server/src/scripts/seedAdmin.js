import "../config/env.js";
import { connectDatabase } from "../config/database.js";
import User from "../models/User.js";
import { ROLES } from "../constants/roles.js";

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error(
    "Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in server/.env.",
  );
}
await connectDatabase();
const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
if (existing) {
  console.log("Admin account already exists.");
} else {
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: ROLES.ADMIN,
  });
  console.log(`Admin account created: ${ADMIN_EMAIL}`);
}
process.exit(0);
