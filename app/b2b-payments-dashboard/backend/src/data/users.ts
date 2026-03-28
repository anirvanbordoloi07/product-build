import bcrypt from "bcryptjs";
import type { User } from "../types/index";

export const users: User[] = [
  {
    id: "usr_cfo",
    email: "cfo@acme.com",
    name: "Marcus Reyes",
    role: "admin",
  },
  {
    id: "usr_controller",
    email: "controller@acme.com",
    name: "Diana Park",
    role: "finance_manager",
  },
  {
    id: "usr_sarah",
    email: "sarah.kim@acme.com",
    name: "Sarah Kim",
    role: "finance_manager",
    department: "Engineering",
  },
  {
    id: "usr_james",
    email: "james.patel@acme.com",
    name: "James Patel",
    role: "dept_owner",
    department: "Sales",
  },
  {
    id: "usr_priya",
    email: "priya.sharma@acme.com",
    name: "Priya Sharma",
    role: "dept_owner",
    department: "Marketing",
  },
  {
    id: "usr_derek",
    email: "derek.wang@acme.com",
    name: "Derek Wang",
    role: "dept_owner",
    department: "IT",
  },
  {
    id: "usr_tanya",
    email: "tanya.brooks@acme.com",
    name: "Tanya Brooks",
    role: "dept_owner",
    department: "HR",
  },
  {
    id: "usr_linda",
    email: "linda.zhou@acme.com",
    name: "Linda Zhou",
    role: "dept_owner",
    department: "Operations",
  },
  {
    id: "usr_audit",
    email: "auditor@pwc-external.com",
    name: "External Auditor (PwC)",
    role: "auditor",
  },
  {
    id: "usr_viewer",
    email: "viewer@acme.com",
    name: "Board Observer",
    role: "viewer",
  },
];

// Password map — bcrypt hashed at module init time.
// All demo users share the same password: "password123"
const DEMO_PASSWORD_HASH = bcrypt.hashSync("password123", 10);

export const userPasswords: Record<string, string> = {
  "cfo@acme.com": DEMO_PASSWORD_HASH,
  "controller@acme.com": DEMO_PASSWORD_HASH,
  "sarah.kim@acme.com": DEMO_PASSWORD_HASH,
  "james.patel@acme.com": DEMO_PASSWORD_HASH,
  "priya.sharma@acme.com": DEMO_PASSWORD_HASH,
  "derek.wang@acme.com": DEMO_PASSWORD_HASH,
  "tanya.brooks@acme.com": DEMO_PASSWORD_HASH,
  "linda.zhou@acme.com": DEMO_PASSWORD_HASH,
  "auditor@pwc-external.com": DEMO_PASSWORD_HASH,
  "viewer@acme.com": DEMO_PASSWORD_HASH,
};
