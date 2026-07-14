export enum Role {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  RECEPTIONIST = 'receptionist',
  ADMIN = 'admin',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum PreAuthStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const SPECIALTIES = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Orthopaedics',
] as const;

export const INSURANCE_PROVIDERS = ['MedGulf', 'AXA', 'Bupa'] as const;
