import {
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AdmissionInquiry, ContactMessage } from '../types';

/**
 * Generates an alphanumeric identifier that satisfies Firestore regex security rules:
 * ^[a-zA-Z0-9_\-]+$ and length <= 128
 */
function generateSecureId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${randomSuffix}`;
}

const INQUIRIES_COLLECTION = 'inquiries';
const CONTACT_MESSAGES_COLLECTION = 'contact_messages';

/**
 * InquiryService handles student admission applications with Firestore persistence.
 */
export const inquiryService = {
  /**
   * Submit an admission application lead
   */
  submitInquiry: async (
    inquiry: AdmissionInquiry
  ): Promise<{ success: boolean; id: string; message: string }> => {
    const docId = generateSecureId('inq');
    const path = `${INQUIRIES_COLLECTION}/${docId}`;
    const createdAt = new Date().toISOString();

    const payload = {
      studentName: inquiry.studentName.trim(),
      parentName: inquiry.parentName.trim(),
      phone: inquiry.phone.trim(),
      gradeApplying: inquiry.gradeApplying,
      ...(inquiry.email?.trim() ? { email: inquiry.email.trim() } : {}),
      ...(inquiry.dateOfBirth?.trim() ? { dateOfBirth: inquiry.dateOfBirth.trim() } : {}),
      ...(inquiry.gender?.trim() ? { gender: inquiry.gender.trim() } : {}),
      ...(inquiry.previousSchool?.trim() ? { previousSchool: inquiry.previousSchool.trim() } : {}),
      ...(inquiry.address?.trim() ? { address: inquiry.address.trim() } : {}),
      ...(inquiry.message?.trim() ? { message: inquiry.message.trim() } : {}),
      status: 'pending',
      createdAt,
    };

    try {
      const docRef = doc(db, INQUIRIES_COLLECTION, docId);
      await setDoc(docRef, payload);

      // Local backup cache
      try {
        const existing = JSON.parse(localStorage.getItem('stxavier_inquiries') || '[]');
        existing.unshift({ ...payload, id: docId });
        localStorage.setItem('stxavier_inquiries', JSON.stringify(existing));
      } catch {
        // Non-critical local storage fallback
      }

      return {
        success: true,
        id: docId,
        message:
          'Your admission inquiry has been received and securely registered. Our admissions office will contact you within 24–48 hours.',
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  /**
   * Fetches all admission inquiries for authorized staff and administrators
   */
  getAllInquiries: async (): Promise<AdmissionInquiry[]> => {
    try {
      const colRef = collection(db, INQUIRIES_COLLECTION);
      const snap = await getDocs(colRef);
      const inquiries: AdmissionInquiry[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AdmissionInquiry, 'id'>),
      }));

      // Sort descending by createdAt (newest first)
      return inquiries.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, INQUIRIES_COLLECTION);
    }
  },

  /**
   * Updates status and optional administrative follow-up notes of an inquiry
   */
  updateInquiryStatus: async (
    id: string,
    status: 'pending' | 'contacted' | 'enrolled' | 'rejected' | string,
    notes?: string
  ): Promise<void> => {
    const path = `${INQUIRIES_COLLECTION}/${id}`;
    try {
      const docRef = doc(db, INQUIRIES_COLLECTION, id);
      const updateData: Record<string, any> = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (notes !== undefined) {
        updateData.notes = notes.trim();
      }
      await updateDoc(docRef, updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  /**
   * Updates only the internal administrative notes of an inquiry
   */
  updateInquiryNotes: async (id: string, notes: string): Promise<void> => {
    const path = `${INQUIRIES_COLLECTION}/${id}`;
    try {
      const docRef = doc(db, INQUIRIES_COLLECTION, id);
      await updateDoc(docRef, {
        notes: notes.trim(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  /**
   * Deletes an inquiry document
   */
  deleteInquiry: async (id: string): Promise<void> => {
    const path = `${INQUIRIES_COLLECTION}/${id}`;
    try {
      const docRef = doc(db, INQUIRIES_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },
};

/**
 * ContactService handles general parent and visitor inquiries with Firestore persistence.
 */
export const contactService = {
  sendMessage: async (
    message: ContactMessage
  ): Promise<{ success: boolean; id: string; message: string }> => {
    const docId = generateSecureId('msg');
    const path = `${CONTACT_MESSAGES_COLLECTION}/${docId}`;
    const createdAt = new Date().toISOString();

    const payload = {
      name: message.name.trim(),
      phone: message.phone.trim(),
      subject: message.subject.trim(),
      message: message.message.trim(),
      ...(message.email?.trim() ? { email: message.email.trim() } : {}),
      createdAt,
    };

    try {
      const docRef = doc(db, CONTACT_MESSAGES_COLLECTION, docId);
      await setDoc(docRef, payload);

      // Local backup cache
      try {
        const existing = JSON.parse(localStorage.getItem('stxavier_contact_messages') || '[]');
        existing.unshift({ ...payload, id: docId });
        localStorage.setItem('stxavier_contact_messages', JSON.stringify(existing));
      } catch {
        // Non-critical local storage fallback
      }

      return {
        success: true,
        id: docId,
        message:
          'Thank you for writing to us. The school administration has received your message in real-time and will respond shortly.',
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  /**
   * Fetches all general contact messages for authorized staff and administrators
   */
  getAllContactMessages: async (): Promise<ContactMessage[]> => {
    try {
      const colRef = collection(db, CONTACT_MESSAGES_COLLECTION);
      const snap = await getDocs(colRef);
      const messages: ContactMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ContactMessage, 'id'>),
      }));

      return messages.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, CONTACT_MESSAGES_COLLECTION);
    }
  },

  /**
   * Deletes a contact message document
   */
  deleteContactMessage: async (id: string): Promise<void> => {
    const path = `${CONTACT_MESSAGES_COLLECTION}/${id}`;
    try {
      const docRef = doc(db, CONTACT_MESSAGES_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },
};
