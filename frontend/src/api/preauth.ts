import client from './client';
import type { InsuranceProvider, PreAuthDto, PreAuthStatus } from '../types';

export async function getPreAuths(status?: PreAuthStatus): Promise<PreAuthDto[]> {
  const res = await client.get<PreAuthDto[]>('/preauth', {
    params: status ? { status } : undefined,
  });
  return res.data;
}

export interface CreatePreAuthPayload {
  appointmentId: string;
  provider: InsuranceProvider;
  diagnosisCode: string;
  notes?: string;
}

export async function createPreAuth(payload: CreatePreAuthPayload): Promise<PreAuthDto> {
  const res = await client.post<PreAuthDto>('/preauth', payload);
  return res.data;
}

export async function updatePreAuthStatus(
  id: string,
  status: Exclude<PreAuthStatus, 'pending'>,
): Promise<PreAuthDto> {
  const res = await client.patch<PreAuthDto>(`/preauth/${id}/status`, { status });
  return res.data;
}
