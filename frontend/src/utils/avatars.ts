/**
 * User & Patient Avatars Library for Care Compass
 * Provides high-fidelity, diverse profile images for healthcare staff, CHWs, patients, and supervisors.
 */

export interface AvatarOption {
  id: string;
  label: string;
  role: string;
  url: string;
}

// Curated high-resolution professional healthcare and patient portraits
export const AVATAR_PRESETS = {
  // CHW Staff
  chw_john: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=256&h=256&q=80', // Male doctor/CHW smiling
  chw_aisha: 'https://images.unsplash.com/photo-1594824813501-4834ff24a35f?auto=format&fit=crop&w=256&h=256&q=80', // Female healthcare worker in scrubs
  chw_emmanuel: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&h=256&q=80', // Male healthcare clinician
  chw_meilin: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&h=256&q=80', // Female Asian doctor / CHW
  chw_david: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=256&h=256&q=80', // Male doctor with stethoscope
  chw_zainab: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80', // Female medical professional

  // Supervisors & Leadership
  sup_amara: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=256&h=256&q=80', // Senior clinical supervisor female
  sup_sarah: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=256&h=256&q=80', // Senior nurse supervisor female

  // Programme Managers & Regional Admins
  mgr_daniel: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80', // Professional programme manager male
  admin_rachel: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=256&h=256&q=80', // Regional admin female
  admin_super: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80', // Super administrator

  // Patients
  pat_maria: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80', // Young adult female (Maternal ANC)
  pat_ahmed: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=256&h=256&q=80', // Young boy (Pediatric illness)
  pat_priya: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80', // Adult female (Chronic care)
  pat_james: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80', // Elderly male (Geriatric care)
  pat_fatima: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80', // Maternal female
  pat_carlos: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80', // Adult male
  pat_amina: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=256&h=256&q=80', // Adult female
};

// Gallery of selectable avatar options for User Profile customization
export const DEFAULT_AVATARS_GALLERY: AvatarOption[] = [
  { id: 'chw_john', label: 'Field CHW (John)', role: 'Community Health Worker', url: AVATAR_PRESETS.chw_john },
  { id: 'chw_aisha', label: 'Field Specialist (Aisha)', role: 'Maternal Health CHW', url: AVATAR_PRESETS.chw_aisha },
  { id: 'chw_emmanuel', label: 'Clinical Field Lead (Emmanuel)', role: 'Senior Field CHW', url: AVATAR_PRESETS.chw_emmanuel },
  { id: 'chw_meilin', label: 'Pediatric Specialist (Mei Lin)', role: 'Pediatric CHW', url: AVATAR_PRESETS.chw_meilin },
  { id: 'sup_amara', label: 'Clinical Supervisor (Amara)', role: 'Clinical Supervisor', url: AVATAR_PRESETS.sup_amara },
  { id: 'mgr_daniel', label: 'Programme Lead (Daniel)', role: 'Programme Manager', url: AVATAR_PRESETS.mgr_daniel },
  { id: 'admin_rachel', label: 'Regional Director (Rachel)', role: 'Regional Admin', url: AVATAR_PRESETS.admin_rachel },
  { id: 'admin_super', label: 'System Executive (Admin)', role: 'Super Admin', url: AVATAR_PRESETS.admin_super },
  { id: 'chw_david', label: 'Outreach Medic (David)', role: 'Community Medic', url: AVATAR_PRESETS.chw_david },
  { id: 'chw_zainab', label: 'Family Wellness (Zainab)', role: 'Field Health Worker', url: AVATAR_PRESETS.chw_zainab },
];

/**
 * Returns a corresponding avatar URL based on the user's name, email, or role
 */
