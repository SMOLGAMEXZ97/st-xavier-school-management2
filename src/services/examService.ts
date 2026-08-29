import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
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
   * Fetches all exams (Restricted to exam_editor / super_admin)
   */
  getAllExams: async (): Promise<Exam[]> => {
    try {
      const colRef = collection(db, EXAMS_COLLECTION);
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Exam, 'id'>),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, EXAMS_COLLECTION);
    }
  },

  /**
   * Fetches published scorecards for a specific student
   */
  getResultsByStudentId: async (studentId: string): Promise<ExamResult[]> => {
    try {
      const colRef = collection(db, RESULTS_COLLECTION);
      const q = query(
        colRef,
        where('studentId', '==', studentId),
        where('published', '==', true)
      );
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
   * Fetches all scorecards for an exam (Restricted to exam_editor / super_admin)
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
};
