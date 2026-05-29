import { apiPost, apiGet, apiPut, apiDelete } from "./apiClient";

// ==================== AUTH SERVICES ====================
export const authService = {
  /**
   * User login
   * @param username - Username or email
   * @param password - User password
   */
  login: (username: string, password: string) =>
    apiPost("/auth/login", { username, password }),

  /**
   * User registration
   */
  register: (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }) => apiPost("/auth/register", userData),

  /**
   * Refresh token
   */
  refreshToken: (refreshToken: string) =>
    apiPost("/auth/refresh", { refreshToken }),

  /**
   * Logout
   */
  logout: () => apiPost("/auth/logout"),

  /**
   * Get current user info
   */
  getCurrentUser: () => apiGet("/auth/me"),

  /**
   * Update user profile
   */
  updateProfile: (userId: string, profileData: any) =>
    apiPut(`/users/${userId}/profile`, profileData),

  /**
   * Change password
   */
  changePassword: (userId: string, passwordData: {
    oldPassword: string;
    newPassword: string;
  }) => apiPost(`/users/${userId}/change-password`, passwordData),
};

// ==================== COURSES SERVICES ====================
export const courseService = {
  /**
   * Get all courses with pagination
   */
  getAllCourses: (page?: number, limit?: number) =>
    apiGet("/courses", { page, limit }),

  /**
   * Get single course by ID
   */
  getCourseById: (courseId: string) =>
    apiGet(`/courses/${courseId}`),

  /**
   * Create new course (admin only)
   */
  createCourse: (courseData: any) =>
    apiPost("/courses", courseData),

  /**
   * Update course (admin only)
   */
  updateCourse: (courseId: string, courseData: any) =>
    apiPut(`/courses/${courseId}`, courseData),

  /**
   * Delete course (admin only)
   */
  deleteCourse: (courseId: string) =>
    apiDelete(`/courses/${courseId}`),

  /**
   * Get course details with lessons
   */
  getCourseDetails: (courseId: string) =>
    apiGet(`/courses/${courseId}/details`),
};

// ==================== EXAMS SERVICES ====================
export const examService = {
  /**
   * Get all exams
   */
  getAllExams: (courseId?: string) =>
    apiGet("/exams", { courseId }),

  /**
   * Get exam by ID
   */
  getExamById: (examId: string) =>
    apiGet(`/exams/${examId}`),

  /**
   * Create exam (admin only)
   */
  createExam: (examData: any) =>
    apiPost("/exams", examData),

  /**
   * Submit exam answers
   */
  submitExam: (examId: string, answers: Record<string, any>) =>
    apiPost(`/exams/${examId}/submit`, { answers }),

  /**
   * Get exam result
   */
  getExamResult: (examId: string, userId: string) =>
    apiGet(`/exams/${examId}/results/${userId}`),
};

// ==================== STUDENTS SERVICES ====================
export const studentService = {
  /**
   * Get all students (admin only)
   */
  getAllStudents: (page?: number, limit?: number) =>
    apiGet("/students", { page, limit }),

  /**
   * Get student by ID
   */
  getStudentById: (studentId: string) =>
    apiGet(`/students/${studentId}`),

  /**
   * Get student progress
   */
  getStudentProgress: (studentId: string) =>
    apiGet(`/students/${studentId}/progress`),

  /**
   * Get student exam history
   */
  getStudentExamHistory: (studentId: string) =>
    apiGet(`/students/${studentId}/exam-history`),
};

// ==================== TEACHERS SERVICES ====================
export const teacherService = {
  /**
   * Get all teachers
   */
  getAllTeachers: () =>
    apiGet("/teachers"),

  /**
   * Get teacher by ID
   */
  getTeacherById: (teacherId: string) =>
    apiGet(`/teachers/${teacherId}`),

  /**
   * Get teacher courses
   */
  getTeacherCourses: (teacherId: string) =>
    apiGet(`/teachers/${teacherId}/courses`),
};
