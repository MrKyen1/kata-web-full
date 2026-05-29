import { apiPost, apiPatch, apiGet } from '../api/apiClient';
import { ApiResponse } from '../api/axiosConfig';

/**
 * Auth Service - Handles all authentication API calls
 */

// Types based on backend DTOs
interface LoginDto {
  identifier: string; // Can be username, email, or phone
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    code: string;
    fullName: string;
    email: string;
    phone: string;
    avatar?: string;
    roleId: string;
    role: {
      id: string;
      code: string;
      name: string;
    };
  };
}

interface RefreshTokenDto {
  refreshToken: string;
}

interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

interface UpdateMeDto {
  fullName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  avatar?: string;
}

/**
 * Login user
 * @param identifier - Username, email, or phone
 * @param password - User password (min 8 chars)
 * @returns Login response with tokens and user data
 */
export async function login(identifier: string, password: string): Promise<LoginResponse> {
  try {
    const loginDto: LoginDto = {
      identifier,
      password,
    };

    const response = await apiPost<LoginResponse>('/v1/auth/login', loginDto);
    return response;
  } catch (error) {
    console.error('[Auth Service] Login failed:', error);
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 * @param refreshToken - Refresh token from login
 * @returns New access token
 */
export async function refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
  try {
    const dto: RefreshTokenDto = { refreshToken };
    const response = await apiPost<{ accessToken: string }>('/v1/auth/refresh', dto);
    return response;
  } catch (error) {
    console.error('[Auth Service] Token refresh failed:', error);
    throw error;
  }
}

/**
 * Logout user - clear tokens from backend
 */
export async function logout(): Promise<void> {
  try {
    await apiPost('/v1/auth/logout', {});
  } catch (error) {
    console.error('[Auth Service] Logout error:', error);
    // Continue with local logout even if API call fails
  }
}

/**
 * Change password
 * @param currentPassword - Current password
 * @param newPassword - New password (min 8 chars)
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    const dto: ChangePasswordDto = {
      currentPassword,
      newPassword,
    };
    await apiPatch('/v1/auth/change-password', dto);
  } catch (error) {
    console.error('[Auth Service] Change password failed:', error);
    throw error;
  }
}

/**
 * Reset password - send reset link to email/phone
 * @param identifier - Email or phone number
 */
export async function resetPassword(identifier: string): Promise<void> {
  try {
    await apiPost('/v1/auth/reset-password', { identifier });
  } catch (error) {
    console.error('[Auth Service] Reset password failed:', error);
    throw error;
  }
}

/**
 * Update current user profile
 * @param data - Profile data to update
 */
export async function updateMe(data: UpdateMeDto): Promise<LoginResponse['user']> {
  try {
    const response = await apiPatch<LoginResponse['user']>('/v1/auth/me', data);
    return response;
  } catch (error) {
    console.error('[Auth Service] Update profile failed:', error);
    throw error;
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<LoginResponse['user']> {
  try {
    const response = await apiGet<LoginResponse['user']>('/v1/auth/me');
    return response;
  } catch (error) {
    console.error('[Auth Service] Get current user failed:', error);
    throw error;
  }
}
