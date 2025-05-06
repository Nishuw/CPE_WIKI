export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  parentId: string | null; // Corrigi para 'parentId' conforme o código do ContentContext
  createdAt: any; // Usando 'any' para timestamps do Firebase
  updatedAt: any; // Adicionado: Timestamp da última atualização
  createdBy: string;
  updatedBy: string; // Adicionado: UID do último usuário que atualizou
  position: number;
}

export interface Content {
  id: string;
  topicId: string;
  title: string;
  body: string;
  createdAt: any; // Usando 'any' para timestamps do Firebase
  updatedAt: any; // Adicionado aqui também para consistência
  createdBy: string;
  updatedBy: string; // Adicionado aqui também
}