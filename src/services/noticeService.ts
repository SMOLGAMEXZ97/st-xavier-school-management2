import { collection, getDocs, onSnapshot, query, Unsubscribe } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Notice } from '../types';
import { INITIAL_NOTICES } from '../data/schoolData';

const NOTICES_COLLECTION = 'notices';

/**
 * NoticeService provides live and fallback data access for school announcements.
 */
export const noticeService = {
  /**
   * Fetches notices from Firestore with initial fallback seed.
   */
  getNotices: async (): Promise<Notice[]> => {
    try {
      const noticesCol = collection(db, NOTICES_COLLECTION);
      const snapshot = await getDocs(query(noticesCol));

      if (!snapshot.empty) {
        const firestoreNotices = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Notice, 'id'>),
        }));
        return firestoreNotices;
      }

      // If collection is empty, return default institutional notices
      return INITIAL_NOTICES;
    } catch (error) {
      console.warn('Firestore notices fetch returned local fallback:', error);
      return INITIAL_NOTICES;
    }
  },

  /**
   * Subscribes to live notice board updates via Firestore onSnapshot.
   */
  subscribeToNotices: (
    onUpdate: (notices: Notice[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe => {
    const noticesCol = collection(db, NOTICES_COLLECTION);

    return onSnapshot(
      noticesCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Notice, 'id'>),
          }));
          onUpdate(list);
        } else {
          onUpdate(INITIAL_NOTICES);
        }
      },
      (err) => {
        console.warn('Real-time notices listener fallback to initial notices:', err);
        onUpdate(INITIAL_NOTICES);
        if (onError) {
          try {
            handleFirestoreError(err, OperationType.GET, NOTICES_COLLECTION);
          } catch (wrappedError) {
            onError(wrappedError as Error);
          }
        }
      }
    );
  },

  getNoticeById: async (id: string): Promise<Notice | undefined> => {
    const notices = await noticeService.getNotices();
    return notices.find((n) => n.id === id);
  },
};
