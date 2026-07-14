import client from './client';
import type { IcdCode, RecordFileDto, VisitRecordDto } from '../types';

export async function getRecords(patientId?: string): Promise<VisitRecordDto[]> {
  const res = await client.get<VisitRecordDto[]>('/records', {
    params: patientId ? { patientId } : undefined,
  });
  return res.data;
}

export async function getRecord(id: string): Promise<VisitRecordDto> {
  const res = await client.get<VisitRecordDto>(`/records/${id}`);
  return res.data;
}

export interface RecordFields {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  icdCodes?: IcdCode[];
}

export async function createRecord(
  payload: RecordFields & { appointmentId: string },
): Promise<VisitRecordDto> {
  const res = await client.post<VisitRecordDto>('/records', payload);
  return res.data;
}

export async function updateRecord(
  id: string,
  payload: RecordFields & { finalize?: boolean },
): Promise<VisitRecordDto> {
  const res = await client.patch<VisitRecordDto>(`/records/${id}`, payload);
  return res.data;
}

export async function uploadRecordFile(recordId: string, file: File): Promise<RecordFileDto> {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post<RecordFileDto>(`/records/${recordId}/files`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/** Streams the file with the auth header, then triggers a browser download. */
export async function downloadRecordFile(recordId: string, file: RecordFileDto): Promise<void> {
  const res = await client.get<Blob>(`/records/${recordId}/files/${file.id}`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