export const getAvatarForUser = (userOrName: string | { name?: string; email?: string; role?: string; avatar?: string }): string => {
  if (!userOrName) return AVATAR_PRESETS.chw_john;

  // If user object has a custom avatar or uploaded photo, prioritize it
  if (typeof userOrName === 'object') {
    if (userOrName.avatar) return userOrName.avatar;
    const email = (userOrName.email || '').toLowerCase();
    const name = (userOrName.name || '').toLowerCase();
    const role = (userOrName.role || '').toUpperCase();

    if (email.includes('chw') || name.includes('john smith')) return AVATAR_PRESETS.chw_john;
    if (email.includes('supervisor') || name.includes('amara') || name.includes('okafor')) return AVATAR_PRESETS.sup_amara;
    if (email.includes('manager') || name.includes('daniel') || name.includes('whitfield')) return AVATAR_PRESETS.mgr_daniel;
    if (email.includes('regional') || name.includes('rachel') || name.includes('summers')) return AVATAR_PRESETS.admin_rachel;
    if (email.includes('admin') || role.includes('SUPER_ADMIN')) return AVATAR_PRESETS.admin_super;

    if (name.includes('aisha')) return AVATAR_PRESETS.chw_aisha;
    if (name.includes('emmanuel')) return AVATAR_PRESETS.chw_emmanuel;
    if (name.includes('mei lin') || name.includes('chen')) return AVATAR_PRESETS.chw_meilin;
    if (name.includes('david')) return AVATAR_PRESETS.chw_david;
    if (name.includes('zainab')) return AVATAR_PRESETS.chw_zainab;

    // Role-based fallbacks
    if (role === 'SUPERVISOR') return AVATAR_PRESETS.sup_amara;
    if (role === 'PROGRAMME_MANAGER' || role === 'MANAGER') return AVATAR_PRESETS.mgr_daniel;
    if (role === 'REGIONAL_ADMIN') return AVATAR_PRESETS.admin_rachel;
    if (role === 'SUPER_ADMIN') return AVATAR_PRESETS.admin_super;
    return AVATAR_PRESETS.chw_john;
  }

  const nameStr = userOrName.toLowerCase();
  if (nameStr.includes('john') || nameStr.includes('smith')) return AVATAR_PRESETS.chw_john;
  if (nameStr.includes('aisha') || nameStr.includes('patel')) return AVATAR_PRESETS.chw_aisha;
  if (nameStr.includes('emmanuel') || nameStr.includes('diaz')) return AVATAR_PRESETS.chw_emmanuel;
  if (nameStr.includes('mei lin') || nameStr.includes('chen')) return AVATAR_PRESETS.chw_meilin;
  if (nameStr.includes('david') || nameStr.includes('mensah')) return AVATAR_PRESETS.chw_david;
  if (nameStr.includes('zainab') || nameStr.includes('omar')) return AVATAR_PRESETS.chw_zainab;
  if (nameStr.includes('amara') || nameStr.includes('okafor')) return AVATAR_PRESETS.sup_amara;
  if (nameStr.includes('daniel') || nameStr.includes('whitfield')) return AVATAR_PRESETS.mgr_daniel;
  if (nameStr.includes('rachel') || nameStr.includes('summers')) return AVATAR_PRESETS.admin_rachel;
  if (nameStr.includes('admin')) return AVATAR_PRESETS.admin_super;

  return AVATAR_PRESETS.chw_john;
};

/**
 * Returns a patient avatar based on name or ID
 */
export const getAvatarForPatient = (patientNameOrId: string, sex?: string): string => {
  const query = (patientNameOrId || '').toLowerCase();
  if (query.includes('maria') || query.includes('santos') || query.includes('pt-2026-0001')) return AVATAR_PRESETS.pat_maria;
  if (query.includes('ahmed') || query.includes('robinson') || query.includes('pt-2026-0002')) return AVATAR_PRESETS.pat_ahmed;
  if (query.includes('priya') || query.includes('patel') || query.includes('pt-2026-0003')) return AVATAR_PRESETS.pat_priya;
  if (query.includes('james') || query.includes('wilson') || query.includes('pt-2026-0004')) return AVATAR_PRESETS.pat_james;
  if (query.includes('fatima') || query.includes('al-rashid') || query.includes('pt-2026-0005')) return AVATAR_PRESETS.pat_fatima;
  if (query.includes('carlos') || query.includes('rivera') || query.includes('pt-2026-0006')) return AVATAR_PRESETS.pat_carlos;
  if (query.includes('amina') || query.includes('diop')) return AVATAR_PRESETS.pat_amina;

  // Fallback by sex
  if (sex?.toLowerCase() === 'male') return AVATAR_PRESETS.pat_carlos;
  return AVATAR_PRESETS.pat_maria;
};
