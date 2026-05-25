'use server';

import { sql } from '../../../utils/db';
import { getSession } from '../../../utils/auth';
import { revalidatePath } from 'next/cache';

// Helper to assert authentication
async function assertAuth() {
  const session = await getSession();
  if (!session || !session.partnerId) {
    throw new Error('Unauthorized access. Please log in.');
  }
  return session;
}

// Helper to assert school ownership
async function assertSchoolOwnership(schoolId: string, partnerId: string) {
  const schoolRes = await sql`
    SELECT id FROM schools WHERE id = ${schoolId} AND partner_id = ${partnerId}
  `;
  if (schoolRes.length === 0) {
    throw new Error('Forbidden. You do not own this school portal.');
  }
}

export async function getPartnerDetails() {
  const session = await assertAuth();
  const partnerRes = await sql`
    SELECT id, email, name FROM partners WHERE id = ${session.partnerId}
  `;
  if (partnerRes.length === 0) {
    throw new Error('Partner not found.');
  }
  return partnerRes[0];
}

export async function getPartnerSchools() {
  const session = await assertAuth();
  return sql`
    SELECT * FROM schools 
    WHERE partner_id = ${session.partnerId} 
    ORDER BY created_at DESC
  `;
}

export async function createSchool(formData: {
  name: string;
  slug: string;
  branding_logo: string | null;
  color_theme: string;
  template: string;
  qr_type: string;
  lanyard_text: string | null;
  lanyard_color: string | null;
  lanyard_text_color: string | null;
}) {
  const session = await assertAuth();
  
  const trimmedName = formData.name.trim();
  const slug = formData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
  if (!trimmedName || !slug) {
    return { error: 'School Name and Unique Link (slug) are required.' };
  }

  try {
    // Check if slug is unique
    const existing = await sql`
      SELECT id FROM schools WHERE slug = ${slug}
    `;
    if (existing.length > 0) {
      return { error: 'The unique link (slug) is already in use by another school portal.' };
    }

    await sql`
      INSERT INTO schools (
        partner_id, name, slug, branding_logo, color_theme, 
        template, qr_type, lanyard_text, lanyard_color, lanyard_text_color
      )
      VALUES (
        ${session.partnerId}, ${trimmedName}, ${slug}, ${formData.branding_logo}, ${formData.color_theme},
        ${formData.template}, ${formData.qr_type}, ${formData.lanyard_text}, ${formData.lanyard_color}, ${formData.lanyard_text_color}
      )
    `;

    revalidatePath('/partner/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('Create school error:', err);
    return { error: err.message || 'Failed to create school portal.' };
  }
}

export async function getSchoolStudents(schoolId: string) {
  const session = await assertAuth();
  await assertSchoolOwnership(schoolId, session.partnerId);

  // Return student lists. Fetching thumbnail_url and image_adjustments to allow rapid rendering
  return sql`
    SELECT * FROM students 
    WHERE school_id = ${schoolId} 
    ORDER BY created_at DESC
  `;
}

export async function updateStudentAdjustments(
  studentId: string, 
  adjustments: {
    zoom: number;
    x: number;
    y: number;
    rotate: number;
    brightness: number;
    contrast: number;
  }
) {
  const session = await assertAuth();
  
  // Verify student belongs to partner
  const studentCheck = await sql`
    SELECT s.id, s.school_id 
    FROM students s
    JOIN schools sc ON s.school_id = sc.id
    WHERE s.id = ${studentId} AND sc.partner_id = ${session.partnerId}
  `;

  if (studentCheck.length === 0) {
    throw new Error('Forbidden. Student record not found or inaccessible.');
  }

  try {
    const adjustmentsJson = JSON.stringify(adjustments);
    await sql`
      UPDATE students 
      SET image_adjustments = ${adjustmentsJson}::jsonb, updated_at = now()
      WHERE id = ${studentId}
    `;
    return { success: true };
  } catch (err: any) {
    console.error('Update adjustments error:', err);
    return { error: err.message || 'Failed to update student image adjustments.' };
  }
}

export async function updateStudentStatus(studentId: string, status: string) {
  const session = await assertAuth();

  const studentCheck = await sql`
    SELECT s.id, s.school_id 
    FROM students s
    JOIN schools sc ON s.school_id = sc.id
    WHERE s.id = ${studentId} AND sc.partner_id = ${session.partnerId}
  `;

  if (studentCheck.length === 0) {
    throw new Error('Forbidden. Student record not found or inaccessible.');
  }

  try {
    await sql`
      UPDATE students 
      SET status = ${status}, updated_at = now()
      WHERE id = ${studentId}
    `;
    return { success: true };
  } catch (err: any) {
    console.error('Update status error:', err);
    return { error: err.message || 'Failed to update student card status.' };
  }
}

export async function deleteStudent(studentId: string) {
  const session = await assertAuth();

  const studentCheck = await sql`
    SELECT s.id, s.school_id 
    FROM students s
    JOIN schools sc ON s.school_id = sc.id
    WHERE s.id = ${studentId} AND sc.partner_id = ${session.partnerId}
  `;

  if (studentCheck.length === 0) {
    throw new Error('Forbidden. Student record not found or inaccessible.');
  }

  try {
    await sql`
      DELETE FROM students WHERE id = ${studentId}
    `;
    return { success: true };
  } catch (err: any) {
    console.error('Delete student error:', err);
    return { error: err.message || 'Failed to delete student.' };
  }
}

export async function deleteSchool(schoolId: string) {
  const session = await assertAuth();
  await assertSchoolOwnership(schoolId, session.partnerId);

  try {
    await sql`
      DELETE FROM schools WHERE id = ${schoolId}
    `;
    revalidatePath('/partner/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('Delete school error:', err);
    return { error: err.message || 'Failed to delete school portal.' };
  }
}

export async function logoutPartner() {
  const { destroySession } = await import('../../../utils/auth');
  await destroySession();
  return { success: true };
}
