'use server';

import { sql, ensureDbCoherence } from '../../../utils/db';
import { createSession } from '../../../utils/auth';
import bcrypt from 'bcryptjs';

export async function authenticatePartner(email: string, password: string) {
  // Ensure DB migrations run safely on first connection
  await ensureDbCoherence();

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  if (!trimmedEmail || !trimmedPassword) {
    return { error: 'Please enter both your email and password.' };
  }

  try {
    // 1. Check if the database has any partners (Auto-seed capability)
    const countRes = await sql`SELECT COUNT(*)::int as count FROM partners`;
    const totalPartners = countRes[0]?.count || 0;

    if (totalPartners === 0) {
      // Direct Onboarding: Hash password and create a first Partner account
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(trimmedPassword, salt);
      const fallbackName = trimmedEmail.split('@')[0].toUpperCase();

      const newPartnerRes = await sql`
        INSERT INTO partners (email, password_hash, name)
        VALUES (${trimmedEmail}, ${hash}, ${fallbackName})
        RETURNING id, email
      `;

      const newPartner = newPartnerRes[0];
      await createSession(newPartner.id, newPartner.email);
      return { success: true, isNew: true };
    }

    // 2. Standard authentication lookup
    const partnerRes = await sql`
      SELECT * FROM partners WHERE email = ${trimmedEmail}
    `;

    if (partnerRes.length === 0) {
      return { error: 'No partner account exists with that email.' };
    }

    const partner = partnerRes[0];
    const isMatch = await bcrypt.compare(trimmedPassword, partner.password_hash);

    if (!isMatch) {
      return { error: 'Incorrect password. Please try again.' };
    }

    // 3. Set secure HTTP-only session cookies
    await createSession(partner.id, partner.email);
    return { success: true };
  } catch (err: any) {
    console.error('Authentication Server Action Error:', err);
    return { error: err.message || 'A database error occurred during login.' };
  }
}
