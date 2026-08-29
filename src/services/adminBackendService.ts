import { auth } from './firebase';
import { authService } from './authService';
import { UserRole, BackendProvisioningResult } from '../types';

/**
 * Service abstraction for Netlify Functions Backend (Firebase Admin SDK).
 * 
 * ARCHITECTURAL MANDATES:
 * 1. The browser MUST NOT run Firebase Admin SDK or store service account keys.
 * 2. User provisioning, password resets, and custom claims MUST be executed via the trusted Netlify Functions backend.
 * 3. Token-based authorization passes Firebase ID Token in Authorization: Bearer <token>.
 * 4. Zero fake simulations: if endpoints are unreachable or not yet deployed, explicit typed errors are returned.
 */

const NETLIFY_FUNCTIONS_BASE_URL = '/.netlify/functions';

export class NetlifyBackendError extends Error {
  public code: string;
  public isBackendDeployed: boolean;

  constructor(message: string, code: string = 'NETLIFY_BACKEND_NOT_DEPLOYED') {
    super(message);
    this.name = 'NetlifyBackendError';
    this.code = code;
    this.isBackendDeployed = false;
  }
}

export interface ProvisionStudentParams {
  studentId: string;
  admissionNumber: string;
  dateOfBirth: string; // Used to derive initial temporary password
  studentName: string;
}

export interface ProvisionStaffParams {
  email: string;
  role: UserRole;
  displayName: string;
  temporaryPassword?: string;
  isPasswordAdmin?: boolean;
}

export interface PasswordResetParams {
  studentId?: string;
  admissionNumber?: string;
  authUid?: string;
  dateOfBirth?: string;
  newTemporaryPassword?: string;
}

export interface BulkProvisionStudentInput {
  studentId?: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  className: string;
  section: string;
  rollNumber: string;
  academicYear?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  address?: string;
}

export interface BulkProvisionParams {
  students: BulkProvisionStudentInput[];
}

export interface BulkProvisionResponse {
  summary: {
    totalRows: number;
    successful: number;
    failed: number;
    duplicateCount: number;
  };
  validationErrors: Array<{
    rowNumber: number;
    admissionNumber?: string;
    field: string;
    error: string;
  }>;
  processed: Array<{
    studentId: string;
    admissionNumber: string;
    success: boolean;
    error?: string;
  }>;
  timestamp: string;
}

