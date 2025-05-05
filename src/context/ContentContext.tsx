import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// Importa os tipos necessários, incluindo Topic com o campo 'position' adicionado
import { Topic, Content, User } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../firebase'; // Importa a instância do Firestore
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch, // Importa writeBatch para operações atômicas
  serverTimestamp,
  onSnapshot // Importa onSnapshot para listeners em tempo real
} from 'firebase/firestore';

// Define a interface para o tipo do contexto
interface ContentContextType {
  topics: Topic[];
  contents: Content[];
  users: User[]; // Array de usuários
  loading: boolean; // Estado de carregamento combinado
  error: string | null; // Estado de erro
  addTopic: (title: string, parentId: string | null) => Promise<void>; // Precisa salvar 'position'
  updateTopic: (id: string, title: string) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  moveTopic: (topicId: string, newParentId: string | null) => Promise<void>; // Move para outro pai
  reorderTopic: (topicId: string, direction: 'up' | 'down') => Promise<void>; // <-- Assinatura adicionada
  addContent: (topicId: string, title: string, body: string) => Promise<void>;
  updateContent: (id: string, title: string, body: string) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  getTopicById: (id: string) => Topic | undefined;
  getContentById: (id: string) => Content | undefined;
  getContentsByTopicId: (topicId: string) => Content[];
  getChildTopics: (parentId: string | null) => Topic[]; // Já ordena por 'position'
  getTopicDescendants: (topicId: string) => Topic[]; // Busca descendentes (objetos)
  getUserByUid: (uid: string) => User | undefined; // Busca usuário por UID
}

// Cria o Contexto
const ContentContext = createContext<ContentContextType | undefined>(undefined);

