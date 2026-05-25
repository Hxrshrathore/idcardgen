'use server';

import { sql, ensureDbCoherence } from '../../../utils/db';

export async function getSchoolDetails(slug: string) {
  await ensureDbCoherence();
  try {
    const slugLower = slug.trim().toLowerCase();
    const result = await sql`
      SELECT id, name, slug, branding_logo, color_theme, template, qr_type, lanyard_text, lanyard_color, lanyard_text_color
      FROM schools 
      WHERE slug = ${slugLower}
    `;
    
    if (result.length === 0) {
      return null;
    }
    return result[0] as {
      id: string;
      name: string;
      slug: string;
      branding_logo: string | null;
      color_theme: string;
      template: string;
      qr_type: string;
      lanyard_text: string | null;
      lanyard_color: string | null;
      lanyard_text_color: string | null;
    };
  } catch (err) {
    console.error('Error fetching school details:', err);
    return null;
  }
}

export async function submitStudentData(schoolId: string, data: {
  name: string;
  idNumber: string;
  grade: string;
  role: string;
  email?: string;
  phone?: string;
  bloodGroup?: string;
  issueDate?: string;
  expiryDate?: string;
  avatarUrl?: string;
  thumbnailUrl?: string;
  signatureUrl?: string;
}) {
  await ensureDbCoherence();
  try {
    const trimmedId = data.idNumber.trim().toUpperCase();
    
    // Check duplicates instantly using O(1) B-Tree unique index constraint
    const duplicate = await sql`
      SELECT id FROM students 
      WHERE school_id = ${schoolId} AND id_number = ${trimmedId}
    `;
    
    if (duplicate.length > 0) {
      return { error: `A student with ID "${trimmedId}" is already registered at this school.` };
    }
    
    const adjustments = { zoom: 1, x: 0, y: 0, rotate: 0, brightness: 100, contrast: 100 };
    
    const nameUpper = data.name.trim().toUpperCase();
    const gradeUpper = data.grade.trim().toUpperCase();
    const roleUpper = data.role.trim().toUpperCase();
    const emailUpper = data.email?.trim().toUpperCase() || null;
    const phoneTrimmed = data.phone?.trim() || null;
    const bloodGroupUpper = data.bloodGroup?.trim().toUpperCase() || 'O+';
    const issueDateTrimmed = data.issueDate?.trim() || '04/2025';
    const expiryDateTrimmed = data.expiryDate?.trim() || '03/2026';
    const avatar = data.avatarUrl || null;
    const thumbnail = data.thumbnailUrl || null;
    const signature = data.signatureUrl || null;
    const adjustmentsStr = JSON.stringify(adjustments);

    await sql`
      INSERT INTO students (
        school_id, name, id_number, grade, role, email, phone, blood_group, 
        issue_date, expiry_date, avatar_url, thumbnail_url, signature_url, image_adjustments, status
      ) VALUES (
        ${schoolId}, 
        ${nameUpper}, 
        ${trimmedId}, 
        ${gradeUpper}, 
        ${roleUpper}, 
        ${emailUpper}, 
        ${phoneTrimmed}, 
        ${bloodGroupUpper}, 
        ${issueDateTrimmed}, 
        ${expiryDateTrimmed}, 
        ${avatar}, 
        ${thumbnail}, 
        ${signature}, 
        ${adjustmentsStr}::jsonb, 
        'pending'
      )
    `;
    
    return { success: true };
  } catch (err: any) {
    console.error('Error saving student data:', err);
    return { error: err.message || 'Failed to submit student record.' };
  }
}
