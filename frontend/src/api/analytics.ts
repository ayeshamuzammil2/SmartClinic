import client from './client';
import type {
  ConsultationDurationRow,
  InsuranceStatsRow,
  NoShowTrendRow,
  OccupancyRow,
} from '../types';

export type OccupancyPeriod = 'daily' | 'weekly';

export async function getOccupancy(period: OccupancyPeriod): Promise<OccupancyRow[]> {
  const res = await client.get<OccupancyRow[]>('/analytics/occupancy', { params: { period } });
  return res.data;
}

export async function getNoShowTrend(): Promise<NoShowTrendRow[]> {
  const res = await client.get<NoShowTrendRow[]>('/analytics/no-show-trend');
  return res.data;
}

export async function getConsultationDuration(): Promise<ConsultationDurationRow[]> {
  const res = await client.get<ConsultationDurationRow[]>('/analytics/consultation-duration');
  return res.data;
}

export async function getInsuranceStats(): Promise<InsuranceStatsRow[]> {
  const res = await client.get<InsuranceStatsRow[]>('/analytics/insurance');
  return res.data;
}