// Cria o Provider do Contexto
export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth(); // Pega estado de autenticação
  const [topics, setTopics] = useState<Topic[]>([]); // Estado para tópicos
  const [contents, setContents] = useState<Content[]>([]); // Estado para conteúdos
  const [users, setUsers] = useState<User[]>([]); // Estado para usuários
  const [loadingTopics, setLoadingTopics] = useState(true); // Carregando tópicos
  const [loadingContents, setLoadingContents] = useState(true); // Carregando conteúdos
  const [loadingUsers, setLoadingUsers] = useState(true); // Carregando usuários
  const [error, setError] = useState<string | null>(null); // Estado de erro

  // Estado de carregamento combinado
  const loading = loadingTopics || loadingContents || loadingUsers;

  // --- Listeners do Firestore (Tempo Real) ---
  useEffect(() => {
    if (!isAuthenticated) {
      setTopics([]);
      setContents([]);
      setUsers([]);
      setLoadingTopics(false);
      setLoadingContents(false);
      setLoadingUsers(false);
      return;
    }

    const topicsQuery = query(collection(db, 'topics'));
    const unsubscribeTopics = onSnapshot(topicsQuery, (snapshot) => {
      const topicsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        position: doc.data().position ?? 0, // Garante valor padrão 0
      })) as Topic[];
      setTopics(topicsData);
      setLoadingTopics(false);
    }, (err) => {
      console.error("ContentContext: Error listening to topics:", err);
      setError('Falha ao carregar os tópicos.');
      setLoadingTopics(false);
    });

    const contentsQuery = query(collection(db, 'contents'));
    const unsubscribeContents = onSnapshot(contentsQuery, (snapshot) => {
      const contentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Content[];
      setContents(contentsData);
      setLoadingContents(false);
    }, (err) => {
      console.error("ContentContext: Error listening to contents:", err);
      setError('Falha ao carregar os conteúdos.');
      setLoadingContents(false);
    });

    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
        setUsers(usersData);
        setLoadingUsers(false);
    }, (err) => {
        console.error("ContentContext: Error listening to users:", err);
        setError('Falha ao carregar os usuários.');
        setLoadingUsers(false);
    });

    return () => {
      unsubscribeTopics();
      unsubscribeContents();
      unsubscribeUsers();
    }

  }, [isAuthenticated]);

  // --- Funções Auxiliares ---
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
    // (mesma função createSlug de antes)
    return title
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // --- Operações de Escrita no Firestore ---
  const addTopic = async (title: string, parentId: string | null) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const siblings = topics.filter(topic => topic.parentId === parentId);
    const initialPosition = siblings.length; // Posição base 0 (0, 1, 2...)
    await addDoc(collection(db, 'topics'), {
      title,
      slug: createSlug(title),
      parentId,
      position: initialPosition, // Salva a posição inicial
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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

  const moveTopic = async (topicId: string, newParentId: string | null) => {
    // (mesma função moveTopic de antes, com a lógica básica de posição)
    if (!user) throw new Error("Usuário não autenticado.");
    if (topicId === newParentId) throw new Error("Um tópico não pode ser movido para si mesmo.");
    const descendants = getAllDescendantTopicIds(topicId, topics);
    if (newParentId !== null && descendants.includes(newParentId)) {
      throw new Error("Um tópico não pode ser movido para um de seus próprios descendentes.");
    }
    const newSiblings = topics.filter(t => t.parentId === newParentId);
    const newPosition = newSiblings.length; // Coloca no final da nova lista

    const topicRef = doc(db, 'topics', topicId);
    await updateDoc(topicRef, {
      parentId: newParentId,
      position: newPosition,
      updatedAt: serverTimestamp(),
    });
  };

  // *** FUNÇÃO DE REORDENAR TÓPICO IMPLEMENTADA ***
  const reorderTopic = async (topicId: string, direction: 'up' | 'down') => {
    if (!user) throw new Error("Usuário não autenticado.");

    const topicToMove = topics.find(t => t.id === topicId);
    if (!topicToMove) {
      console.error("reorderTopic: Tópico não encontrado com ID:", topicId);
      throw new Error("Tópico não encontrado.");
    }

    const siblings = topics.filter(t => t.parentId === topicToMove.parentId);
    siblings.sort((a, b) => a.position - b.position); // Ordena pela posição atual

    const currentIndex = siblings.findIndex(t => t.id === topicId);
    if (currentIndex === -1) {
        console.error("reorderTopic: Tópico não encontrado entre os irmãos:", topicId, siblings);
        throw new Error("Erro interno ao encontrar o tópico entre os irmãos.");
    }

    let targetIndex = -1;
    if (direction === 'up') {
      if (currentIndex === 0) return; // Já está no topo
      targetIndex = currentIndex - 1;
    } else { // direction === 'down'
      if (currentIndex === siblings.length - 1) return; // Já está na base
      targetIndex = currentIndex + 1;
    }

    const swapWithTopic = siblings[targetIndex];
    if (!swapWithTopic) {
         console.error("reorderTopic: Tópico para troca não encontrado:", targetIndex, siblings);
         throw new Error("Erro interno ao encontrar o tópico para troca.");
    }

    // Prepara o batch write
    const batch = writeBatch(db);
    const topicToMoveRef = doc(db, 'topics', topicToMove.id);
    const swapWithTopicRef = doc(db, 'topics', swapWithTopic.id);

    // Troca as posições
    batch.update(topicToMoveRef, { position: swapWithTopic.position });
    batch.update(swapWithTopicRef, { position: topicToMove.position });

    // Atualiza timestamps (opcional, mas bom para rastreamento)
    batch.update(topicToMoveRef, { updatedAt: serverTimestamp() });
    batch.update(swapWithTopicRef, { updatedAt: serverTimestamp() });

    // Executa o batch
    try {
      await batch.commit();
      console.log(`reorderTopic: Tópico ${topicId} movido ${direction}.`);
    } catch (error) {
      console.error("reorderTopic: Erro ao commitar o batch:", error);
      throw new Error("Falha ao reordenar o tópico.");
    }
  };
  // *** FIM DA FUNÇÃO reorderTopic ***


  const deleteTopic = async (id: string) => {
    // (mesma função deleteTopic de antes)
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
    // (mesma função addContent de antes)
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
    // (mesma função updateContent de antes)
    if (!user) throw new Error("Usuário não autenticado.");
    await updateDoc(doc(db, 'contents', id), {
      title,
      body,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteContent = async (id: string) => {
    // (mesma função deleteContent de antes)
     if (!user) throw new Error("Usuário não autenticado.");
    await deleteDoc(doc(db, 'contents', id));
  };

  // --- Getters que usam o estado local ---
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
      // Ordena pela posição antes de retornar
      children.sort((a, b) => a.position - b.position);
      return children;
  }, [topics]);

  // --- Retorno do Provider ---
  return (
    <ContentContext.Provider value={{
      topics,
      contents,
      users,
      loading,
      error,
      addTopic,
      updateTopic,
      deleteTopic,
      moveTopic,
      reorderTopic, // <-- Função exposta
      addContent,
      updateContent,
      deleteContent,
      getTopicById,
      getContentById,
      getContentsByTopicId,
      getChildTopics, // Já ordenado
      getTopicDescendants,
      getUserByUid,
    }}>
      {children}
    </ContentContext.Provider>
  );
};

// --- Hook Customizado ---
export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent deve ser usado dentro de um ContentProvider');
  }
  return context;
};