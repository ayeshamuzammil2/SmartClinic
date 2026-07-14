import client from './client';
import type { DoctorDto } from '../types';

export async function getDoctors(specialty?: string): Promise<DoctorDto[]> {
  const res = await client.get<DoctorDto[]>('/doctors', {
    params: specialty ? { specialty } : undefined,
  });
  return res.data;
}

export async function getSpecialties(): Promise<string[]> {
  const res = await client.get<string[]>('/specialties');
  return res.data;
}
