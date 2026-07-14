import client from './client';
import type {
  IntakeMessageResponse,
  IntakeStartResponse,
  NoShowRiskDto,
  RecommendResponse,
  SoapFormatResponse,
  TriageResponse,
  TriageSummary,
} from '../types';

export async function recommend(description: string): Promise<RecommendResponse> {
  const res = await client.post<RecommendResponse>('/ai/recommend', { description });
  return res.data;
}

export async function intakeStart(): Promise<IntakeStartResponse> {
  const res = await client.post<IntakeStartResponse>('/ai/intake/start', {});
  return res.data;
}

export async function intakeMessage(
  sessionId: string,
  message: string,
): Promise<IntakeMessageResponse> {
  const res = await client.post<IntakeMessageResponse>('/ai/intake/message', {
    sessionId,
    message,
  });
  return res.data;
}

export async function intakeManual(
  payload: TriageSummary & { appointmentId: string },
): Promise<void> {
  await client.post('/ai/intake/manual', payload);
}

export async function getTriage(appointmentId: string): Promise<TriageResponse> {
  const res = await client.get<TriageResponse>(`/ai/triage/${appointmentId}`);
  return res.data;
}

export async function soapFormat(rawNotes: string): Promise<SoapFormatResponse> {
  const res = await client.post<SoapFormatResponse>('/ai/soap-format', { rawNotes });
  return res.data;
}

export async function getNoShowRisk(date: string): Promise<NoShowRiskDto[]> {
  const res = await client.get<NoShowRiskDto[]>('/ai/no-show-risk', { params: { date } });
  return res.data;
}
