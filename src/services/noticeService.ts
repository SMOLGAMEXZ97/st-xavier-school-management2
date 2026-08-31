import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Notice, NoticeStatus } from '../types';
import { INITIAL_NOTICES } from '../data/schoolData';

const NOTICES_COLLECTION = 'notices';

/**
 * NoticeService provides live, synchronized data access and full CRUD
 * capabilities for school announcements and circulars.
 */
export const noticeService = {
  /**
   * Fetches published notices from Firestore with initial fallback seed.
   * Draft notices are strictly excluded from public and student views.
   */
  getNotices: async (): Promise<Notice[]> => {
    try {
      const noticesCol = collection(db, NOTICES_COLLECTION);
      const snapshot = await getDocs(query(noticesCol));

      if (!snapshot.empty) {
        const firestoreNotices = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Notice, 'id'>),
          }))
          .filter((n) => n.status !== 'draft');

        return firestoreNotices.length > 0 ? firestoreNotices : INITIAL_NOTICES;
      }

      // If collection is empty, return default institutional notices
      return INITIAL_NOTICES;
    } catch (error) {
      console.warn('Firestore notices fetch returned local fallback:', error);
      return INITIAL_NOTICES;
    }
  },

  /**
   * Fetches ALL notices (including drafts) for administrative console view.
   */
  getAllNoticesForAdmin: async (): Promise<Notice[]> => {
    try {
      const noticesCol = collection(db, NOTICES_COLLECTION);
      const snapshot = await getDocs(query(noticesCol));

      if (!snapshot.empty) {
        return snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Notice, 'id'>),
        }));
      }

      return INITIAL_NOTICES;
    } catch (error) {
      console.warn('Firestore admin notices fetch error:', error);
      return INITIAL_NOTICES;
    }
  },

  /**
   * Subscribes to live published notice board updates for Public Website & Student Portal.
   * Draft notices are filtered out.
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
          const list = snapshot.docs
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<Notice, 'id'>),
            }))
            .filter((n) => n.status !== 'draft');

          onUpdate(list);
        } else {
          onUpdate(INITIAL_NOTICES);
        }
      },
      (err) => {
        onUpdate(INITIAL_NOTICES);
        if (onError) {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    );
  },

  /**
   * Subscribes to ALL notices (published + drafts) in real time for Super Admin & Staff.
   */
  subscribeToAllNotices: (
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
        onUpdate(INITIAL_NOTICES);
        if (onError) {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    );
  },

  /**
   * Creates a new notice in Firestore `/notices` collection.
   */
  createNotice: async (
    noticeData: Omit<Notice, 'id'>,
    authorEmail?: string
  ): Promise<string> => {
    try {
      const noticesCol = collection(db, NOTICES_COLLECTION);
      const newDocRef = doc(noticesCol);
      const now = new Date().toISOString();

      const newNotice: Record<string, any> = {
        title: noticeData.title.trim(),
        category: noticeData.category,
        date: noticeData.date || now.split('T')[0],
        status: noticeData.status || 'published',
        isUrgent: Boolean(noticeData.isUrgent),
        isNew: true,
        summary: noticeData.summary?.trim() || noticeData.content.slice(0, 150) + '...',
        content: noticeData.content.trim(),
        targetAudience: noticeData.targetAudience.trim() || 'All',
        createdAt: now,
        updatedAt: now,
      };

      if (noticeData.attachmentName?.trim()) {
        newNotice.attachmentName = noticeData.attachmentName.trim();
      }
      if (noticeData.attachmentUrl?.trim()) {
        newNotice.attachmentUrl = noticeData.attachmentUrl.trim();
      }
      if (authorEmail?.trim()) {
        newNotice.createdBy = authorEmail.trim();
      }

      await setDoc(newDocRef, newNotice);
      return newDocRef.id;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, NOTICES_COLLECTION);
      throw err;
    }
  },

  /**
   * Updates an existing notice in Firestore `/notices/{id}`.
   * If updating an initial seed notice that only exists in memory, writes it to Firestore.
   */
  updateNotice: async (
    id: string,
    updates: Partial<Omit<Notice, 'id'>>
  ): Promise<void> => {
    try {
      const docRef = doc(db, NOTICES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      const now = new Date().toISOString();

      const cleanedUpdates: Record<string, any> = {
        updatedAt: now,
      };

      if (updates.title !== undefined) cleanedUpdates.title = updates.title.trim();
      if (updates.category !== undefined) cleanedUpdates.category = updates.category;
      if (updates.date !== undefined) cleanedUpdates.date = updates.date;
      if (updates.status !== undefined) cleanedUpdates.status = updates.status;
      if (updates.isUrgent !== undefined) cleanedUpdates.isUrgent = Boolean(updates.isUrgent);
      if (updates.isNew !== undefined) cleanedUpdates.isNew = Boolean(updates.isNew);
      if (updates.summary !== undefined) cleanedUpdates.summary = updates.summary.trim();
      if (updates.content !== undefined) cleanedUpdates.content = updates.content.trim();
      if (updates.targetAudience !== undefined) cleanedUpdates.targetAudience = updates.targetAudience.trim();
      if (updates.attachmentName !== undefined) cleanedUpdates.attachmentName = updates.attachmentName.trim();
      if (updates.attachmentUrl !== undefined) cleanedUpdates.attachmentUrl = updates.attachmentUrl.trim();

      if (docSnap.exists()) {
        await updateDoc(docRef, cleanedUpdates);
      } else {
        // Find in initial notices to preserve base fields if first time editing seed notice
        const baseNotice: Partial<Notice> = INITIAL_NOTICES.find((n) => n.id === id) || {
          title: '',
          category: 'General',
          date: now.split('T')[0],
          status: 'published',
          summary: '',
          content: '',
          targetAudience: 'All',
        };

        await setDoc(docRef, {
          ...baseNotice,
          ...cleanedUpdates,
          createdAt: baseNotice.createdAt || now,
        });
      }
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `${NOTICES_COLLECTION}/${id}`);
      throw err;
    }
  },

  /**
   * Toggles publish status between 'draft' and 'published'.
   */
  togglePublishStatus: async (
    id: string,
    currentStatus?: NoticeStatus
  ): Promise<NoticeStatus> => {
    const newStatus: NoticeStatus = currentStatus === 'draft' ? 'published' : 'draft';
    await noticeService.updateNotice(id, { status: newStatus });
    return newStatus;
  },

  /**
   * Deletes a notice document from Firestore `/notices/{id}`.
   */
  deleteNotice: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, NOTICES_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `${NOTICES_COLLECTION}/${id}`);
      throw err;
    }
  },

  /**
   * Fetches a single notice by its document ID.
   */
  getNoticeById: async (id: string): Promise<Notice | undefined> => {
    try {
      const docRef = doc(db, NOTICES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...(docSnap.data() as Omit<Notice, 'id'>),
        };
      }
      return INITIAL_NOTICES.find((n) => n.id === id);
    } catch {
      return INITIAL_NOTICES.find((n) => n.id === id);
    }
  },
};
