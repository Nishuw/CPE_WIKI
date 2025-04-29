import React, { createContext, useContext, useState, useEffect } from 'react';
import { Topic, Content } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../firebase'; // Import your firebase db instance
import { 
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  onSnapshot // Import onSnapshot here
} from 'firebase/firestore';

interface ContentContextType {
  topics: Topic[];
  contents: Content[];
  addTopic: (title: string, parentId: string | null) => Promise<void>;
  updateTopic: (id: string, title: string) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  addContent: (topicId: string, title: string, body: string) => Promise<void>;
  updateContent: (id: string, title: string, body: string) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  getTopicById: (id: string) => Topic | undefined;
  getContentById: (id: string) => Content | undefined;
  getContentsByTopicId: (topicId: string) => Content[];
  getChildTopics: (parentId: string | null) => Topic[];
}

// Remove initial mock data as we will fetch from Firestore
// const initialTopics: Topic[] = [...];
// const initialContents: Content[] = [...];

const ContentContext = createContext<ContentContextType | undefined>(undefined);
export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth(); // Use isAuthenticated from AuthContext
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Firestore Listeners for Topics and Contents ---
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear data if not authenticated
      setTopics([]);
      setContents([]);
      setLoading(false);
      return; // Stop if not authenticated
    }

    setLoading(true);
    setError(null);

    const topicsCollection = collection(db, 'topics');
    const contentsCollection = collection(db, 'contents');

    const unsubscribeTopics = onSnapshot(topicsCollection, (snapshot) => {
      console.log("ContentContext: Topics snapshot received.", snapshot.size, "documents.");
      const topicsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Topic[];
      setTopics(topicsData);
      setLoading(false);
    }, (err) => {
      console.error("ContentContext: Error listening to topics:", err);
      setError('Failed to load topics.');
      setLoading(false);
    });

    const unsubscribeContents = onSnapshot(contentsCollection, (snapshot) => {
       console.log("ContentContext: Contents snapshot received.", snapshot.size, "documents.");
      const contentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Content[];
      setContents(contentsData);
      setLoading(false);
    }, (err) => {
      console.error("ContentContext: Error listening to contents:", err);
      setError('Failed to load contents.');
      setLoading(false);
    });

    // Cleanup listeners
    return () => {
      unsubscribeTopics();
      unsubscribeContents();
    };

  }, [isAuthenticated]); // Re-run when authentication status changes

  // --- Helper to find all descendant topics ---
  const getAllDescendantTopicIds = (topicId: string, allTopics: Topic[]): string[] => {
    const children = allTopics.filter(topic => topic.parentId === topicId);
    let descendantIds = children.map(child => child.id);
    children.forEach(child => {
      descendantIds = [...descendantIds, ...getAllDescendantTopicIds(child.id, allTopics)];
    });
    return descendantIds;
  };

  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/gi, '') // Allow hyphens in slug
      .replace(/\s+/g, '-');
  };

  // --- Firestore Write Operations ---

  const addTopic = async (title: string, parentId: string | null) => {
    if (!user) { console.error("User not authenticated."); return; }
    try {
      await addDoc(collection(db, 'topics'), {
        title,
        slug: createSlug(title),
        parentId,
        // createdBy: user.id, // This was causing the error. User object might not have id yet or it's undefined.
        // Using user.uid from Firebase Auth User object instead.
        createdBy: user.uid, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error adding topic: ", e);
      setError('Failed to add topic.');
    }
  };

  const updateTopic = async (id: string, title: string) => {
    if (!user) { console.error("User not authenticated."); return; }
    try {
      const topicRef = doc(db, 'topics', id);
      await updateDoc(topicRef, {
        title,
        slug: createSlug(title),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error updating topic: ", e);
       setError('Failed to update topic.');
    }
  };

  const deleteTopic = async (id: string) => {
    if (!user) { console.error("User not authenticated."); return; }

    // Find all descendant topics and associated content
    const allTopicIdsToDelete = [id, ...getAllDescendantTopicIds(id, topics)];
    const contentToDelete = contents.filter(content => allTopicIdsToDelete.includes(content.topicId));

    // Use a batched write for atomic deletion
    const batch = writeBatch(db);

    try {
      // Add topic deletions to batch
      allTopicIdsToDelete.forEach(topicId => {
        const topicRef = doc(db, 'topics', topicId);
        batch.delete(topicRef);
      });

      // Add content deletions to batch
      contentToDelete.forEach(contentItem => {
        const contentRef = doc(db, 'contents', contentItem.id);
        batch.delete(contentRef);
      });

      // Commit the batch
      await batch.commit();
      console.log("Batch delete successful.");
      // State will be updated by the onSnapshot listeners

    } catch (e) {
      console.error("Error performing batched delete:", e);
      setError('Failed to delete topic and associated content.');
       // Optionally revert local state if batch fails? Or rely on re-fetching/listeners?
       // For now, let listeners handle it, as they should report the current state.
    }
  };

  const addContent = async (topicId: string, title: string, body: string) => {
     if (!user) { console.error("User not authenticated."); return; }
    try {
      await addDoc(collection(db, 'contents'), {
        topicId,
        title,
        body,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid, // Use user.uid here as well
      });
    } catch (e) {
      console.error("Error adding content: ", e);
       setError('Failed to add content.');
    }
  };

  const updateContent = async (id: string, title: string, body: string) => {
     if (!user) { console.error("User not authenticated."); return; }
    try {
      const contentRef = doc(db, 'contents', id);
      await updateDoc(contentRef, {
        title,
        body,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error updating content: ", e);
       setError('Failed to update content.');
    }
  };

  const deleteContent = async (id: string) => {
     if (!user) { console.error("User not authenticated."); return; }
    try {
      await deleteDoc(doc(db, 'contents', id));
    } catch (e) {
      console.error("Error deleting content:", e);
       setError('Failed to delete content.');
    }
  };

  // --- Local State Getters ---
  // These still use the local state which is kept in sync by listeners

  const getTopicById = (id: string) => {
    return topics.find(topic => topic.id === id);
  };

  const getContentById = (id: string) => {
    return contents.find(content => content.id === id);
  };

  const getContentsByTopicId = (topicId: string) => {
    return contents.filter(content => content.topicId === topicId);
  };

  const getChildTopics = (parentId: string | null) => {
    return topics.filter(topic => topic.parentId === parentId);
  };


  return (
    <ContentContext.Provider value={{
      topics,
      contents,
      addTopic,
      updateTopic,
      deleteTopic,
      addContent,
      updateContent,
      deleteContent,
      getTopicById,
      getContentById,
      getContentsByTopicId,
      getChildTopics,
    }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};