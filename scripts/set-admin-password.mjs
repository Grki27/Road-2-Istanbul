import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;
const allowedAdminEmails = (process.env.ALLOWED_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Nedostaju NEXT_PUBLIC_SUPABASE_URL ili SUPABASE_SERVICE_ROLE_KEY u .env.local.");
}

if (!adminEmail || !adminPassword) {
  throw new Error("Postavi ADMIN_EMAIL i ADMIN_PASSWORD prije pokretanja naredbe.");
}

if (!allowedAdminEmails.includes(adminEmail)) {
  throw new Error("ADMIN_EMAIL nije naveden u ALLOWED_ADMIN_EMAILS.");
}

if (adminPassword.length < 8) {
  throw new Error("Lozinka mora imati najmanje 8 znakova.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

let matchingUser = null;
let page = 1;

while (!matchingUser) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });

  if (error) {
    throw error;
  }

  matchingUser = data.users.find((user) => user.email?.toLowerCase() === adminEmail) ?? null;

  if (matchingUser || data.users.length < 100) {
    break;
  }

  page += 1;
}

if (matchingUser) {
  const { error } = await supabase.auth.admin.updateUserById(matchingUser.id, {
    password: adminPassword,
    email_confirm: true
  });

  if (error) {
    throw error;
  }

  console.log(`Lozinka je ažurirana za ${adminEmail}.`);
} else {
  const { error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true
  });

  if (error) {
    throw error;
  }

  console.log(`Admin korisnik ${adminEmail} je kreiran.`);
}
