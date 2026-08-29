import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Fee, Payment } from '../types';

const FEES_COLLECTION = 'fees';
const PAYMENTS_COLLECTION = 'payments';

export const feeService = {
  /**
   * Fetches fee assessments for a specific student
   */
  getFeesByStudentId: async (studentId: string): Promise<Fee[]> => {
    try {
      const colRef = collection(db, FEES_COLLECTION);
      const q = query(colRef, where('studentId', '==', studentId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Fee, 'id'>),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, FEES_COLLECTION);
    }
  },

  /**
   * Fetches all fee records (Restricted to accountant / super_admin)
   */
  getAllFees: async (): Promise<Fee[]> => {
    try {
      const colRef = collection(db, FEES_COLLECTION);
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Fee, 'id'>),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, FEES_COLLECTION);
    }
  },

  /**
   * Fetches payment receipts for a specific student
   */
  getPaymentsByStudentId: async (studentId: string): Promise<Payment[]> => {
    try {
      const colRef = collection(db, PAYMENTS_COLLECTION);
      const q = query(colRef, where('studentId', '==', studentId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Payment, 'id'>),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, PAYMENTS_COLLECTION);
    }
  },

  /**
   * Fetches all payment transactions (Restricted to accountant / super_admin)
   */
  getAllPayments: async (): Promise<Payment[]> => {
    try {
      const colRef = collection(db, PAYMENTS_COLLECTION);
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Payment, 'id'>),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, PAYMENTS_COLLECTION);
    }
  },
};
