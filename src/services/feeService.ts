import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Fee, FeeStatus, Payment, PaymentStatus } from '../types';

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
   * Fetches all fee records (Restricted to accountant / staff / super_admin)
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
   * Fetches single fee by ID
   */
  getFeeById: async (feeId: string): Promise<Fee | null> => {
    try {
      const docRef = doc(db, FEES_COLLECTION, feeId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return {
        id: snap.id,
        ...(snap.data() as Omit<Fee, 'id'>),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${FEES_COLLECTION}/${feeId}`);
    }
  },

  /**
   * Creates a new fee assessment (Restricted to Accountant / Super Admin)
   */
  createFee: async (
    feeData: Omit<Fee, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    try {
      const now = new Date().toISOString();
      const colRef = collection(db, FEES_COLLECTION);
      const docRef = await addDoc(colRef, {
        ...feeData,
        amountDue: Number(feeData.amountDue) || 0,
        discount: Number(feeData.discount) || 0,
        status: feeData.status || 'pending',
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, FEES_COLLECTION);
    }
  },

  /**
   * Updates an existing fee record (Restricted to Accountant / Super Admin)
   */
  updateFee: async (
    feeId: string,
    updates: Partial<Omit<Fee, 'id' | 'createdAt'>>
  ): Promise<void> => {
    try {
      const docRef = doc(db, FEES_COLLECTION, feeId);
      const now = new Date().toISOString();
      await updateDoc(docRef, {
        ...updates,
        ...(updates.amountDue !== undefined ? { amountDue: Number(updates.amountDue) } : {}),
        ...(updates.discount !== undefined ? { discount: Number(updates.discount) } : {}),
        updatedAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${FEES_COLLECTION}/${feeId}`);
    }
  },

  /**
   * Deletes a fee assessment (Restricted to Accountant / Super Admin)
   */
  deleteFee: async (feeId: string): Promise<void> => {
    try {
      const docRef = doc(db, FEES_COLLECTION, feeId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${FEES_COLLECTION}/${feeId}`);
    }
  },

  /**
   * Batch creates fee assessments for multiple students (e.g. whole class)
   */
  batchCreateFees: async (
    feesData: Array<Omit<Fee, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<{ count: number }> => {
    try {
      const now = new Date().toISOString();
      const batch = writeBatch(db);
      const colRef = collection(db, FEES_COLLECTION);

      for (const item of feesData) {
        const docRef = doc(colRef);
        batch.set(docRef, {
          ...item,
          amountDue: Number(item.amountDue) || 0,
          discount: Number(item.discount) || 0,
          status: item.status || 'pending',
          createdAt: now,
          updatedAt: now,
        });
      }

      await batch.commit();
      return { count: feesData.length };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, FEES_COLLECTION);
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
   * Fetches payments linked to a specific fee ID
   */
  getPaymentsByFeeId: async (feeId: string): Promise<Payment[]> => {
    try {
      const colRef = collection(db, PAYMENTS_COLLECTION);
      const q = query(colRef, where('feeId', '==', feeId));
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
   * Fetches all payment transactions (Restricted to accountant / staff / super_admin)
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

  /**
   * Records a payment transaction and automatically updates the fee's status
   */
  recordPayment: async (
    paymentData: Omit<Payment, 'id' | 'createdAt'>
  ): Promise<{ paymentId: string; receiptNumber: string; newFeeStatus: FeeStatus }> => {
    try {
      const now = new Date().toISOString();
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const generatedReceipt =
        paymentData.receiptNumber ||
        `REC-${new Date().getFullYear()}-${randomSuffix}`;
      const generatedTxn =
        paymentData.transactionId ||
        `TXN-${Date.now()}-${randomSuffix}`;

      const colRef = collection(db, PAYMENTS_COLLECTION);
      const paymentDocRef = await addDoc(colRef, {
        ...paymentData,
        amount: Number(paymentData.amount) || 0,
        receiptNumber: generatedReceipt,
        transactionId: generatedTxn,
        status: paymentData.status || 'success',
        paidAt: paymentData.paidAt || now,
        createdAt: now,
      });

      let newFeeStatus: FeeStatus = 'paid';

      // If tied to a specific fee, calculate new balance and update fee record
      if (paymentData.feeId && paymentData.feeId !== 'general_advance') {
        try {
          const feeDocRef = doc(db, FEES_COLLECTION, paymentData.feeId);
          const feeSnap = await getDoc(feeDocRef);
          if (feeSnap.exists()) {
            const fee = feeSnap.data() as Fee;
            const netDue = Math.max(0, (fee.amountDue || 0) - (fee.discount || 0));

            // Fetch all payments for this fee
            const existingPayments = await feeService.getPaymentsByFeeId(paymentData.feeId);
            const totalPaid = existingPayments.reduce(
              (sum, p) => (p.status === 'success' ? sum + (Number(p.amount) || 0) : sum),
              0
            );

            if (totalPaid >= netDue && netDue > 0) {
              newFeeStatus = 'paid';
            } else if (totalPaid > 0) {
              newFeeStatus = 'partially_paid';
            } else {
              // check overdue
              const isOverdue = fee.dueDate && new Date(fee.dueDate) < new Date();
              newFeeStatus = isOverdue ? 'overdue' : 'pending';
            }

            await updateDoc(feeDocRef, {
              status: newFeeStatus,
              updatedAt: now,
            });
          }
        } catch (feeUpdateErr) {
          console.warn('Could not auto-update fee status after payment:', feeUpdateErr);
        }
      }

      return {
        paymentId: paymentDocRef.id,
        receiptNumber: generatedReceipt,
        newFeeStatus,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, PAYMENTS_COLLECTION);
    }
  },
};

