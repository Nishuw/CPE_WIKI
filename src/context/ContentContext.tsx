import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  loading: boolean; // Expose loading state
  error: string | null; // Expose error state
  addTopic: (title: string, parentId: string | null) => Promise<void>;
  updateTopic: (id: string, title: string) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  moveTopic: (topicId: string, newParentId: string | null) => Promise<void>; // Add moveTopic
  addContent: (topicId: string, title: string, body: string) => Promise<void>;
  updateContent: (id: string, title: string, body: string) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  getTopicById: (id: string) => Topic | undefined;
  getContentById: (id: string) => Content | undefined;
  getContentsByTopicId: (topicId: string) => Content[];
  getChildTopics: (parentId: string | null) => Topic[];
  getTopicDescendants: (topicId: string) => Topic[]; // Add getTopicDescendants
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Firestore Listeners --- 
  useEffect(() => {
    if (!isAuthenticated) {
      setTopics([]);
      setContents([]);
      setLoading(false);
      return; 
    }

    setLoading(true);
    setError(null);

    const topicsQuery = query(collection(db, 'topics'));
    const contentsQuery = query(collection(db, 'contents'));

    const unsubscribeTopics = onSnapshot(topicsQuery, (snapshot) => {
      const topicsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure createdAt/updatedAt are handled if needed, Firestore Timestamps might need conversion
      })) as Topic[];
      setTopics(topicsData);
      setLoading(false); // Consider setting loading false only after both listeners are ready
    }, (err) => {
      console.error("ContentContext: Error listening to topics:", err);
      setError('Falha ao carregar os tópicos.');
      setLoading(false);
    });

    const unsubscribeContents = onSnapshot(contentsQuery, (snapshot) => {
      const contentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Content[];
      setContents(contentsData);
      // Consider setting loading false only after both listeners are ready
    }, (err) => {
      console.error("ContentContext: Error listening to contents:", err);
      setError('Falha ao carregar os conteúdos.');
      setLoading(false);
    });

    return () => {
      unsubscribeTopics();
      unsubscribeContents();
    }
  }, [isAuthenticated]);

  // --- Helper: Get Topic Descendants (IDs) --- 
  // Memoize this helper based on the raw topics array
  const getAllDescendantTopicIds = useCallback((topicId: string, allTopics: Topic[]): string[] => {
    const children = allTopics.filter(topic => topic.parentId === topicId);
    let descendantIds = children.map(child => child.id);
    children.forEach(child => {
      descendantIds = [...descendantIds, ...getAllDescendantTopicIds(child.id, allTopics)];
    });
    return descendantIds;
  }, []); // Dependency array is empty as it only depends on its arguments

  // --- Helper: Get Topic Descendants (Full Objects) --- 
  const getTopicDescendants = useCallback((topicId: string): Topic[] => {
    const descendantIds = getAllDescendantTopicIds(topicId, topics);
    return topics.filter(topic => descendantIds.includes(topic.id));
  }, [topics, getAllDescendantTopicIds]); // Depends on topics state and the ID helper


  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^\w\s-]/g, '') // Remove non-word chars (excluding space and hyphen)
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single
  };

  // --- Firestore Write Operations --- 

  const addTopic = async (title: string, parentId: string | null) => {
    if (!user) throw new Error("Usuário não autenticado.");
    await addDoc(collection(db, 'topics'), {
      title,
      slug: createSlug(title),
      parentId,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // No need to update state manually, listener will catch it
  };

  const updateTopic = async (id: string, title: string) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const topicRef = doc(db, 'topics', id);
    await updateDoc(topicRef, {
      title,
      slug: createSlug(title),
      updatedAt: serverTimestamp(),
    });
  };

  // --- NEW: Move Topic --- 
  const moveTopic = async (topicId: string, newParentId: string | null) => {
    if (!user) throw new Error("Usuário não autenticado.");

    // Basic validation (Modal already prevents this, but good practice)
    if (topicId === newParentId) {
      throw new Error("Um tópico não pode ser movido para si mesmo.");
    }
    const descendants = getAllDescendantTopicIds(topicId, topics);
    if (newParentId !== null && descendants.includes(newParentId)) {
      throw new Error("Um tópico não pode ser movido para um de seus próprios descendentes.");
    }

    const topicRef = doc(db, 'topics', topicId);
    await updateDoc(topicRef, {
      parentId: newParentId,
      updatedAt: serverTimestamp(),
    });
     // Listener will update the state
  };

  const deleteTopic = async (id: string) => {
    if (!user) throw new Error("Usuário não autenticado.");

    const allTopicIdsToDelete = [id, ...getAllDescendantTopicIds(id, topics)];
    
    // Find related content more reliably
    const contentsRef = collection(db, 'contents');
    const q = query(contentsRef, where('topicId', 'in', allTopicIdsToDelete));
    const contentSnapshot = await getDocs(q);
    const contentIdsToDelete = contentSnapshot.docs.map(doc => doc.id);

    const batch = writeBatch(db);

    allTopicIdsToDelete.forEach(topicId => {
      batch.delete(doc(db, 'topics', topicId));
    });
    contentIdsToDelete.forEach(contentId => {
       batch.delete(doc(db, 'contents', contentId));
    });

    await batch.commit();
    // Listener will update the state
  };

  // --- Content Operations (simplified error handling for brevity) ---
  const addContent = async (topicId: string, title: string, body: string) => {
    if (!user) throw new Error("Usuário não autenticado.");
    await addDoc(collection(db, 'contents'), {
      topicId,
      title,
      body,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
    });
  };

  const updateContent = async (id: string, title: string, body: string) => {
    if (!user) throw new Error("Usuário não autenticado.");
    await updateDoc(doc(db, 'contents', id), {
      title,
      body,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteContent = async (id: string) => {
    if (!user) throw new Error("Usuário não autenticado.");
    await deleteDoc(doc(db, 'contents', id));
  };

  // --- Local State Getters (using current state) ---
  const getTopicById = useCallback((id: string) => {
    return topics.find(topic => topic.id === id);
  }, [topics]);

  const getContentById = useCallback((id: string) => {
    return contents.find(content => content.id === id);
  }, [contents]);

  const getContentsByTopicId = useCallback((topicId: string) => {
    return contents.filter(content => content.topicId === topicId);
  }, [contents]);

  const getChildTopics = useCallback((parentId: string | null) => {
    return topics.filter(topic => topic.parentId === parentId);
  }, [topics]);

  return (
    <ContentContext.Provider value={{
      topics,
      contents,
      loading,
      error,
      addTopic,
      updateTopic,
      deleteTopic,
      moveTopic, // Expose moveTopic
      addContent,
      updateContent,
      deleteContent,
      getTopicById,
      getContentById,
      getContentsByTopicId,
      getChildTopics,
      getTopicDescendants, // Expose getTopicDescendants
    }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent deve ser usado dentro de um ContentProvider');
  }
  return context;
};