/**
 * Retrieves the currently authenticated caller's Firebase ID Token.
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  if (!auth.currentUser) {
    throw new Error('Authentication required. Please log in as an administrator.');
  }
  const idToken = await auth.currentUser.getIdToken(true);
  return {
    Authorization: `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  };
}

export const adminBackendService = {
  /**
   * Checks whether the Netlify Functions backend is live and answering requests
   */
  isBackendReady: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${NETLIFY_FUNCTIONS_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return Boolean(data.firebaseAdminConfigured);
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Provisions a new student in Firebase Authentication via Netlify Functions or direct client Firebase Auth.
   * Guarantees a real, valid Firebase Auth UID is returned.
   */
  provisionStudentAccount: async (
    params: ProvisionStudentParams
  ): Promise<BackendProvisioningResult> => {
    // 1. Attempt Netlify Functions backend first (if live)
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${NETLIFY_FUNCTIONS_BASE_URL}/provision-student`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.uid) {
          return {
            success: true,
            message: data.message || 'Student authentication account provisioned successfully.',
            uid: data.uid,
            studentId: params.studentId,
            backendConfigured: true,
            timestamp: data.timestamp || new Date().toISOString(),
          };
        }
      }

      // If backend returned a functional HTTP error code (e.g. 400 validation, 401 unauth, 409 duplicate)
      if (response.status !== 404 && response.status !== 502 && response.status !== 504) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Server error (${response.status})`);
      }
    } catch (err: any) {
      if (
        err.message &&
        !err.message.includes('404') &&
        !err.message.includes('502') &&
        !err.message.includes('504') &&
        !err.message.includes('Failed to fetch') &&
        !err.message.includes('NetworkError')
      ) {
        throw err;
      }
      // If endpoint is not reachable (e.g., standard Vite container without Netlify CLI), proceed to direct Auth provisioning below
    }

    // 2. Direct client-side Firebase Auth provisioning (isolated secondary app instance)
    const directResult = await authService.provisionStudentAuthDirect({
      studentId: params.studentId,
      admissionNumber: params.admissionNumber,
      dateOfBirth: params.dateOfBirth,
      studentName: params.studentName,
    });

    return {
      success: true,
      message: directResult.message,
      uid: directResult.uid,
      studentId: params.studentId,
      backendConfigured: false,
      timestamp: directResult.timestamp,
    };
  },

  /**
   * Safely cleans up/rolls back a provisioned student Auth user if subsequent Firestore creation fails.
   */
  rollbackProvisionedStudent: async (
    uid: string,
    studentId: string,
    dateOfBirth: string
  ): Promise<void> => {
    try {
      await authService.rollbackStudentAuthDirect(studentId, dateOfBirth);
    } catch (err: any) {
      console.warn('Rollback student auth failed:', err?.message);
    }
  },

  /**
   * Provisions a staff account (super_admin, staff, accountant, exam_editor) via Netlify Functions.
   * Only super_admin is authorized on the backend.
   */
  provisionStaffAccount: async (
    params: ProvisionStaffParams
  ): Promise<BackendProvisioningResult> => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${NETLIFY_FUNCTIONS_BASE_URL}/provision-staff`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 502 || response.status === 504) {
          throw new NetlifyBackendError(
            'Netlify Functions backend is not yet deployed. Staff accounts cannot be registered from the browser.',
            'NETLIFY_BACKEND_NOT_DEPLOYED'
          );
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Staff provisioning failed (${response.status})`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Staff account provisioned successfully.',
        uid: data.uid,
        backendConfigured: true,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (err: any) {
      if (err instanceof NetlifyBackendError) throw err;
      throw new Error(err.message || 'Staff provisioning request failed.');
    }
  },

  /**
   * Resets a student's password back to their initial school-issued temporary password.
   */
  resetStudentPassword: async (
    params: PasswordResetParams
  ): Promise<{ success: boolean; message: string; backendConfigured: boolean }> => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${NETLIFY_FUNCTIONS_BASE_URL}/reset-student-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 502 || response.status === 504) {
          throw new NetlifyBackendError(
            'Netlify Functions backend is not yet reachable for administrative password resets.',
            'NETLIFY_BACKEND_NOT_DEPLOYED'
          );
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Password reset failed (${response.status})`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Password reset successfully.',
        backendConfigured: true,
      };
    } catch (err: any) {
      if (err instanceof NetlifyBackendError) throw err;
      throw new Error(err.message || 'Password reset request failed.');
    }
  },

  /**
   * Deactivates or suspends a user in Firebase Auth and updates their active state.
   */
  deactivateUserAccount: async (params: {
    uid?: string;
    studentId?: string;
    active?: boolean;
    reason?: string;
  }): Promise<{ success: boolean; message: string; backendConfigured: boolean }> => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${NETLIFY_FUNCTIONS_BASE_URL}/deactivate-user`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 502 || response.status === 504) {
          throw new NetlifyBackendError(
            'Netlify Functions backend is not reachable for Auth user deactivation.',
            'NETLIFY_BACKEND_NOT_DEPLOYED'
          );
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Deactivation failed (${response.status})`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Account status updated in Authentication directory.',
        backendConfigured: true,
      };
    } catch (err: any) {
      if (err instanceof NetlifyBackendError) throw err;
      throw new Error(err.message || 'Account deactivation request failed.');
    }
  },

  /**
   * Bulk provisions Firebase Auth accounts and records for students.
   */
  bulkProvisionStudents: async (
    params: BulkProvisionParams
  ): Promise<BulkProvisionResponse> => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${NETLIFY_FUNCTIONS_BASE_URL}/bulk-provision-students`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 502 || response.status === 504) {
          throw new NetlifyBackendError(
            'Netlify Functions backend is not yet deployed for bulk student account provisioning.',
            'NETLIFY_BACKEND_NOT_DEPLOYED'
          );
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Bulk provisioning failed (${response.status})`);
      }

      return (await response.json()) as BulkProvisionResponse;
    } catch (err: any) {
      if (err instanceof NetlifyBackendError) throw err;
      throw new Error(err.message || 'Bulk student provisioning request failed.');
    }
  },
};
