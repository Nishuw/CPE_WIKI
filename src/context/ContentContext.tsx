import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Topic, Content, User } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
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
  onSnapshot
} from 'firebase/firestore';

// Interface para o alerta da HomePage
export interface HomePageAlert {
  alertaTexto: string;
  alertaAtivo: boolean;
}

interface ContentContextType {
  topics: Topic[];
  contents: Content[];
  users: User[];
  loading: boolean;
  error: string | null;
  homePageAlert: HomePageAlert | null;
  loadingHomePageAlert: boolean;
  addTopic: (title: string, parentId: string | null) => Promise<void>;
  updateTopic: (id: string, title: string) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  moveTopic: (topicId: string, newParentId: string | null) => Promise<void>;
  reorderTopic: (topicId: string, direction: 'up' | 'down') => Promise<void>;
  addContent: (topicId: string, title: string, body: string) => Promise<void>;
  updateContent: (id: string, title: string, body: string) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  getTopicById: (id: string) => Topic | undefined;
  getContentById: (id: string) => Content | undefined;
  getContentsByTopicId: (topicId: string) => Content[];
  getChildTopics: (parentId: string | null) => Topic[];
  getTopicDescendants: (topicId: string) => Topic[];
  getUserByUid: (uid: string) => User | undefined;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, appUser, isAuthenticated } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingContents, setLoadingContents] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [homePageAlert, setHomePageAlert] = useState<HomePageAlert | null>(null);
  const [loadingHomePageAlert, setLoadingHomePageAlert] = useState(true);

  const loading = loadingTopics || loadingContents || loadingUsers || loadingHomePageAlert;

  useEffect(() => {
    if (!isAuthenticated) {
      setTopics([]);
      setContents([]);
      setUsers([]);
      setHomePageAlert({ alertaTexto: '', alertaAtivo: false });
      setLoadingTopics(false);
      setLoadingContents(false);
      setLoadingUsers(false);
      setLoadingHomePageAlert(false);
      return;
    }
    
    setLoadingTopics(true);
    setLoadingContents(true);
    setLoadingUsers(true);
    setLoadingHomePageAlert(true);

    const topicsQuery = query(collection(db, 'topics'));
    const unsubscribeTopics = onSnapshot(topicsQuery, (snapshot) => {
      const topicsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        position: doc.data().position ?? 0,
      })) as Topic[];
      setTopics(topicsData);
      setLoadingTopics(false);
    }, (err) => {
      // console.error("ContentContext: Error listening to topics:", err);
      setError('Falha ao carregar os tópicos.');
      setLoadingTopics(false);
    });

    const contentsQuery = query(collection(db, 'contents'));
    const unsubscribeContents = onSnapshot(contentsQuery, (snapshot) => {
      const contentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Content[];
      setContents(contentsData);
      setLoadingContents(false);
    }, (err) => {
      // console.error("ContentContext: Error listening to contents:", err);
      setError('Falha ao carregar os conteúdos.');
      setLoadingContents(false);
    });

    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
        setUsers(usersData);
        setLoadingUsers(false);
    }, (err) => {
        // console.error("ContentContext: Error listening to users:", err); 
        setLoadingUsers(false);
    });

    const alertDocRef = doc(db, 'configuracoesSite', 'mensagemHomePage');
    const unsubscribeAlert = onSnapshot(alertDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setHomePageAlert(docSnap.data() as HomePageAlert);
      } else {
        setHomePageAlert({ alertaTexto: '', alertaAtivo: false }); // Default se não existir
      }
      setLoadingHomePageAlert(false);
    }, (err) => {
      // console.error("ContentContext: Error listening to homepage alert:", err);
      setLoadingHomePageAlert(false);
      setHomePageAlert({ alertaTexto: '', alertaAtivo: false }); // Estado padrão em caso de erro
    });

    return () => {
      unsubscribeTopics();
      unsubscribeContents();
      unsubscribeUsers();
      unsubscribeAlert();
    }

  }, [isAuthenticated]);

  const getAllDescendantTopicIds = useCallback((topicId: string, allTopics: Topic[]): string[] => {
    const children = allTopics.filter(topic => topic.parentId === topicId);
    let descendantIds = children.map(child => child.id);
    children.forEach(child => {
      descendantIds = [...descendantIds, ...getAllDescendantTopicIds(child.id, allTopics)];
    });
    return descendantIds;
  }, []);

  const getTopicDescendants = useCallback((topicId: string): Topic[] => {
    const descendantIds = getAllDescendantTopicIds(topicId, topics);
    return topics.filter(topic => descendantIds.includes(topic.id));
  }, [topics, getAllDescendantTopicIds]);

  const getUserByUid = useCallback((uid: string): User | undefined => {
    return users.find(user => user.id === uid);
  }, [users]);

  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const addTopic = async (title: string, parentId: string | null) => {
    if (!user || !appUser) throw new Error("Usuário não autenticado ou dados do appUser não disponíveis.");
    const siblings = topics.filter(topic => topic.parentId === parentId);
    const initialPosition = siblings.length;
    const username = appUser.username || 'Desconhecido';
    await addDoc(collection(db, 'topics'), {
      title,
      slug: createSlug(title),
      parentId,
      position: initialPosition,
      createdBy: user.uid,
      createdByUsername: username,
      updatedBy: user.uid,
      updatedByUsername: username,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateTopic = async (id: string, title: string) => {
    if (!user || !appUser) throw new Error("Usuário não autenticado ou dados do appUser não disponíveis.");
    const topicRef = doc(db, 'topics', id);
    const username = appUser.username || 'Desconhecido';
    await updateDoc(topicRef, {
      title,
      slug: createSlug(title),
      updatedBy: user.uid,
      updatedByUsername: username,
      updatedAt: serverTimestamp(),
    });
  };

  const moveTopic = async (topicId: string, newParentId: string | null) => {
    if (!user || !appUser) throw new Error("Usuário não autenticado ou dados do appUser não disponíveis.");
    if (topicId === newParentId) throw new Error("Um tópico não pode ser movido para si mesmo.");
    const descendants = getAllDescendantTopicIds(topicId, topics);
    if (newParentId !== null && descendants.includes(newParentId)) {
      throw new Error("Um tópico não pode ser movido para um de seus próprios descendentes.");
    }
    const newSiblings = topics.filter(t => t.parentId === newParentId);
    const newPosition = newSiblings.length;
    const username = appUser.username || 'Desconhecido';

    const topicRef = doc(db, 'topics', topicId);
    await updateDoc(topicRef, {
      parentId: newParentId,
      position: newPosition,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      updatedByUsername: username,
    });
  };

  const reorderTopic = async (topicId: string, direction: 'up' | 'down') => {
    if (!user || !appUser) throw new Error("Usuário não autenticado ou dados do appUser não disponíveis.");
    const username = appUser.username || 'Desconhecido';

    const topicToMove = topics.find(t => t.id === topicId);
    if (!topicToMove) {
      // console.error("reorderTopic: Tópico não encontrado com ID:", topicId);
      throw new Error("Tópico não encontrado.");
    }

    const siblings = topics.filter(t => t.parentId === topicToMove.parentId);
    siblings.sort((a, b) => a.position - b.position);

    const currentIndex = siblings.findIndex(t => t.id === topicId);
    if (currentIndex === -1) {
        // console.error("reorderTopic: Tópico não encontrado entre os irmãos:", topicId, siblings);
        throw new Error("Erro interno ao encontrar o tópico entre os irmãos.");
    }

    let targetIndex = -1;
    if (direction === 'up') {
      if (currentIndex === 0) return;
      targetIndex = currentIndex - 1;
    } else {
      if (currentIndex === siblings.length - 1) return;
      targetIndex = currentIndex + 1;
    }

    const swapWithTopic = siblings[targetIndex];
    if (!swapWithTopic) {
        //  console.error("reorderTopic: Tópico para troca não encontrado:", targetIndex, siblings);
         throw new Error("Erro interno ao encontrar o tópico para troca.");
    }

    const batch = writeBatch(db);
    const topicToMoveRef = doc(db, 'topics', topicToMove.id);
    const swapWithTopicRef = doc(db, 'topics', swapWithTopic.id);

    batch.update(topicToMoveRef, { position: swapWithTopic.position });
    batch.update(swapWithTopicRef, { position: topicToMove.position });

    batch.update(topicToMoveRef, { updatedAt: serverTimestamp(), updatedBy: user.uid, updatedByUsername: username });
    batch.update(swapWithTopicRef, { updatedAt: serverTimestamp(), updatedBy: user.uid, updatedByUsername: username });

    try {
      await batch.commit();
      // console.log(`reorderTopic: Tópico ${topicId} movido ${direction}.`);
    } catch (error) {
      // console.error("reorderTopic: Erro ao commitar o batch:", error);
      throw new Error("Falha ao reordenar o tópico.");
    }
  };

  const deleteTopic = async (id: string) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const allTopicIdsToDelete = [id, ...getAllDescendantTopicIds(id, topics)];
    const contentsRef = collection(db, 'contents');
    const q = query(contentsRef, where('topicId', 'in', allTopicIdsToDelete));
    const contentSnapshot = await getDocs(q);
    const contentIdsToDelete = contentSnapshot.docs.map(doc => doc.id);
    const batch = writeBatch(db);
    allTopicIdsToDelete.forEach(topicId => { batch.delete(doc(db, 'topics', topicId)); });
    contentIdsToDelete.forEach(contentId => { batch.delete(doc(db, 'contents', contentId)); });
    await batch.commit();
  };

  const addContent = async (topicId: string, title: string, body: string) => {
     if (!user || !appUser) throw new Error("Usuário não autenticado ou dados do appUser não disponíveis.");
     const username = appUser.username || 'Desconhecido';
    await addDoc(collection(db, 'contents'), {
      topicId,
      title,
      body,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
      createdByUsername: username,
      updatedBy: user.uid,
      updatedByUsername: username,
    });
  };

  const updateContent = async (id: string, title: string, body: string) => {
    if (!user || !appUser) throw new Error("Usuário não autenticado ou dados do appUser não disponíveis.");
    const username = appUser.username || 'Desconhecido';
    await updateDoc(doc(db, 'contents', id), {
      title,
      body,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      updatedByUsername: username,
    });
  };

  const deleteContent = async (id: string) => {
     if (!user) throw new Error("Usuário não autenticado.");
    await deleteDoc(doc(db, 'contents', id));
  };

  const getTopicById = useCallback((id: string) => {
    return topics.find(topic => topic.id === id);
  }, [topics]);

  const getContentById = useCallback((id: string) => {
      return contents.find((content) => content.id === id);
  }, [contents]);

  const getContentsByTopicId = useCallback((topicId: string) => {
    return contents.filter(content => content.topicId === topicId);
  }, [contents]);

  const getChildTopics = useCallback((parentId: string | null): Topic[] => {
      const children = topics.filter(topic => topic.parentId === parentId);
      children.sort((a, b) => a.position - b.position);
      return children;
  }, [topics]);

  return (
    <ContentContext.Provider value={{
      topics,
      contents,
      users,
      loading,
      error,
      homePageAlert,
      loadingHomePageAlert,
      addTopic,
      updateTopic,
      deleteTopic,
      moveTopic,
      reorderTopic,
      addContent,
      updateContent,
      deleteContent,
      getTopicById,
      getContentById,
      getContentsByTopicId,
      getChildTopics,
      getTopicDescendants,
      getUserByUid,
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
