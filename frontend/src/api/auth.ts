import client from './client';
import type { AuthResponse, UserDto } from '../types';

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>('/auth/register', payload);
  return res.data;
}

export async function getMe(): Promise<UserDto> {
  const res = await client.get<UserDto>('/auth/me');
  return res.data;
}
