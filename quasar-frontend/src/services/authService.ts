import { api } from 'boot/axios';
import type {
  AuthUser,
  LoginCredentials,
  MagicLoginVerifyResponse,
  MagicOtpVerifyResponse,
  MockThaIdLoginPayload,
} from '../types/auth';

async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const response = await api.post<AuthUser>('/api/users/login', credentials);
  return response.data;
}

async function getUserProfile(userId: number): Promise<AuthUser> {
  const response = await api.get<AuthUser>(`/api/users/${userId}`);
  return response.data;
}

async function loginWithMockThaId(
  payload: MockThaIdLoginPayload,
): Promise<AuthUser> {
  const response = await api.post<AuthUser>(
    '/api/auth/thaid/mock/login',
    payload,
  );
  return response.data;
}

async function verifyMagicLogin(
  token: string,
  magicSessionToken?: string,
): Promise<MagicLoginVerifyResponse> {
  const response = magicSessionToken
    ? await api.get<MagicLoginVerifyResponse>(`/api/tasks/${token}/login-verify`, {
      headers: { 'x-magic-session': magicSessionToken },
    })
    : await api.get<MagicLoginVerifyResponse>(`/api/tasks/${token}/login-verify`);

  return response.data;
}

async function requestMagicOtp(token: string): Promise<void> {
  await api.post(`/api/tasks/${token}/otp`);
}

async function verifyMagicOtp(
  token: string,
  otp: string,
): Promise<MagicOtpVerifyResponse> {
  const response = await api.post<MagicOtpVerifyResponse>(
    `/api/tasks/${token}/verify`,
    { otp },
  );

  return response.data;
}

export const authService = {
  login,
  loginWithMockThaId,
  getUserProfile,
  verifyMagicLogin,
  requestMagicOtp,
  verifyMagicOtp,
};
