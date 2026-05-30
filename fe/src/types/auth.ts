/**
 * Authentication Types
 * Matches backend DTOs and API responses
 */

// ==================== LOGIN ====================
export interface LoginDto {
  identifier: string; // username, email, or phone
  password: string; // min 8 chars
}


export interface LoginResponse {
  user: {
    id: string
    code: string
    role: {
      code: string
      permissions: string[]
    }
  }
  accessToken: string
  refreshToken: string
}


// ==================== USER ====================
export interface User {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  avatar?: string;
  roleId: string;
  role: {
    id: string;
    code: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ==================== REFRESH TOKEN ====================
export interface RefreshTokenDto {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

// ==================== CHANGE PASSWORD ====================
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string; // min 8 chars
}

// ==================== RESET PASSWORD ====================
export interface ResetPasswordDto {
  identifier: string; // email or phone
}

// ==================== UPDATE PROFILE ====================
export interface UpdateMeDto {
  fullName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  avatar?: string;
}

// ==================== CREATE USER ====================
export interface CreateUserTeacherProfileDto {
  yearsOfExperience?: number; // min 0
  description: string;
  classIds: string[]; // UUIDs, min 1
  specializationIds: string[]; // UUIDs, min 1
}

export interface CreateUserStudentProfileDto {
  classIds: string[]; // UUIDs, min 1
}

export interface CreateUserDto {
  code: string;
  password: string; // min 8 chars
  fullName: string;
  dateOfBirth: string; // ISO date
  phone: string;
  email?: string;
  address?: string;
  roleId: string; // UUID
  avatar?: string;
  teacherProfile?: CreateUserTeacherProfileDto;
  studentProfile?: CreateUserStudentProfileDto;
}

// ==================== UPDATE USER ====================
export interface UpdateUserTeacherProfileDto {
  yearsOfExperience?: number;
  description?: string;
  classIds?: string[];
  specializationIds?: string[];
}

export interface UpdateUserStudentProfileDto {
  classIds?: string[];
}

export interface UpdateUserDto {
  code?: string;
  fullName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  roleId?: string;
  avatar?: string;
  teacherProfile?: UpdateUserTeacherProfileDto;
  studentProfile?: UpdateUserStudentProfileDto;
}

// ==================== USER QUERY ====================
export interface UserQueryDto {
  isActive?: boolean;
  search?: string;
  code?: string;
  phone?: string;
  email?: string;
  roleId?: string; // UUID
  roleCode?: string;
  classId?: string; // UUID
  centerId?: string; // UUID
  specializationId?: string; // UUID
}

// ==================== AUTH CONTEXT ====================
export interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

// ==================== API RESPONSE ====================
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  error: string | null

  login: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void> 
  refreshAccessToken: () => Promise<void>
}
