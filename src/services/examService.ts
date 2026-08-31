import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, cleanFirestoreData, OperationType } from './firebase';
import { Exam, ExamResult } from '../types';

const EXAMS_COLLECTION = 'exams';
const RESULTS_COLLECTION = 'results';

export const examService = {
  /**
   * Fetches published exams (accessible by students and staff)
   */
  getPublishedExams: async (): Promise<Exam[]> => {
    try {
      const colRef = collection(db, EXAMS_COLLECTION);
      const q = query(colRef, where('status', '==', 'published'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Exam, 'id'>),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, EXAMS_COLLECTION);
    }
  },

  /**
   * Fetches all exams (Restricted to exam_editor / staff / super_admin)
   */
  getAllExams: async (): Promise<Exam[]> => {
    try {
      const colRef = collection(db, EXAMS_COLLECTION);
      const snap = await getDocs(colRef);
      const exams = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Exam, 'id'>),
      }));
      // Sort newest first
      return exams.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, EXAMS_COLLECTION);
    }
  },

  /**
   * Fetches single exam by ID
   */
  getExamById: async (examId: string): Promise<Exam | null> => {
    try {
      const docRef = doc(db, EXAMS_COLLECTION, examId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return {
        id: snap.id,
        ...(snap.data() as Omit<Exam, 'id'>),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${EXAMS_COLLECTION}/${examId}`);
    }
  },

  /**
   * Creates a new examination schedule
   */
  createExam: async (examData: Omit<Exam, 'id'>): Promise<string> => {
    try {
      const colRef = collection(db, EXAMS_COLLECTION);
      const now = new Date().toISOString();
      const payload = cleanFirestoreData({
        ...examData,
        createdAt: examData.createdAt || now,
        updatedAt: now,
      });
      const docRef = await addDoc(colRef, payload);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, EXAMS_COLLECTION);
    }
  },

  /**
   * Updates an existing exam
   */
  updateExam: async (examId: string, examData: Partial<Exam>): Promise<void> => {
    try {
      const docRef = doc(db, EXAMS_COLLECTION, examId);
      const now = new Date().toISOString();
      const payload = cleanFirestoreData({
        ...examData,
        updatedAt: now,
      });
      await updateDoc(docRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${EXAMS_COLLECTION}/${examId}`);
    }
  },

  /**
   * Deletes an exam schedule and optionally its associated result entries
   */
  deleteExam: async (examId: string): Promise<void> => {
    try {
      // 1. Delete associated results in batch
      const resultsColRef = collection(db, RESULTS_COLLECTION);
      const q = query(resultsColRef, where('examId', '==', examId));
      const resultsSnap = await getDocs(q);

      const batch = writeBatch(db);
      resultsSnap.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      // 2. Delete the exam doc
      const examDocRef = doc(db, EXAMS_COLLECTION, examId);
      batch.delete(examDocRef);

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${EXAMS_COLLECTION}/${examId}`);
    }
  },

  /**
   * Toggles publish status for an exam and all its marks records
   */
  publishExam: async (examId: string, publish: boolean): Promise<void> => {
    try {
      const now = new Date().toISOString();
      const batch = writeBatch(db);

      // Update exam doc
      const examDocRef = doc(db, EXAMS_COLLECTION, examId);
      const examPayload = cleanFirestoreData({
        status: publish ? 'published' : 'completed',
        publishedAt: publish ? now : '',
        updatedAt: now,
      });
      batch.update(examDocRef, examPayload);

      // Update all results for this exam
      const resultsColRef = collection(db, RESULTS_COLLECTION);
      const q = query(resultsColRef, where('examId', '==', examId));
      const resultsSnap = await getDocs(q);

      resultsSnap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          published: publish,
          updatedAt: now,
        });
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${EXAMS_COLLECTION}/${examId}`);
    }
  },

  /**
   * Fetches published scorecards for a specific student
   */
  getResultsByStudentId: async (studentId: string, admissionNumber?: string): Promise<ExamResult[]> => {
    try {
      const colRef = collection(db, RESULTS_COLLECTION);
      const q = query(
        colRef,
        where('studentId', '==', studentId),
        where('published', '==', true)
      );
      const snap = await getDocs(q);
      const results: ExamResult[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ExamResult, 'id'>),
      }));

      // If admissionNumber is provided and different from studentId, check if any additional results were keyed by admissionNumber
      if (admissionNumber && admissionNumber !== studentId) {
        const qAdm = query(
          colRef,
          where('admissionNumber', '==', admissionNumber),
          where('published', '==', true)
        );
        const snapAdm = await getDocs(qAdm);
        snapAdm.docs.forEach((docSnap) => {
          if (!results.some((r) => r.id === docSnap.id)) {
            results.push({
              id: docSnap.id,
              ...(docSnap.data() as Omit<ExamResult, 'id'>),
            });
          }
        });
      }

      return results;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, RESULTS_COLLECTION);
    }
  },

  /**
   * Fetches all scorecards for an exam (Restricted to exam_editor / staff / super_admin)
   */
  getResultsByExamId: async (examId: string): Promise<ExamResult[]> => {
    try {
      const colRef = collection(db, RESULTS_COLLECTION);
      const q = query(colRef, where('examId', '==', examId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ExamResult, 'id'>),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, RESULTS_COLLECTION);
    }
  },

  /**
   * Fetches all results in the database
   */
  getAllResults: async (): Promise<ExamResult[]> => {
    try {
      const colRef = collection(db, RESULTS_COLLECTION);
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ExamResult, 'id'>),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, RESULTS_COLLECTION);
    }
  },

  /**
   * Saves or updates a single student's exam result
   */
  saveExamResult: async (resultData: Omit<ExamResult, 'id'>, existingId?: string): Promise<string> => {
    try {
      const now = new Date().toISOString();
      const payload = cleanFirestoreData({
        ...resultData,
        updatedAt: now,
      });

      if (existingId) {
        const docRef = doc(db, RESULTS_COLLECTION, existingId);
        await updateDoc(docRef, payload);
        return existingId;
      } else {
        // Check if an existing result document exists for this exam + student
        const colRef = collection(db, RESULTS_COLLECTION);
        const q = query(
          colRef,
          where('examId', '==', resultData.examId),
          where('studentId', '==', resultData.studentId)
        );
        const existingSnap = await getDocs(q);

        if (!existingSnap.empty) {
          const matchedDoc = existingSnap.docs[0];
          await updateDoc(matchedDoc.ref, payload);
          return matchedDoc.id;
        }

        const createPayload = cleanFirestoreData({
          ...resultData,
          createdAt: resultData.createdAt || now,
          updatedAt: now,
        });

        const newDocRef = await addDoc(colRef, createPayload);
        return newDocRef.id;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, RESULTS_COLLECTION);
    }
  },

  /**
   * Batch saves or updates multiple students' exam results
   */
  batchSaveExamResults: async (
    results: Array<{ data: Omit<ExamResult, 'id'>; id?: string }>
  ): Promise<void> => {
    try {
      if (results.length === 0) return;
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      results.forEach((item) => {
        if (item.id) {
          const docRef = doc(db, RESULTS_COLLECTION, item.id);
          const updatePayload = cleanFirestoreData({
            ...item.data,
            updatedAt: now,
          });
          batch.update(docRef, updatePayload);
        } else {
          const docRef = doc(collection(db, RESULTS_COLLECTION));
          const setPayload = cleanFirestoreData({
            ...item.data,
            createdAt: item.data.createdAt || now,
            updatedAt: now,
          });
          batch.set(docRef, setPayload);
        }
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, RESULTS_COLLECTION);
    }
  },

  /**
   * Deletes a single result record
   */
  deleteResult: async (resultId: string): Promise<void> => {
    try {
      const docRef = doc(db, RESULTS_COLLECTION, resultId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${RESULTS_COLLECTION}/${resultId}`);
    }
  },
};
